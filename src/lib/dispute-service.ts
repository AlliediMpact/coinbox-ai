import { getFirestore, doc, collection, query, getDocs, runTransaction, getDoc, addDoc, where, updateDoc, serverTimestamp } from 'firebase/firestore';
import { TradeTicket, Dispute, DisputeRequest } from './types';
import { validateLoanAmount, validateInvestmentAmount, getTierConfig } from './membership-tiers';
import { ServiceClient } from './service-client';
import { orderBy, where as firestoreWhere } from 'firebase/firestore';
import { getRiskAssessment } from './risk-assessment';
import { disputeNotificationService } from './dispute-notification-service';
import { hasAdminAccess, getUserRole } from './auth-utils';

export class DisputeService extends ServiceClient {
  private db = getFirestore();

  async createDispute(data: DisputeRequest): Promise<Dispute> {
    const dispute: Omit<Dispute, 'id'> = {
      ...data,
      status: 'Open',
      createdAt: new Date(),
    };
    
    // Create the dispute
    const disputeRef = await this.createDocument('disputes', dispute);
    
    // Get the dispute with ID
    const createdDispute = await this.getDocument<Dispute>(`disputes/${disputeRef.id}`);
    
    if (!createdDispute) {
      throw new Error('Failed to create dispute');
    }
    
    // Update the ticket status
    if (data.ticketId) {
      await this.updateDocument(`tickets/${data.ticketId}`, {
        status: 'Disputed',
        updatedAt: new Date()
      });
    }
    
    // Send notification to the user
    await disputeNotificationService.notifyDisputeCreated({
      userId: data.userId,
      disputeId: disputeRef.id,
      ticketId: data.ticketId
    });
    
    // Find admins to notify
    try {
      const userQuery = query(collection(this.db, 'users'));
      const userDocs = await getDocs(userQuery);
      
      const adminIds: string[] = [];
      
      for (const userDoc of userDocs.docs) {
        const userId = userDoc.id;
        const userRole = await getUserRole(userId);
        
        if (userRole === 'admin' || userRole === 'support') {
          adminIds.push(userId);
        }
      }
      
      // Notify admins (if any found)
      if (adminIds.length > 0) {
        await disputeNotificationService.notifyAdminNewDispute(
          adminIds,
          disputeRef.id,
          data.ticketId
        );
      }
    } catch (error) {
      console.error("Error notifying admins:", error);
      // Don't fail the entire operation if admin notifications fail
    }
    
    return createdDispute;
  }

  async updateDisputeStatus(
    disputeId: string, 
    status: 'Open' | 'UnderReview' | 'Resolved' | 'Rejected', 
    resolution?: string
  ): Promise<void> {
    // Get the dispute first to get user ID
    const dispute = await this.getDocument<Dispute>(`disputes/${disputeId}`);
    
    if (!dispute) {
      throw new Error('Dispute not found');
    }
    
    // Update the dispute
    const updateData: any = {
      status,
      updatedAt: new Date()
    };
    
    if (status === 'UnderReview') {
      updateData.reviewStartedAt = new Date();
    }
    
    if (status === 'Resolved' || status === 'Rejected') {
      updateData.resolvedAt = new Date();
      
      if (resolution) {
        updateData.resolution = resolution;
      }
    }
    
    await this.updateDocument(`disputes/${disputeId}`, updateData);
    
    // Send notification to the user
    await disputeNotificationService.notifyDisputeStatusUpdate({
      userId: dispute.userId,
      disputeId,
      ticketId: dispute.ticketId,
      status,
      resolution
    });
    
    // Update ticket status if this is final resolution
    if ((status === 'Resolved' || status === 'Rejected') && dispute.ticketId) {
      await this.updateDocument(`tickets/${dispute.ticketId}`, {
        status: status === 'Resolved' ? 'Completed' : 'Cancelled',
        updatedAt: new Date()
      });
    }
  }

  async getDisputesByUser(userId: string): Promise<Dispute[]> {
    return this.queryCollection<Dispute>('disputes', [
      firestoreWhere('userId', '==', userId),
      orderBy('createdAt', 'desc')
    ]);
  }

  async getAllDisputes(status?: string): Promise<Dispute[]> {
    const queryConstraints = [orderBy('createdAt', 'desc')];
    
    if (status) {
      queryConstraints.unshift(firestoreWhere('status', '==', status));
    }
    
    return this.queryCollection<Dispute>('disputes', queryConstraints);
  }
}

// Export a singleton instance
export const disputeService = new DisputeService();
