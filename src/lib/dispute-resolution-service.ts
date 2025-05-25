/**
 * Enhanced Dispute Resolution System for CoinBox
 * 
 * This service provides a structured workflow for handling trade disputes,
 * including evidence submission, arbitration, and resolution processes.
 */

import { db } from './firebase';
import { 
  addDoc, 
  collection, 
  doc, 
  getDoc, 
  updateDoc, 
  Timestamp, 
  arrayUnion, 
  query, 
  where, 
  orderBy, 
  getDocs 
} from 'firebase/firestore';
import { notificationService } from './notification-service';
import { disputeNotificationService } from './dispute-notification-service';
import { getUsersWithRole } from './user-roles';

// Dispute status workflow stages
export type DisputeStatus = 
  | 'Open'               // Initial state when dispute is created
  | 'Evidence'           // Evidence gathering phase
  | 'UnderReview'        // Admin is reviewing the dispute
  | 'Arbitration'        // In advanced resolution with third party
  | 'PendingResolution'  // Decision made, pending final execution
  | 'Resolved'           // Dispute is resolved
  | 'Rejected'           // Dispute claim is rejected
  | 'Cancelled';         // Dispute is cancelled

export interface DisputeEvidence {
  id: string;
  userId: string;
  type: 'image' | 'document' | 'text' | 'video';
  content: string; // URL for media, text content for text evidence
  description: string;
  submittedAt: Timestamp;
}

export interface DisputeComment {
  id: string;
  userId: string;
  role: 'buyer' | 'seller' | 'admin' | 'arbitrator';
  message: string;
  createdAt: Timestamp;
  isPrivate: boolean; // If true, only admins/arbitrators can see it
}

export interface DisputeResolution {
  decision: 'buyer' | 'seller' | 'partial' | 'rejected';
  reason: string;
  resolvedBy: string; // User ID of admin/arbitrator
  resolvedAt: Timestamp;
  buyerRefundAmount?: number;
  sellerPaymentAmount?: number;
  additionalNotes?: string;
}

export interface Dispute {
  id: string;
  ticketId: string;
  userId: string;      // User who filed the dispute
  counterpartyId: string; // Other party in the dispute
  reason: string;
  description: string;
  status: DisputeStatus;
  evidence: DisputeEvidence[];
  comments: DisputeComment[];
  timeline: Array<{
    status: DisputeStatus;
    timestamp: Timestamp;
    message?: string;
  }>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  resolution?: DisputeResolution;
  escalatedToArbitration?: boolean;
  escalatedAt?: Timestamp;
  priority: 'low' | 'medium' | 'high';
  flags?: Array<'fraud' | 'urgent' | 'repeat_offender' | 'high_value'>;
}

