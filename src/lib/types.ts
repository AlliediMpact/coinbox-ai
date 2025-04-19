export interface TradeTicket {
    id: string;
    userId: string;
    type: 'Borrow' | 'Invest';
    amount: number;
    interest: number;
    status: 'Open' | 'Matched' | 'Escrow' | 'Completed' | 'Disputed' | 'Cancelled';
    description?: string;
    createdAt: Date;
    updatedAt: Date;
    matchedTicketId?: string;
    escrowAmount?: number;
    maturityDate?: Date;
    membershipTier: string;
}

export interface EscrowTransaction {
    id: string;
    ticketId: string;
    investorId: string;
    borrowerId: string;
    amount: number;
    interest: number;
    status: 'Pending' | 'Released' | 'Refunded';
    createdAt: Date;
    releasedAt?: Date;
}

export interface DisputeRequest {
    id: string;
    ticketId: string;
    userId: string;
    reason: string;
    evidence?: string;
    status: 'Open' | 'UnderReview' | 'Resolved' | 'Rejected';
    createdAt: Date;
    resolvedAt?: Date;
    resolution?: string;
}