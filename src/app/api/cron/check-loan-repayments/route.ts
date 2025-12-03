import { NextRequest, NextResponse } from 'next/server';
import { loanRepaymentService } from '@/lib/loan-repayment-service';

export const dynamic = 'force-dynamic';

// This endpoint should be called daily by a cron job
// Vercel Cron: Configure in vercel.json
export async function GET(request: NextRequest) {
  try {
    // Verify the request is from a trusted source (Vercel Cron or authorized service)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key';

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Running loan repayment check cron job...');

    // Check for upcoming repayments and send reminders
    await loanRepaymentService.checkUpcomingRepayments();

    return NextResponse.json({
      success: true,
      message: 'Loan repayment check completed successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Loan repayment cron job error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred while checking loan repayments',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
