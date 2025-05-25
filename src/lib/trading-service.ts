import { getFirestore, doc, collection, query, getDocs, runTransaction, getDoc, addDoc } from 'firebase/firestore';
import { TradeTicket, EscrowTransaction, DisputeRequest } from './types';
import { validateLoanAmount, validateInvestmentAmount, getTierConfig } from './membership-tiers';
import { ServiceClient } from './service-client';
import { orderBy, where as firestoreWhere } from 'firebase/firestore';
import { getRiskAssessment } from './risk-assessment';

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
            firestoreWhere('type', '==', ticket.type === 'Borrow' ? 'Invest' : 'Borrow'),
            firestoreWhere('status', '==', 'Open'),
            firestoreWhere('amount', '==', ticket.amount),
            orderBy('createdAt', 'asc')
        ]);

        // If no matches, return null
        if (matches.length === 0) {
            return null;
        }
        
        // For each potential match, assess the risk
        const matchesWithRisk = await Promise.all(
            matches.map(async (match) => {
                try {
                    // Get risk assessment for this potential match
                    const riskAssessment = await this.assessRisk(ticket.userId, match.userId);
                    
                    // Return match with risk score
                    return {
                        match,
                        riskScore: riskAssessment
                    };
                } catch (error) {
                    console.error("Error assessing risk:", error);
                    // If risk assessment fails, assign a high risk score
                    return {
                        match,
                        riskScore: 80
                    };
                }
            })
        );
        
        // Sort by risk score (lowest risk first)
        matchesWithRisk.sort((a, b) => a.riskScore - b.riskScore);
        
        // If the best match is too risky (above 80), reject the match
        if (matchesWithRisk[0].riskScore > 80) {
            console.log(`Match rejected due to high risk score: ${matchesWithRisk[0].riskScore}`);
            return null;
        }
        
        // Return the least risky match
        return matchesWithRisk[0].match;
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

    async cancelTicket(ticketId: string): Promise<void> {
        // First, check if the ticket is available for cancellation
        const ticket = await this.getDocument<TradeTicket>(`tickets/${ticketId}`);
        
        if (!ticket) {
            throw new Error('Ticket not found');
        }
        
        if (ticket.status !== 'Open') {
            throw new Error('Only open tickets can be cancelled');
        }
        
        // Update the ticket status to cancelled
        await this.updateDocument(`tickets/${ticketId}`, {
            status: 'Cancelled',
            updatedAt: new Date()
        });
    }

    private async assessRisk(userId1: string, userId2: string): Promise<number> {
        try {
            // Get user profiles from Firestore
            const user1Doc = await getDoc(doc(this.db, 'users', userId1));
            const user2Doc = await getDoc(doc(this.db, 'users', userId2));
            
            const user1Data = user1Doc.exists() ? user1Doc.data() : null;
            const user2Data = user2Doc.exists() ? user2Doc.data() : null;
            
            // Use our risk assessment module
            const riskResult = await getRiskAssessment({
                userId: userId1,
                counterpartyId: userId2,
                userProfile: user1Data,
                counterpartyProfile: user2Data
            });
            
            console.log(`Risk assessment for transaction between ${userId1} and ${userId2}:`, 
                riskResult.riskScore, riskResult.riskLevel, riskResult.factors);
                
            return riskResult.riskScore;
        } catch (error) {
            console.error("Error during risk assessment:", error);
            // Default to medium-high risk if assessment fails
            return 60;
        }
    }
}