class DisputeResolutionService {
  /**
   * Create a new dispute
   */
  async createDispute(
    ticketId: string,
    userId: string,
    counterpartyId: string,
    reason: string,
    description: string,
    initialEvidence?: Omit<DisputeEvidence, 'id' | 'userId' | 'submittedAt'>[]
  ): Promise<string> {
    try {
      // Validate ticket exists
      const ticketRef = doc(db, 'tickets', ticketId);
      const ticketSnap = await getDoc(ticketRef);
      
      if (!ticketSnap.exists()) {
        throw new Error(`Ticket ${ticketId} not found`);
      }
      
      const ticketData = ticketSnap.data();
      
      // Prevent multiple disputes for the same ticket
      const existingDisputeQuery = query(
        collection(db, 'disputes'),
        where('ticketId', '==', ticketId),
        where('status', 'in', ['Open', 'Evidence', 'UnderReview', 'Arbitration', 'PendingResolution'])
      );
      
      const existingDisputes = await getDocs(existingDisputeQuery);
      if (!existingDisputes.empty) {
        throw new Error('A dispute for this ticket already exists');
      }
      
      // Calculate priority
      const amount = ticketData.amount || 0;
      let priority: 'low' | 'medium' | 'high' = 'low';
      
      if (amount > 10000) {
        priority = 'high';
      } else if (amount > 1000) {
        priority = 'medium';
      }
      
      // Prepare evidence array
      const now = Timestamp.now();
      const evidence: DisputeEvidence[] = initialEvidence ? 
        initialEvidence.map((ev, index) => ({
          ...ev,
          id: `evidence_${Date.now()}_${index}`,
          userId,
          submittedAt: now
        })) : [];
      
      // Create dispute object
      const dispute: Omit<Dispute, 'id'> = {
        ticketId,
        userId,
        counterpartyId,
        reason,
        description,
        status: 'Open',
        evidence,
        comments: [],
        timeline: [
          {
            status: 'Open',
            timestamp: now,
            message: 'Dispute created'
          }
        ],
        createdAt: now,
        updatedAt: now,
        priority,
        flags: amount > 5000 ? ['high_value'] : []
      };
      
      // Save to database
      const disputeRef = await addDoc(collection(db, 'disputes'), dispute);
      
      // Update ticket status
      await updateDoc(ticketRef, {
        status: 'Disputed',
        disputeId: disputeRef.id,
        updatedAt: now
      });
      
      // Send notifications
      await Promise.all([
        // Notify dispute creator
        notificationService.notifyDispute(userId, disputeRef.id, ticketId),
        
        // Notify counterparty
        notificationService.createNotification({
          userId: counterpartyId,
          type: 'dispute',
          title: 'Dispute Filed Against You',
          message: 'A dispute has been filed for one of your trades. Please respond with your evidence.',
          priority: 'high',
          metadata: {
            disputeId: disputeRef.id,
            tradeId: ticketId
          }
        }),
        
        // Notify admins
        this.notifyAdmins(disputeRef.id, ticketId)
      ]);
      
      return disputeRef.id;
    } catch (error) {
      console.error('Failed to create dispute:', error);
      throw new Error('Failed to create dispute');
    }
  }
  
  /**
   * Submit evidence for a dispute
   */
  async submitEvidence(
    disputeId: string,
    userId: string,
    evidence: Omit<DisputeEvidence, 'id' | 'userId' | 'submittedAt'>
  ): Promise<string> {
    try {
      const disputeRef = doc(db, 'disputes', disputeId);
      const disputeSnap = await getDoc(disputeRef);
      
      if (!disputeSnap.exists()) {
        throw new Error(`Dispute ${disputeId} not found`);
      }
      
      const disputeData = disputeSnap.data() as Dispute;
      
      // Verify user is part of this dispute
      if (disputeData.userId !== userId && disputeData.counterpartyId !== userId) {
        throw new Error('Unauthorized to submit evidence for this dispute');
      }
      
      // Check if dispute is in a state that allows evidence
      if (!['Open', 'Evidence', 'UnderReview'].includes(disputeData.status)) {
        throw new Error(`Cannot submit evidence in ${disputeData.status} state`);
      }
      
      // Create evidence object
      const now = Timestamp.now();
      const newEvidence: DisputeEvidence = {
        ...evidence,
        id: `evidence_${Date.now()}`,
        userId,
        submittedAt: now
      };
      
      // If dispute is in Open status, move to Evidence status
      let statusUpdate = {};
      if (disputeData.status === 'Open') {
        statusUpdate = {
          status: 'Evidence',
          timeline: arrayUnion({
            status: 'Evidence',
            timestamp: now,
            message: 'Evidence collection started'
          })
        };
      }
      
      // Update dispute with new evidence
      await updateDoc(disputeRef, {
        evidence: arrayUnion(newEvidence),
        updatedAt: now,
        ...statusUpdate
      });
      
      // Send notification to counterparty
      const counterpartyId = disputeData.userId === userId ? disputeData.counterpartyId : disputeData.userId;
      await notificationService.createNotification({
        userId: counterpartyId,
        type: 'dispute_update',
        title: 'New Evidence Submitted',
        message: 'New evidence has been submitted for your dispute.',
        priority: 'medium',
        metadata: {
          disputeId,
          tradeId: disputeData.ticketId,
          action: 'view_evidence'
        }
      });
      
      return newEvidence.id;
    } catch (error) {
      console.error('Failed to submit evidence:', error);
      throw new Error('Failed to submit evidence');
    }
  }
  
