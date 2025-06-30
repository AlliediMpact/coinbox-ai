import { NextResponse } from 'next/server';
import { enhancedKycService } from '@/lib/kyc-service-enhanced';
import { verifyAdminRole } from '@/lib/auth-helpers';

/**
 * Admin API for KYC management
 * Protected route - requires admin authentication
 */

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const userId = url.searchParams.get('userId');

    // Verify admin authentication
    const user = await verifyAdminRole(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    switch (action) {
      case 'pending':
        const pendingVerifications = await enhancedKycService.getPendingVerifications();
        return NextResponse.json({ verifications: pendingVerifications });

      case 'user_kyc':
        if (!userId) {
          return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }
        
        const userKyc = await enhancedKycService.getKycStatus(userId);
        const userDocuments = await enhancedKycService.getUserDocuments(userId);
        
        return NextResponse.json({ 
          kyc: userKyc,
          documents: userDocuments 
        });

      case 'reports':
        const reports = await enhancedKycService.generateComplianceReport();
        return NextResponse.json({ reports });

      case 'all_verifications':
        const allVerifications = await enhancedKycService.getAllVerifications();
        return NextResponse.json({ verifications: allVerifications });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('KYC admin API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { action, userId, documentId, status, notes } = await request.json();

    // Verify admin authentication
    const user = await verifyAdminRole(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    switch (action) {
      case 'approve_document':
        if (!documentId || !userId) {
          return NextResponse.json({ error: 'Document ID and User ID required' }, { status: 400 });
        }
        
        await enhancedKycService.updateDocumentStatus(documentId, 'approved', notes);
        
        // Check if all required documents are approved
        const userDocuments = await enhancedKycService.getUserDocuments(userId);
        const allApproved = userDocuments.every(doc => doc.status === 'approved');
        
        if (allApproved) {
          await enhancedKycService.updateKycStatus(userId, 'approved');
        }
        
        return NextResponse.json({ 
          message: 'Document approved',
          allDocumentsApproved: allApproved
        });

      case 'reject_document':
        if (!documentId || !notes) {
          return NextResponse.json({ error: 'Document ID and rejection notes required' }, { status: 400 });
        }
        
        await enhancedKycService.updateDocumentStatus(documentId, 'rejected', notes);
        return NextResponse.json({ message: 'Document rejected' });

      case 'approve_kyc':
        if (!userId) {
          return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }
        
        await enhancedKycService.updateKycStatus(userId, 'approved', notes);
        return NextResponse.json({ message: 'KYC verification approved' });

      case 'reject_kyc':
        if (!userId || !notes) {
          return NextResponse.json({ error: 'User ID and rejection notes required' }, { status: 400 });
        }
        
        await enhancedKycService.updateKycStatus(userId, 'rejected', notes);
        return NextResponse.json({ message: 'KYC verification rejected' });

      case 'request_additional_docs':
        if (!userId || !notes) {
          return NextResponse.json({ error: 'User ID and additional requirements required' }, { status: 400 });
        }
        
        await enhancedKycService.updateKycStatus(userId, 'incomplete', notes);
        return NextResponse.json({ message: 'Additional documents requested' });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('KYC admin API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
