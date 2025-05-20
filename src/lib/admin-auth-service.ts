import { adminDb, adminAuth } from './firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { AuthEventType } from './auth-logger';

interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  pendingKyc: number;
  totalTransactions: number;
  transactionVolume: number;
  disputeRate: number;
  avgResolutionTime: number;
  systemHealth: {
    errorRate: number;
    responseTime: number;
    uptime: number;
  };
}

interface UserListOptions {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'lastLoginAt' | 'email' | 'fullName';
  sortDirection?: 'asc' | 'desc';
  filter?: {
    emailVerified?: boolean;
    membershipTier?: string;
    flagged?: boolean;
    loginIssues?: boolean;
  };
}

interface UserSecurityInfo {
  userId: string;
  email: string;
  emailVerified: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  securityEvents: Array<{
    eventType: string;
    timestamp: Date;
    metadata: any;
  }>;
  flagged: boolean;
  flagReason?: string;
  flaggedAt?: Date;
  mfaEnabled: boolean;
  failedLoginAttempts: number;
}

export class AdminService {
  /**
   * Get users with authentication-related information
   */
  async getUsers(options: UserListOptions = {}) {
    if (!adminDb || !adminAuth) {
      throw new Error('Firebase Admin SDK not initialized');
    }
    
    const {
      page = 1,
      limit: pageSize = 20,
      sortBy = 'createdAt',
      sortDirection = 'desc',
      filter = {}
    } = options;
    
    try {
      // Start with a base users collection reference
      let usersRef = adminDb.collection('users');
      
      // Apply filters if provided
      if (filter.emailVerified !== undefined) {
        usersRef = usersRef.where('emailVerified', '==', filter.emailVerified);
      }
      
      if (filter.membershipTier) {
        usersRef = usersRef.where('membershipTier', '==', filter.membershipTier);
      }
      
      // Apply sorting
      usersRef = usersRef.orderBy(sortBy, sortDirection);
      
      // Apply pagination
      const startAt = (page - 1) * pageSize;
      const querySnapshot = await usersRef.limit(pageSize).offset(startAt).get();
      
      // Handle flagged filter separately since it requires a join-like operation
      let userIds = querySnapshot.docs.map(doc => doc.id);
      
      if (filter.flagged) {
        const flaggedUsersSnapshot = await adminDb.collection('flaggedUsers').get();
        const flaggedUserIds = flaggedUsersSnapshot.docs.map(doc => doc.id);
        
        // Filter to only include flagged users
        userIds = userIds.filter(id => flaggedUserIds.includes(id));
      }
      
      // Extract user data for the remaining IDs
      const users = await Promise.all(
        userIds.map(async (userId) => {
          const userDoc = await adminDb.collection('users').doc(userId).get();
          const userData = userDoc.exists ? userDoc.data() : {};
          
          // Get security info for each user
          const securityInfo = await this.getUserSecurityInfo(userId);
          
          return {
            id: userId,
            ...userData,
            ...securityInfo
          };
        })
      );
      
      // Get total count for pagination
      const totalSnapshot = await adminDb.collection('users').count().get();
      const total = totalSnapshot.data().count;
      
      return {
        users,
        total,
        page,
        pageSize
      };
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  /**
   * Get detailed security information for a specific user
   */
  async getUserSecurityInfo(userId: string): Promise<UserSecurityInfo> {
    if (!adminDb || !adminAuth) {
      throw new Error('Firebase Admin SDK not initialized');
    }
    
    try {
      // Get user details from Auth
      const userRecord = await adminAuth.getUser(userId);
      
      // Get user data from Firestore
      const userDoc = await adminDb.collection('users').doc(userId).get();
      const userData = userDoc.exists ? userDoc.data() : {};
      
      // Get security events
      const eventsSnapshot = await adminDb.collection('authLogs')
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(100)
        .get();
      
      const securityEvents = eventsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          eventType: data.eventType || 'unknown',
          timestamp: data.timestamp ? data.timestamp.toDate() : new Date(),
          metadata: data.metadata || {}
        };
      });
      
      // Check if user is flagged
      const flaggedDoc = await adminDb.collection('flaggedUsers').doc(userId).get();
      const flagged = flaggedDoc.exists;
      const flagData = flagged ? flaggedDoc.data() : {};
      
      // Get failed login attempts count
      const failedLoginSnapshot = await adminDb.collection('authLogs')
        .where('userId', '==', userId)
        .where('eventType', '==', AuthEventType.SIGN_IN_FAILURE)
        .where('timestamp', '>=', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) // Last 7 days
        .get();
      
      return {
        userId,
        email: userRecord.email || '',
        emailVerified: userRecord.emailVerified,
        lastLoginAt: userRecord.metadata.lastSignInTime ? new Date(userRecord.metadata.lastSignInTime) : null,
        createdAt: new Date(userRecord.metadata.creationTime || Date.now()),
        securityEvents,
        flagged,
        flagReason: flagData?.reason,
        flaggedAt: flagData?.flaggedAt?.toDate(),
        mfaEnabled: (userRecord.multiFactor?.enrolledFactors?.length || 0) > 0,
        failedLoginAttempts: failedLoginSnapshot.size
      };
    } catch (error) {
      console.error(`Error getting security info for user ${userId}:`, error);
      
      // Return minimal info in case of error
      return {
        userId,
        email: '',
        emailVerified: false,
        lastLoginAt: null,
        createdAt: new Date(),
        securityEvents: [],
        flagged: false,
        mfaEnabled: false,
        failedLoginAttempts: 0
      };
    }
  }

  /**
   * Flag a user account for security review
   */
  async flagUserAccount(userId: string, reason: string) {
    if (!adminDb) {
      throw new Error('Firebase Admin SDK not initialized');
    }
    
    try {
      await adminDb.collection('flaggedUsers').doc(userId).set({
        reason,
        flaggedAt: FieldValue.serverTimestamp(),
        flaggedBy: 'admin', // This should be the admin's userId in production
        status: 'pending_review'
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error flagging user account:', error);
      throw error;
    }
  }

  /**
   * Remove flag from a user account
   */
  async unflagUserAccount(userId: string) {
    if (!adminDb) {
      throw new Error('Firebase Admin SDK not initialized');
    }
    
    try {
      await adminDb.collection('flaggedUsers').doc(userId).delete();
      return { success: true };
    } catch (error) {
      console.error('Error unflagging user account:', error);
      throw error;
    }
  }

  /**
   * Disable a user account
   */
  async disableUserAccount(userId: string, reason: string) {
    if (!adminDb || !adminAuth) {
      throw new Error('Firebase Admin SDK not initialized');
    }
    
    try {
      // Disable in Firebase Auth
      await adminAuth.updateUser(userId, { disabled: true });
      
      // Record the action
      await adminDb.collection('admin_actions').add({
        action: 'disable_user',
        userId,
        reason,
        timestamp: FieldValue.serverTimestamp(),
        performedBy: 'admin' // This should be the admin's userId in production
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error disabling user account:', error);
      throw error;
    }
  }

  /**
   * Enable a user account
   */
  async enableUserAccount(userId: string) {
    if (!adminDb || !adminAuth) {
      throw new Error('Firebase Admin SDK not initialized');
    }
    
    try {
      // Enable in Firebase Auth
      await adminAuth.updateUser(userId, { disabled: false });
      
      // Record the action
      await adminDb.collection('admin_actions').add({
        action: 'enable_user',
        userId,
        timestamp: FieldValue.serverTimestamp(),
        performedBy: 'admin' // This should be the admin's userId in production
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error enabling user account:', error);
      throw error;
    }
  }

  /**
   * Get recent authentication events for monitoring
   */
  async getRecentAuthEvents(limit: number = 100) {
    if (!adminDb) {
      throw new Error('Firebase Admin SDK not initialized');
    }
    
    try {
      const eventsSnapshot = await adminDb.collection('authLogs')
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();
      
      return eventsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching recent auth events:', error);
      throw error;
    }
  }

  /**
   * Get security events that require admin review
   */
  async getSecurityEventsForReview() {
    if (!adminDb) {
      throw new Error('Firebase Admin SDK not initialized');
    }
    
    try {
      const eventsSnapshot = await adminDb.collection('securityEvents')
        .where('reviewed', '==', false)
        .orderBy('timestamp', 'desc')
        .get();
      
      return eventsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching security events for review:', error);
      throw error;
    }
  }
  
  /**
   * Mark a security event as reviewed
   */
  async markSecurityEventReviewed(eventId: string, resolution: string) {
    if (!adminDb) {
      throw new Error('Firebase Admin SDK not initialized');
    }
    
    try {
      await adminDb.collection('securityEvents').doc(eventId).update({
        reviewed: true,
        reviewedAt: FieldValue.serverTimestamp(),
        resolution,
        reviewedBy: 'admin' // This should be the admin's userId in production
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error marking security event as reviewed:', error);
      throw error;
    }
  }
}
