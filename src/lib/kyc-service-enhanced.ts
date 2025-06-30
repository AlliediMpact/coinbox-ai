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
import { notificationService } from './basic-notification-service';

export interface KycDocument {
  id?: string;
  userId: string;
  type: 'id_document' | 'proof_of_address' | 'selfie' | 'bank_statement';
  status: 'pending' | 'approved' | 'rejected';
  documentUrl: string;
  verificationNotes?: string;
  metadata?: {
    expiryDate?: Date;
    documentNumber?: string;
    documentType?: string;
    issueDate?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
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
  createdAt: Date;
  updatedAt: Date;
}

class EnhancedKycService {
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

    const docRef = doc(collection(db, 'kyc_verifications'), userId);
    await setDoc(docRef, verificationData);
    return { id: docRef.id, ...verificationData };
  }

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
      const docId = `${userId}_${documentType}_${Date.now()}`;
      const docRef = doc(db, 'kyc_documents', docId);
      await setDoc(docRef, documentData);

      // Update verification status
      await this.updateRequiredDocuments(userId, documentType);

      // Send notification
      await notificationService.sendNotification({
        userId: userId,
        type: 'document_uploaded',
        title: 'Document Uploaded Successfully',
        message: `Your ${documentType.replace('_', ' ')} has been submitted for review.`,
        timestamp: new Date()
      });

      return { id: docRef.id, ...documentData };
    } catch (error) {
      console.error('Error uploading KYC document:', error);
      throw new Error('Failed to upload document');
    }
  }

  async verifyDocument(
    documentId: string,
    status: 'approved' | 'rejected',
    verificationNotes?: string
  ): Promise<void> {
    const docRef = doc(db, 'kyc_documents', documentId);
    const updateData = {
      status,
      verificationNotes,
      updatedAt: new Date()
    };

    await setDoc(docRef, updateData, { merge: true });

    // Get document to check user ID
    const docSnapshot = await getDocs(query(collection(db, 'kyc_documents'), where('__name__', '==', documentId)));
    if (!docSnapshot.docs.length) return;

    const document = docSnapshot.docs[0].data() as KycDocument;
    
    // Update overall verification status
    await this.updateVerificationStatus(document.userId);
  }

  private async updateRequiredDocuments(userId: string, documentType: KycDocument['type']) {
    const verificationRef = doc(db, 'kyc_verifications', userId);
    
    // Get current verification data
    const verificationSnapshot = await getDocs(query(collection(db, 'kyc_verifications'), where('userId', '==', userId)));
    
    if (verificationSnapshot.docs.length > 0) {
      const verificationData = verificationSnapshot.docs[0].data() as KycVerification;
      const updatedRequiredDocs = {
        ...verificationData.requiredDocuments,
        [documentType]: true
      };

      await setDoc(verificationRef, {
        requiredDocuments: updatedRequiredDocs,
        status: this.calculateVerificationStatus(updatedRequiredDocs),
        updatedAt: new Date()
      }, { merge: true });
    }
  }

  private async updateVerificationStatus(userId: string) {
    const docs = await this.getUserDocuments(userId);
    const allApproved = docs.every(doc => doc.status === 'approved');
    const anyRejected = docs.some(doc => doc.status === 'rejected');

    let status: KycVerification['status'] = 'pending_review';
    
    if (allApproved && docs.length >= 3) { // Require at least 3 documents
      status = 'approved';
      await notificationService.sendNotification({
        userId: userId,
        type: 'kyc_approved',
        title: 'KYC Verification Approved',
        message: 'Your identity verification has been approved. You now have full access to all features.',
        timestamp: new Date()
      });
    } else if (anyRejected) {
      status = 'rejected';
      await notificationService.sendNotification({
        userId: userId,
        type: 'kyc_rejected',
        title: 'KYC Verification Rejected',
        message: 'Some of your documents were rejected. Please review and resubmit.',
        timestamp: new Date()
      });
    }

    const verificationRef = doc(db, 'kyc_verifications', userId);
    await setDoc(verificationRef, {
      status,
      updatedAt: new Date()
    }, { merge: true });
  }

  private calculateVerificationStatus(requiredDocs: KycVerification['requiredDocuments']): KycVerification['status'] {
    const completedDocs = Object.values(requiredDocs).filter(Boolean).length;
    const totalDocs = Object.keys(requiredDocs).length;

    if (completedDocs === 0) return 'incomplete';
    if (completedDocs < 3) return 'incomplete'; // Require at least 3 documents
    return 'pending_review';
  }

  async getUserDocuments(userId: string): Promise<KycDocument[]> {
    const q = query(collection(db, 'kyc_documents'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as KycDocument));
  }

  async getVerificationStatus(userId: string): Promise<KycVerification | null> {
    const q = query(collection(db, 'kyc_verifications'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.length > 0 ? { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as KycVerification : null;
  }

  async isKycApproved(userId: string): Promise<boolean> {
    const verification = await this.getVerificationStatus(userId);
    return verification?.status === 'approved' || false;
  }

  async getDocumentStatus(userId: string, documentType: KycDocument['type']): Promise<KycDocument | null> {
    const q = query(
      collection(db, 'kyc_documents'),
      where('userId', '==', userId),
      where('type', '==', documentType)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.length > 0 ? { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as KycDocument : null;
  }

  // Compliance reporting integration
  async getComplianceReport(startDate: Date, endDate: Date) {
    const verificationsQuery = query(
      collection(db, 'kyc_verifications'),
      where('createdAt', '>=', startDate),
      where('createdAt', '<=', endDate)
    );

    const snapshot = await getDocs(verificationsQuery);
    const verifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return {
      totalVerifications: verifications.length,
      approvedCount: verifications.filter((v: any) => v.status === 'approved').length,
      rejectedCount: verifications.filter((v: any) => v.status === 'rejected').length,
      pendingCount: verifications.filter((v: any) => v.status === 'pending_review').length,
      verifications
    };
  }
}

export const enhancedKycService = new EnhancedKycService();
