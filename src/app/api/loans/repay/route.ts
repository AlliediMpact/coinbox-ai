import { NextRequest, NextResponse } from 'next/server';
import { loanRepaymentService } from '@/lib/loan-repayment-service';

// Process manual loan repayment
export async function POST(request: NextRequest) {
  try {
    const { loanId, userId } = await request.json();

    if (!loanId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: loanId, userId' },
        { status: 400 }
      );
    }

    // Process the repayment
    const success = await loanRepaymentService.processRepayment(loanId, userId);

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Loan repayment processed successfully',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Repayment processing failed' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Loan repayment API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'An error occurred during repayment',
      },
      { status: 500 }
    );
  }
}

// Get user's active loans
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameter: userId' },
        { status: 400 }
      );
    }

    const loans = await loanRepaymentService.getUserLoans(userId);

    return NextResponse.json({
      success: true,
      loans,
    });
  } catch (error: any) {
    console.error('Get loans API error:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching loans' },
      { status: 500 }
    );
  }
}
