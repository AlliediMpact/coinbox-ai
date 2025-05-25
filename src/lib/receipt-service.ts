import { db } from './firebase';
import { paystackService } from './paystack-service';
import { notificationService } from './notification-service';
import { addDoc, collection, doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { generatePDF } from './pdf-generator';

interface Receipt {
  id: string;
  paymentId: string;
  userId: string;
  amount: number;
  currency: string;
  date: Date;
  description: string;
  status: 'paid' | 'pending' | 'failed';
  items?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  metadata?: Record<string, any>;
  pdfUrl?: string;
}

interface ReceiptGenerationOptions {
  sendNotification?: boolean;
  generatePdf?: boolean;
  includeMetadata?: boolean;
}

class ReceiptService {
  /**
   * Generate a receipt for a payment transaction
   */
  async generateReceipt(
    paymentId: string,
    options: ReceiptGenerationOptions = { 
      sendNotification: true,
      generatePdf: true,
      includeMetadata: true
    }
  ): Promise<Receipt> {
    try {
      // Get payment information
      const paymentDoc = await getDoc(doc(db, 'payments', paymentId));
      
      if (!paymentDoc.exists()) {
        throw new Error(`Payment ${paymentId} not found`);
      }
      
      const paymentData = paymentDoc.data();
      const userId = paymentData.userId;
      
      if (!userId) {
        throw new Error('Payment does not have a user ID');
      }
      
      // Create receipt data
      const receiptData: Omit<Receipt, 'id'> = {
        paymentId,
        userId,
        amount: paymentData.amount,
        currency: paymentData.currency || 'ZAR',
        date: new Date(),
        description: paymentData.description || 'Payment for CoinBox services',
        status: paymentData.status === 'success' ? 'paid' : 
                paymentData.status === 'failed' ? 'failed' : 'pending',
        items: [
          {
            description: 'CoinBox Membership Fee',
            quantity: 1,
            unitPrice: paymentData.amount,
            totalPrice: paymentData.amount
          }
        ],
        metadata: options.includeMetadata ? paymentData.metadata : undefined
      };
      
      // Save receipt to database
      const receiptRef = await addDoc(collection(db, 'receipts'), {
        ...receiptData,
        createdAt: serverTimestamp()
      });
      
      // Generate PDF if requested
      let pdfUrl = undefined;
      if (options.generatePdf) {
        pdfUrl = await generatePDF({
          title: 'Payment Receipt',
          receiptId: receiptRef.id,
          paymentId,
          userId,
          amount: paymentData.amount,
          currency: receiptData.currency,
          date: receiptData.date,
          status: receiptData.status,
          items: receiptData.items,
          customerName: paymentData.metadata?.fullName || 'Valued Customer',
          customerEmail: paymentData.email,
          customerPhone: paymentData.metadata?.phone,
          companyInfo: {
            name: 'CoinBox Connect',
            address: '123 Financial Avenue, Cape Town, South Africa',
            email: 'support@coinboxconnect.com',
            phone: '+27 123 456 789'
          }
        });
        
        // Update receipt with PDF URL
        await updateDoc(receiptRef, { pdfUrl });
      }
      
      // Send notification if requested
      if (options.sendNotification) {
        await notificationService.createNotification({
          userId,
          type: 'payment_receipt',
          title: 'Payment Receipt Available',
          message: `Your payment receipt for R${paymentData.amount} is now available for viewing and download.`,
          priority: 'medium',
          metadata: {
            receiptUrl: pdfUrl,
            paymentId,
            amount: paymentData.amount
          }
        });
      }
      
      // Return receipt data with ID
      return {
        ...receiptData,
        id: receiptRef.id,
        pdfUrl
      };
    } catch (error) {
      console.error('Failed to generate receipt:', error);
      throw new Error('Receipt generation failed');
    }
  }
  
  /**
   * Get a receipt by ID
   */
  async getReceipt(receiptId: string): Promise<Receipt | null> {
    try {
      const receiptDoc = await getDoc(doc(db, 'receipts', receiptId));
      
      if (!receiptDoc.exists()) {
        return null;
      }
      
      return {
        id: receiptDoc.id,
        ...receiptDoc.data()
      } as Receipt;
    } catch (error) {
      console.error('Failed to get receipt:', error);
      return null;
    }
  }
  
  /**
   * List all receipts for a user
   */
  async listUserReceipts(userId: string): Promise<Receipt[]> {
    try {
      const receiptsSnapshot = await db
        .collection('receipts')
        .where('userId', '==', userId)
        .orderBy('date', 'desc')
        .get();
      
      return receiptsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Receipt[];
    } catch (error) {
      console.error('Failed to list user receipts:', error);
      return [];
    }
  }
}

export const receiptService = new ReceiptService();
