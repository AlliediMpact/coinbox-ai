import { getFirestore, doc, collection, addDoc, updateDoc, query, where, getDocs, runTransaction } from 'firebase/firestore';
import { TradeTicket, EscrowTransaction, DisputeRequest } from './types';
import { validateLoanAmount, validateInvestmentAmount, getTierConfig } from './membership-tiers';
import { getRiskAssessment } from '@/ai/flows/risk-assessment-flow';
import { ServiceClient } from './service-client';
import { where, orderBy } from 'firebase/firestore';

export class TradingService extends ServiceClient {
    private db = getFirestore();

    async createTicket(userId: string, data: Partial<TradeTicket>): Promise<TradeTicket> {
        const ticket = {
            userId,
            status: 'Open',
            createdAt: new Date(),
            ...data
        };
        
        return this.createDocument('tickets', ticket);
    }

    async findMatch(ticket: TradeTicket): Promise<TradeTicket | null> {
        const matches = await this.queryCollection<TradeTicket>('tickets', [
            where('type', '==', ticket.type === 'Borrow' ? 'Invest' : 'Borrow'),
            where('status', '==', 'Open'),
            where('amount', '==', ticket.amount),
            orderBy('createdAt', 'asc')
        ]);

        return matches[0] || null;
    }

    async createEscrow(ticket: TradeTicket, matchedTicket: TradeTicket): Promise<void> {
        await runTransaction(this.db, async (transaction) => {
            const ticketRef = doc(this.db, 'tickets', ticket.id);
            const matchedTicketRef = doc(this.db, 'tickets', matchedTicket.id);
            
            // Calculate escrow amount including interest
            const escrowAmount = ticket.amount + (ticket.amount * (ticket.interest / 100));

            // Create escrow transaction
            const escrow: Omit<EscrowTransaction, 'id'> = {
                ticketId: ticket.id,
                investorId: ticket.type === 'Invest' ? ticket.userId : matchedTicket.userId,
                borrowerId: ticket.type === 'Borrow' ? ticket.userId : matchedTicket.userId,
                amount: ticket.amount,
                interest: ticket.interest,
                status: 'Pending',
                createdAt: new Date()
            };

            const escrowRef = await addDoc(collection(this.db, 'escrow'), escrow);

            // Update both tickets
            transaction.update(ticketRef, {
                status: 'Escrow',
                matchedTicketId: matchedTicket.id,
                escrowAmount,
                updatedAt: new Date()
            });

            transaction.update(matchedTicketRef, {
                status: 'Escrow',
                matchedTicketId: ticket.id,
                escrowAmount,
                updatedAt: new Date()
            });
        });
    }

    async confirmTrade(ticketId: string): Promise<void> {
        await this.updateDocument(`tickets/${ticketId}`, {
            status: 'Completed',
            completedAt: new Date()
        });
    }

    async createDispute(data: DisputeRequest): Promise<void> {
        await this.createDocument('disputes', {
            ...data,
            status: 'Open',
            createdAt: new Date()
        });
    }

    private async assessRisk(userId1: string, userId2: string): Promise<number> {
        // Get user profiles and history
        const [user1Doc, user2Doc] = await Promise.all([
            doc(this.db, 'users', userId1).get(),
            doc(this.db, 'users', userId2).get()
        ]);

        const user1Data = user1Doc.data();
        const user2Data = user2Doc.data();

        // Use AI risk assessment
        const riskScore = await getRiskAssessment({
            userId: userId1,
            counterpartyId: userId2,
            userProfile: user1Data,
            counterpartyProfile: user2Data
        });

        return riskScore.riskScore;
    }
}