import { db } from './firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  setDoc,
  DocumentReference
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { notificationService } from './notification-service';
import { getRiskAssessment } from './risk-assessment';

// Custom types for Firebase compatibility
type Timestamp = Date;

export interface KycDocument {
  id?: string;
  userId: string;
  type: 'id_document' | 'proof_of_address' | 'selfie' | 'bank_statement';
  status: 'pending' | 'approved' | 'rejected';
  documentUrl: string;
  verificationNotes?: string;
  metadata?: {
    expiryDate?: Timestamp;
    documentNumber?: string;
    documentType?: string;
    issueDate?: Timestamp;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface KycVerification {
  id?: string;
  userId: string;
  status: 'incomplete' | 'pending_review' | 'approved' | 'rejected';
  riskScore?: number;
  requiredDocuments: {
    id_document: boolean;
    proof_of_address: boolean;
    selfie: boolean;
    bank_statement: boolean;
  };
  verificationNotes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

class KycService {
  private storage = getStorage();

  async initializeKyc(userId: string): Promise<KycVerification> {
    const verificationData: Omit<KycVerification, 'id'> = {
      userId,
      status: 'incomplete',
      requiredDocuments: {
        id_document: false,
        proof_of_address: false,
        selfie: false,
        bank_statement: false
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await addDoc(collection(db, 'kyc_verifications'), verificationData);
    return { id: docRef.id, ...verificationData };
  }

  // Document upload functionality
  async uploadDocument(
    userId: string, 
    file: File, 
    documentType: KycDocument['type'],
    metadata?: Partial<KycDocument['metadata']>
  ): Promise<KycDocument> {
    try {
      // Create storage reference
      const fileExtension = file.name.split('.').pop();
      const fileName = `kyc/${userId}/${documentType}_${Date.now()}.${fileExtension}`;
      const storageRef = ref(this.storage, fileName);

      // Upload file
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Create document record
      const documentData: Omit<KycDocument, 'id'> = {
        userId,
        type: documentType,
        status: 'pending',
        documentUrl: downloadURL,
        metadata,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Save to Firestore
      const docRef = doc(collection(db, 'kyc_documents'));
      await setDoc(docRef, documentData);

      // Update verification status
      await this.updateRequiredDocuments(userId, documentType);

      return { id: docRef.id, ...documentData };
    } catch (error) {
      console.error('Error uploading KYC document:', error);
      throw new Error('Failed to upload document');
    }
  }

  private async updateRequiredDocuments(userId: string, documentType: KycDocument['type']) {
    const verification = await this.getVerificationByUserId(userId);
    if (verification) {
      const verificationData = (await verification.get()).data() as KycVerification;
      const updatedRequiredDocs = {
        ...verificationData.requiredDocuments,
        [documentType]: true
      };

      await verification.update({
        requiredDocuments: updatedRequiredDocs,
        status: this.calculateVerificationStatus(updatedRequiredDocs),
        updatedAt: new Date()
      });
    }
  }

  private calculateVerificationStatus(requiredDocs: KycVerification['requiredDocuments']): KycVerification['status'] {
    const completedDocs = Object.values(requiredDocs).filter(Boolean).length;
    const totalDocs = Object.keys(requiredDocs).length;

    if (completedDocs === 0) return 'incomplete';
    if (completedDocs < totalDocs) return 'incomplete';
    return 'pending_review';
  }

  async reviewDocument(documentId: string, status: 'approved' | 'rejected', notes?: string) {
    const docRef = doc(db, 'kyc_documents', documentId);
    const document = (await getDoc(docRef)).data() as KycDocument;

    await updateDoc(docRef, {
      status,
      verificationNotes: notes,
      updatedAt: Timestamp.now()
    });

    const verificationRef = await this.getVerificationByUserId(document.userId);
    if (verificationRef) {
      await this.updateVerificationStatus(verificationRef, document.userId);
    }
  }

  private async updateVerificationStatus(verificationRef: any, userId: string) {
    const docs = await this.getUserDocuments(userId);
    const allApproved = docs.every(doc => doc.status === 'approved');
    const anyRejected = docs.some(doc => doc.status === 'rejected');

    if (allApproved) {
      // Run risk assessment before final approval
      const riskAssessment = await getRiskAssessment({ userId, assessmentType: 'KYC' });
      
      const status = riskAssessment.riskScore < 75 ? 'approved' : 'rejected';
      await updateDoc(verificationRef, {
        status,
        riskScore: riskAssessment.riskScore,
        updatedAt: Timestamp.now()
      });

      await notificationService.notifyKycStatus(userId, status);
    } else if (anyRejected) {
      await updateDoc(verificationRef, {
        status: 'rejected',
        updatedAt: Timestamp.now()
      });
      await notificationService.notifyKycStatus(userId, 'rejected');
    }
  }

  async getVerificationByUserId(userId: string) {
    const q = query(collection(db, 'kyc_verifications'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.empty ? null : doc(db, 'kyc_verifications', snapshot.docs[0].id);
  }

  async getUserDocuments(userId: string, user?: any): Promise<KycDocument[]> {
    if (!user) {
      // Not authenticated, skip fetching KYC documents
      return [];
    }
    const q = query(collection(db, 'kyc_documents'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as KycDocument));
  }

  async isKycApproved(userId: string): Promise<boolean> {
    const verificationRef = await this.getVerificationByUserId(userId);
    if (!verificationRef) return false;
    
    const verification = (await getDoc(verificationRef)).data() as KycVerification;
    return verification.status === 'approved';
  }

  async getDocumentStatus(userId: string, documentType: KycDocument['type'], user?: any) {
    if (!user) {
      // Not authenticated, skip fetching KYC document status
      return null;
    }
    const q = query(
      collection(db, 'kyc_documents'),
      where('userId', '==', userId),
      where('type', '==', documentType)
    );
    const snapshot = await getDocs(q);
    return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  }
}

export const kycService = new KycService();