  /**
   * Add a comment to the dispute thread
   */
  async addComment(
    disputeId: string,
    userId: string,
    role: DisputeComment['role'],
    message: string,
    isPrivate: boolean = false
  ): Promise<string> {
    try {
      const disputeRef = doc(db, 'disputes', disputeId);
      const disputeSnap = await getDoc(disputeRef);
      
      if (!disputeSnap.exists()) {
        throw new Error(`Dispute ${disputeId} not found`);
      }
      
      const disputeData = disputeSnap.data() as Dispute;
      
      // Verify user has permission to comment
      if (role !== 'admin' && role !== 'arbitrator') {
        if (disputeData.userId !== userId && disputeData.counterpartyId !== userId) {
          throw new Error('Unauthorized to comment on this dispute');
        }
      }
      
      // Create comment
      const now = Timestamp.now();
      const commentId = `comment_${Date.now()}`;
      const newComment: DisputeComment = {
        id: commentId,
        userId,
        role,
        message,
        createdAt: now,
        isPrivate
      };
      
      // Update dispute with new comment
      await updateDoc(disputeRef, {
        comments: arrayUnion(newComment),
        updatedAt: now
      });
      
      // Notify parties if not a private comment
      if (!isPrivate) {
        // Determine who to notify
        let notifyUserId;
        
        if (role === 'admin' || role === 'arbitrator') {
          // Notify both parties
          await Promise.all([
            this.sendCommentNotification(disputeData.userId, disputeId, disputeData.ticketId),
            this.sendCommentNotification(disputeData.counterpartyId, disputeId, disputeData.ticketId)
          ]);
        } else {
          // Notify counterparty
          notifyUserId = disputeData.userId === userId ? disputeData.counterpartyId : disputeData.userId;
          await this.sendCommentNotification(notifyUserId, disputeId, disputeData.ticketId);
        }
      }
      
      return commentId;
    } catch (error) {
      console.error('Failed to add comment:', error);
      throw new Error('Failed to add comment');
    }
  }
  
  /**
   * Update dispute status
   */
  async updateDisputeStatus(
    disputeId: string,
    adminId: string,
    newStatus: DisputeStatus,
    statusMessage?: string
  ): Promise<void> {
    try {
      const disputeRef = doc(db, 'disputes', disputeId);
      const disputeSnap = await getDoc(disputeRef);
      
      if (!disputeSnap.exists()) {
        throw new Error(`Dispute ${disputeId} not found`);
      }
      
      const disputeData = disputeSnap.data() as Dispute;
      const now = Timestamp.now();
      
      // Update dispute status
      await updateDoc(disputeRef, {
        status: newStatus,
        updatedAt: now,
        timeline: arrayUnion({
          status: newStatus,
          timestamp: now,
          message: statusMessage || `Status updated to ${newStatus}`
        }),
        ...(newStatus === 'Arbitration' ? { escalatedToArbitration: true, escalatedAt: now } : {})
      });
      
      // Send notifications
      await Promise.all([
        disputeNotificationService.notifyDisputeStatusUpdate({
          userId: disputeData.userId,
          disputeId,
          ticketId: disputeData.ticketId,
          status: newStatus
        }),
        disputeNotificationService.notifyDisputeStatusUpdate({
          userId: disputeData.counterpartyId,
          disputeId,
          ticketId: disputeData.ticketId,
          status: newStatus
        })
      ]);
      
      // Update ticket status if needed
      if (['Resolved', 'Rejected', 'Cancelled'].includes(newStatus)) {
        const ticketStatus = newStatus === 'Resolved' ? 'Completed' : 
                            newStatus === 'Rejected' ? 'Active' : 'Cancelled';
        
        await updateDoc(doc(db, 'tickets', disputeData.ticketId), {
          status: ticketStatus,
          updatedAt: now
        });
      }
    } catch (error) {
      console.error('Failed to update dispute status:', error);
      throw new Error('Failed to update dispute status');
    }
  }
  
