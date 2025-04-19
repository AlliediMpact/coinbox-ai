import { db } from './firebase';
import { collection, query, where, getDocs, updateDoc, doc, getDoc, Timestamp, orderBy, limit } from 'firebase/firestore';
import { kycService } from './kyc-service';
import { transactionService } from './transaction-service';

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

interface AdminReport {
  id?: string;
  type: 'daily' | 'weekly' | 'monthly';
  metrics: SystemMetrics;
  period: {
    start: Timestamp;
    end: Timestamp;
  };
  createdAt: Timestamp;
}

export class AdminService {
  async getPendingKycVerifications() {
    const q = query(
      collection(db, 'kyc_verifications'),
      where('status', '==', 'pending_review')
    );
    const snapshot = await getDocs(q);
    return Promise.all(
      snapshot.docs.map(async (doc) => {
        const verification = { id: doc.id, ...doc.data() };
        const documents = await kycService.getUserDocuments(verification.userId);
        return { ...verification, documents };
      })
    );
  }

  async getDisputeMetrics(startDate: Date, endDate: Date) {
    const q = query(
      collection(db, 'disputes'),
      where('createdAt', '>=', startDate),
      where('createdAt', '<=', endDate)
    );
    const snapshot = await getDocs(q);
    const disputes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const totalDisputes = disputes.length;
    const resolvedDisputes = disputes.filter(d => d.status === 'resolved');
    const avgResolutionTime = resolvedDisputes.reduce((acc, curr) => {
      return acc + (curr.resolvedAt - curr.createdAt);
    }, 0) / resolvedDisputes.length;

    return {
      totalDisputes,
      resolvedDisputes: resolvedDisputes.length,
      avgResolutionTime,
      disputeRate: totalDisputes / await this.getTotalTrades(startDate, endDate)
    };
  }

  async getSystemMetrics(): Promise<SystemMetrics> {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      users,
      activeUsers,
      pendingKyc,
      recentTransactions,
      disputes
    ] = await Promise.all([
      this.getTotalUsers(),
      this.getActiveUsers(dayAgo),
      this.getPendingKycCount(),
      this.getTransactions(monthAgo),
      this.getDisputeMetrics(monthAgo, now)
    ]);

    const transactionVolume = recentTransactions.reduce((sum, tx) => sum + tx.amount, 0);

    return {
      totalUsers: users,
      activeUsers,
      pendingKyc,
      totalTransactions: recentTransactions.length,
      transactionVolume,
      disputeRate: disputes.disputeRate,
      avgResolutionTime: disputes.avgResolutionTime,
      systemHealth: await this.getSystemHealth()
    };
  }

  async generateReport(type: AdminReport['type']): Promise<AdminReport> {
    const now = new Date();
    let startDate: Date;

    switch (type) {
      case 'daily':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    const metrics = await this.getSystemMetrics();
    const report: Omit<AdminReport, 'id'> = {
      type,
      metrics,
      period: {
        start: Timestamp.fromDate(startDate),
        end: Timestamp.fromDate(now)
      },
      createdAt: Timestamp.now()
    };

    const docRef = await collection(db, 'admin_reports').add(report);
    return { id: docRef.id, ...report };
  }

  private async getTotalUsers(): Promise<number> {
    const snapshot = await getDocs(collection(db, 'users'));
    return snapshot.size;
  }

  private async getActiveUsers(since: Date): Promise<number> {
    const q = query(
      collection(db, 'user_activity'),
      where('lastActive', '>=', since)
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
  }

  private async getPendingKycCount(): Promise<number> {
    const q = query(
      collection(db, 'kyc_verifications'),
      where('status', '==', 'pending_review')
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
  }

  private async getTotalTrades(startDate: Date, endDate: Date): Promise<number> {
    const q = query(
      collection(db, 'trades'),
      where('createdAt', '>=', startDate),
      where('createdAt', '<=', endDate)
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
  }

  private async getTransactions(since: Date) {
    const q = query(
      collection(db, 'transactions'),
      where('createdAt', '>=', since),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  private async getSystemHealth() {
    const q = query(
      collection(db, 'system_logs'),
      orderBy('timestamp', 'desc'),
      limit(1000) // Last 1000 requests
    );
    const snapshot = await getDocs(q);
    const logs = snapshot.docs.map(doc => doc.data());

    const errors = logs.filter(log => log.type === 'error');
    const responseTimes = logs.map(log => log.responseTime);
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;

    return {
      errorRate: errors.length / logs.length,
      responseTime: avgResponseTime,
      uptime: 0.999 // This should be fetched from a monitoring service
    };
  }
}

export const adminService = new AdminService();