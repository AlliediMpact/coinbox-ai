import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getUserRole } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized: No session found' }, { status: 401 });
        }
        
        // Get the user ID from the session
        let userId: string | undefined;
        if ((session.user as any).id) {
            userId = (session.user as any).id;
        } else if ((session.user as any).sub) {
            userId = (session.user as any).sub;
        }
        
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized: No user ID found in session' }, { status: 401 });
        }

        // Use the utility function to get the role
        const role = await getUserRole(userId);
        
        return NextResponse.json({ 
            role: role,
            permissions: {
                canModifyUsers: role === 'admin',
                canViewAdminPanel: role === 'admin' || role === 'support',
                isReadOnly: role === 'support'
            }
        });
    } catch (error: any) {
        console.error('Error checking user role:', error);
        return NextResponse.json({ error: 'Failed to check role' }, { status: 500 });
    }
}
