import { useState, useEffect } from "react";
import { 
    getFirestore, 
    doc, 
    collection, 
    query, 
    where, 
    getDocs, 
    runTransaction, 
    Transaction, 
    orderBy, 
    DocumentData, 
    QueryDocumentSnapshot,
    onSnapshot 
} from "firebase/firestore";
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { useFormWithValidation } from '@/lib/form-utils';
import * as z from 'zod';
import { TradeTicket } from '@/lib/types';
import { TradingService } from '@/lib/trading-service';
import { MembershipTierType } from '@/lib/membership-tiers';
import { formatCurrency } from '@/lib/utils';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Form schemas
const ticketFormSchema = z.object({
    type: z.enum(['Borrow', 'Invest']),
    amount: z.number().positive(),
    description: z.string().optional()
});

const disputeFormSchema = z.object({
    reason: z.string().min(10, { message: "Reason must be at least 10 characters." }),
    evidence: z.string().optional()
});

type TicketFormData = z.infer<typeof ticketFormSchema>;
type DisputeFormData = z.infer<typeof disputeFormSchema>;

export default function CoinTrading() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [tickets, setTickets] = useState<TradeTicket[]>([]);
    const [loading, setLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [disputeOpen, setDisputeOpen] = useState(false);
    const [disputeDetails, setDisputeDetails] = useState<{ ticketId: string | null, reason: string }>({ ticketId: null, reason: "" });
    const [escrowBalance, setEscrowBalance] = useState(0);
    const [membershipTier, setMembershipTier] = useState<MembershipTierType>('Basic');
    const [walletBalance, setWalletBalance] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    
    const tradingService = new TradingService();
    const db = getFirestore();

    const { form: ticketForm, handleSubmit: handleTicketSubmit, loading: ticketLoading } = useFormWithValidation(
        ticketFormSchema,
        async (values) => {
            if (!user) throw new Error("Not authenticated");
            const ticket = await tradingService.createTicket(user.uid, {
                ...values,
                membershipTier
            });
            setTickets(prev => [ticket, ...prev]);
            setDialogOpen(false);
        },
        { successMessage: "Ticket created successfully" }
    );

    const { form: disputeForm, handleSubmit: handleDisputeSubmit, loading: disputeLoading } = useFormWithValidation(
        disputeFormSchema,
        async (values) => {
            if (!disputeDetails.ticketId || !user) throw new Error("Invalid dispute");
            await tradingService.createDispute({
                ticketId: disputeDetails.ticketId,
                userId: user.uid,
                ...values
            });
            setDisputeOpen(false);
        },
        { successMessage: "Dispute filed successfully" }
    );

    // ...existing loadUserData function...

    const handleMatchTrade = async (ticket: TradeTicket) => {
        if (!user) return;
        
        setLoading(true);
        try {
            const match = await tradingService.findMatch(ticket);
            if (match) {
                // Calculate escrow amount including interest
                const ticketEscrowAmount = ticket.amount + (ticket.amount * (ticket.interest / 100));
                
                await runTransaction(db, async (transaction: Transaction) => {
                    const ticketRef = doc(db, "tickets", ticket.id);
                    const matchedTicketRef = doc(db, "tickets", match.id);
                    
                    // Update ticket statuses
                    transaction.update(ticketRef, {
                        status: "Escrow",
                        escrowAmount: ticketEscrowAmount,
                        matchedTicketId: match.id,
                        updatedAt: new Date()
                    });

                    transaction.update(matchedTicketRef, {
                        status: "Escrow",
                        escrowAmount: ticketEscrowAmount,
                        matchedTicketId: ticket.id,
                        updatedAt: new Date()
                    });

                    // Update wallet balance
                    const userWalletRef = doc(db, "wallets", user.uid);
                    const userWalletDoc = await transaction.get(userWalletRef);

                    if (!userWalletDoc.exists()) {
                        throw new Error("User wallet not found");
                    }

                    const currentBalance = userWalletDoc.data().balance || 0;
                    if (currentBalance < ticketEscrowAmount) {
                        throw new Error("Insufficient funds for escrow");
                    }

                    transaction.update(userWalletRef, {
                        balance: currentBalance - ticketEscrowAmount,
                        updatedAt: new Date()
                    });
                });

                // Update local state
                setTickets(tickets.map(t =>
                    t.id === ticket.id 
                        ? { ...t, status: "Escrow", escrowAmount: ticketEscrowAmount, matchedTicketId: match.id }
                        : t
                ));
                setWalletBalance(prev => prev - ticketEscrowAmount);
                setEscrowBalance(prev => prev + ticketEscrowAmount);

                toast({
                    title: "Match Found",
                    description: "Funds are now in escrow."
                });
            } else {
                toast({
                    title: "No Match Found",
                    description: "No matching trades available at this time."
                });
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmTrade = async (ticket: TradeTicket) => {
        setLoading(true);
        try {
            await tradingService.confirmTrade(ticket.id);
            
            // Update local state
            setTickets(prev => prev.map(t =>
                t.id === ticket.id ? { ...t, status: "Completed" } : t
            ));
            
            // Update escrow balance
            if (ticket.escrowAmount) {
                setEscrowBalance(prev => prev - ticket.escrowAmount!);
            }

            toast({
                title: "Trade Completed",
                description: "The trade has been completed successfully."
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDispute = (ticketId: string) => {
        setDisputeDetails({ ticketId, reason: "" });
        setDisputeOpen(true);
    };

    // Load initial data
    useEffect(() => {
        if (!user) return;

        const ticketsQuery = query(
            collection(db, "tickets"),
            where("userId", "==", user.uid),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(ticketsQuery, 
            (snapshot) => {
                setTickets(snapshot.docs.map(doc => ({ 
                    id: doc.id, 
                    ...doc.data() 
                } as TradeTicket)));
                setIsLoading(false);
            },
            (error) => {
                console.error("Error in tickets subscription:", error);
                toast({
                    title: "Error",
                    description: "Failed to get real-time updates",
                    variant: "destructive"
                });
                setIsLoading(false);
            }
        );

        return () => unsubscribe();
    }, [user, db]);

    return (
        <ErrorBoundary>
            <Card>
                <CardHeader>
                    <CardTitle>P2P Trading</CardTitle>
                    <CardDescription>Create and manage your borrow/invest tickets</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {isLoading ? (
                        <div className="flex justify-center p-4">
                            <span className="loading loading-spinner"></span>
                        </div>
                    ) : (
                        <>
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-medium">Wallet Balance</p>
                                    <p className="text-2xl font-bold">{formatCurrency(walletBalance)}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Escrow Balance</p>
                                    <p className="text-2xl font-bold">{formatCurrency(escrowBalance)}</p>
                                </div>
                                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button>Create New Ticket</Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Create Trading Ticket</DialogTitle>
                                            <DialogDescription>
                                                Create a new ticket to borrow or invest coins.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <form onSubmit={ticketForm.handleSubmit(handleTicketSubmit)} className="space-y-4">
                                            <div className="space-y-2">
                                                <Label>Type</Label>
                                                <Select 
                                                    onValueChange={value => 
                                                        ticketForm.setValue('type', value as 'Borrow' | 'Invest')
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Borrow">Borrow</SelectItem>
                                                        <SelectItem value="Invest">Invest</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Amount</Label>
                                                <Input
                                                    type="number"
                                                    placeholder="Enter amount"
                                                    {...ticketForm.register('amount', { valueAsNumber: true })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Description (Optional)</Label>
                                                <Textarea
                                                    placeholder="Add details about your ticket"
                                                    {...ticketForm.register('description')}
                                                />
                                            </div>
                                            <div className="flex justify-end space-x-2">
                                                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                                    Cancel
                                                </Button>
                                                <Button type="submit" disabled={ticketLoading}>
                                                    {ticketLoading ? 'Creating...' : 'Create Ticket'}
                                                </Button>
                                            </div>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-semibold">Your Active Tickets</h3>
                                {tickets.length === 0 ? (
                                    <p className="text-sm text-gray-500">No active tickets found.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {tickets.map((ticket) => (
                                            <div
                                                key={ticket.id}
                                                className="flex items-center justify-between p-4 rounded-lg border"
                                            >
                                                <div>
                                                    <p className="font-medium">{ticket.type}</p>
                                                    <p className="text-sm text-gray-500">
                                                        {formatCurrency(ticket.amount)} • {ticket.status}
                                                    </p>
                                                </div>
                                                <div className="space-x-2">
                                                    {ticket.status === 'Open' && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleMatchTrade(ticket)}
                                                            disabled={loading}
                                                        >
                                                            Find Match
                                                        </Button>
                                                    )}
                                                    {ticket.status === 'Escrow' && (
                                                        <>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleConfirmTrade(ticket)}
                                                            >
                                                                Confirm
                                                            </Button>
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() => handleOpenDispute(ticket.id)}
                                                            >
                                                                Dispute
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </CardContent>

                {/* Dispute Dialog */}
                <Dialog open={disputeOpen} onOpenChange={setDisputeOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>File a Dispute</DialogTitle>
                            <DialogDescription>
                                Please provide details about your dispute. Our team will review it shortly.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={disputeForm.handleSubmit(handleDisputeSubmit)} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Reason for Dispute</Label>
                                <Textarea
                                    placeholder="Explain the reason for your dispute"
                                    {...disputeForm.register("reason")}
                                />
                                {disputeForm.formState.errors.reason && (
                                    <p className="text-sm text-red-500">{disputeForm.formState.errors.reason.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label>Supporting Evidence (Optional)</Label>
                                <Textarea
                                    placeholder="Provide any additional evidence or details"
                                    {...disputeForm.register("evidence")}
                                />
                            </div>
                            <div className="flex justify-end space-x-2">
                                <Button type="button" variant="outline" onClick={() => setDisputeOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={disputeLoading}>
                                    {disputeLoading ? "Submitting..." : "Submit Dispute"}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </Card>
        </ErrorBoundary>
    );
}