  /**
   * Resolve a dispute with a decision
   */
  async resolveDispute(
    disputeId: string,
    adminId: string,
    resolution: Omit<DisputeResolution, 'resolvedBy' | 'resolvedAt'>
  ): Promise<void> {
    try {
      const disputeRef = doc(db, 'disputes', disputeId);
      const disputeSnap = await getDoc(disputeRef);
      
      if (!disputeSnap.exists()) {
        throw new Error(`Dispute ${disputeId} not found`);
      }
      
      const disputeData = disputeSnap.data() as Dispute;
      const now = Timestamp.now();
      
      // Create resolution object
      const resolutionObj: DisputeResolution = {
        ...resolution,
        resolvedBy: adminId,
        resolvedAt: now
      };
      
      // Update dispute
      await updateDoc(disputeRef, {
        status: 'Resolved',
        updatedAt: now,
        resolution: resolutionObj,
        timeline: arrayUnion({
          status: 'Resolved',
          timestamp: now,
          message: `Dispute resolved: ${resolution.reason}`
        })
      });
      
      // Send notifications with resolution details
      await Promise.all([
        disputeNotificationService.notifyDisputeStatusUpdate({
          userId: disputeData.userId,
          disputeId,
          ticketId: disputeData.ticketId,
          status: 'Resolved',
          resolution: resolution.reason
        }),
        disputeNotificationService.notifyDisputeStatusUpdate({
          userId: disputeData.counterpartyId,
          disputeId,
          ticketId: disputeData.ticketId,
          status: 'Resolved',
          resolution: resolution.reason
        })
      ]);
      
      // Update ticket as completed
      await updateDoc(doc(db, 'tickets', disputeData.ticketId), {
        status: 'Completed',
        resolution: resolution.decision,
        updatedAt: now
      });
    } catch (error) {
      console.error('Failed to resolve dispute:', error);
      throw new Error('Failed to resolve dispute');
    }
  }
  
  /**
   * Escalate dispute to arbitration
   */
  async escalateToArbitration(disputeId: string, adminId: string, reason: string): Promise<void> {
    try {
      await this.updateDisputeStatus(
        disputeId,
        adminId,
        'Arbitration',
        `Escalated to arbitration: ${reason}`
      );
      
      // Assign arbitrators or perform additional escalation tasks here
      
    } catch (error) {
      console.error('Failed to escalate dispute:', error);
      throw new Error('Failed to escalate dispute');
    }
  }
  
  /**
   * Notify admins about a new dispute
   */
  private async notifyAdmins(disputeId: string, ticketId: string): Promise<void> {
    try {
      const adminIds = await getUsersWithRole('admin');
      
      if (adminIds.length > 0) {
        await disputeNotificationService.notifyAdminNewDispute(adminIds, disputeId, ticketId);
      }
    } catch (error) {
      console.error('Failed to notify admins:', error);
      // Don't throw here to prevent blocking the main flow
    }
  }
  
  /**
   * Send notification about a new comment
   */
  private async sendCommentNotification(userId: string, disputeId: string, ticketId: string): Promise<void> {
    try {
      await notificationService.createNotification({
        userId,
        type: 'dispute_update',
        title: 'New Comment on Dispute',
        message: 'There is a new comment on your dispute thread.',
        priority: 'medium',
        metadata: {
          disputeId,
          tradeId: ticketId,
          action: 'view_comments'
        }
      });
    } catch (error) {
      console.error('Failed to send comment notification:', error);
      // Don't throw here to prevent blocking the main flow
    }
  }
}

export const disputeResolutionService = new DisputeResolutionService();
