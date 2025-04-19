import { db } from './firebase';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, getDoc, Timestamp } from 'firebase/firestore';
import { notificationService } from './notification-service';
import { getRiskAssessment } from '@/ai/flows/risk-assessment-flow';

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
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, 'kyc_verifications'), verificationData);
    return { id: docRef.id, ...verificationData };
  }

  async uploadDocument(userId: string, document: Omit<KycDocument, 'id' | 'status' | 'createdAt' | 'updatedAt'>) {
    const now = Timestamp.now();
    
    // Create document record
    const docRef = await addDoc(collection(db, 'kyc_documents'), {
      ...document,
      status: 'pending',
      createdAt: now,
      updatedAt: now
    });

    // Update verification status
    const verificationRef = await this.getVerificationByUserId(userId);
    if (verificationRef) {
      const verification = (await getDoc(verificationRef)).data() as KycVerification;
      const updatedDocs = { ...verification.requiredDocuments, [document.type]: true };
      const allDocsSubmitted = Object.values(updatedDocs).every(Boolean);

      await updateDoc(verificationRef, {
        requiredDocuments: updatedDocs,
        status: allDocsSubmitted ? 'pending_review' : 'incomplete',
        updatedAt: now
      });

      if (allDocsSubmitted) {
        await notificationService.notifyKycStatus(userId, 'pending_review');
      }
    }

    return docRef;
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

  async getUserDocuments(userId: string): Promise<KycDocument[]> {
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

  async getDocumentStatus(userId: string, documentType: KycDocument['type']) {
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