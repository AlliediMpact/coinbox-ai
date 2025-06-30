import { NextResponse } from 'next/server';
import { commissionSchedulerService } from '@/lib/commission-scheduler-service';
import { commissionAutomationService } from '@/lib/commission-automation-service';
import { verifyAdminRole } from '@/lib/auth-helpers';

/**
 * Admin API for commission scheduler management
 * Protected route - requires admin authentication
 */

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    // Verify admin authentication
    const user = await verifyAdminRole(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    switch (action) {
      case 'status':
        const status = commissionSchedulerService.getStatus();
        const pendingCommissions = await commissionAutomationService.getPendingCommissions();
        
        return NextResponse.json({
          scheduler: status,
          pendingCommissions: pendingCommissions.length,
          totalPendingAmount: pendingCommissions.reduce((sum, c) => sum + c.amount, 0)
        });

      case 'leaderboard':
        const leaderboard = await commissionAutomationService.getLeaderboard();
        return NextResponse.json({ leaderboard });

      case 'reports':
        const reports = await commissionAutomationService.generateComplianceReport();
        return NextResponse.json({ reports });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Commission scheduler API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { action, referrerId } = await request.json();

    // Verify admin authentication
    const user = await verifyAdminRole(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    switch (action) {
      case 'start':
        await commissionSchedulerService.startScheduler();
        return NextResponse.json({ message: 'Commission scheduler started' });

      case 'stop':
        commissionSchedulerService.stopScheduler();
        return NextResponse.json({ message: 'Commission scheduler stopped' });

      case 'trigger':
        await commissionSchedulerService.triggerManualPayout(referrerId);
        return NextResponse.json({ 
          message: referrerId 
            ? `Manual payout triggered for referrer ${referrerId}` 
            : 'Manual payout triggered for all pending commissions'
        });

      case 'process_commission':
        const { transactionId, transactionAmount, transactionType, payerId } = await request.json();
        const commission = await commissionAutomationService.calculateCommission(
          transactionId,
          transactionAmount,
          transactionType,
          payerId
        );
        
        return NextResponse.json({ 
          commission,
          message: commission ? 'Commission calculated and recorded' : 'No commission applicable'
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Commission scheduler API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
