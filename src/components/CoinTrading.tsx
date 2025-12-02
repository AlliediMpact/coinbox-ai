'use client';

import { useState, useEffect, useCallback, BaseSyntheticEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
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
    onSnapshot, 
    getDoc,
    addDoc
} from "firebase/firestore";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { useFormWithValidation } from "@/lib/form-utils";
import { TradeTicket, Dispute } from "@/lib/types";
import { tradingService, TradingService } from "@/lib/trading-service";
// Removed server-side import - use API route instead
import { MembershipTierType, getTierConfig } from "@/lib/membership-tiers";
import { formatCurrency } from "@/lib/utils";
import { ErrorBoundary } from './ErrorBoundary';
import TicketDetails from './TicketDetails';
import PageLoading, { InlineLoading } from "@/components/PageLoading";
import ContentPlaceholder from "@/components/ContentPlaceholder";
import { colors } from "@/styles/designTokens";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { AlertTriangle } from "lucide-react";

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
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
    const [ticketDetailsOpen, setTicketDetailsOpen] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [sortBy, setSortBy] = useState<string>("date-desc");
    
    const db = getFirestore();

    // Load user membership tier and wallet data
    const loadUserData = useCallback(async () => {
        if (!user) return;
        
        try {
            setIsLoading(true);
            
            // Get user profile to determine membership tier
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                setMembershipTier(userData.membershipTier || 'Basic');
            }
            
            // Get wallet balance
            const walletDoc = await getDoc(doc(db, "wallets", user.uid));
            if (walletDoc.exists()) {
                const walletData = walletDoc.data();
                setWalletBalance(walletData.balance || 0);
            }
            
            // Calculate escrow balance from active escrow transactions
            const escrowQuery = query(
                collection(db, "tickets"),
                where("userId", "==", user.uid),
                where("status", "==", "Escrow")
            );
            
            const escrowSnapshot = await getDocs(escrowQuery);
            let totalEscrow = 0;
            escrowSnapshot.docs.forEach(doc => {
                const ticket = doc.data();
                if (ticket.escrowAmount) {
                    totalEscrow += ticket.escrowAmount;
                }
            });
            
            setEscrowBalance(totalEscrow);
        } catch (error) {
            console.error("Error loading user data:", error);
            toast({
                title: "Error",
                description: "Failed to load user data",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    }, [user, db, toast]);
    
    const { form: ticketForm, handleSubmit: handleTicketSubmit, loading: ticketLoading } = useFormWithValidation(
        ticketFormSchema,
        async (values) => {
            if (!user) throw new Error("Not authenticated");
            
            // Calculate interest rate based on ticket type
            const interest = values.type === 'Invest' ? 20 : 25; // 20% for investors, 25% for borrowers
            
            // Get tier limits based on user's membership
            const tierConfig = getTierConfig(membershipTier);
            
            // Validate amount based on ticket type and tier limits
            if (values.type === 'Borrow' && values.amount > tierConfig.loanLimit) {
                throw new Error(`Your ${membershipTier} tier only allows borrowing up to ${formatCurrency(tierConfig.loanLimit)}`);
            }
            
            if (values.type === 'Invest' && values.amount > tierConfig.investmentLimit) {
                throw new Error(`Your ${membershipTier} tier only allows investing up to ${formatCurrency(tierConfig.investmentLimit)}`);
            }
            
            // Calculate potential escrow amount including interest
            const potentialEscrowAmount = values.amount + (values.amount * (interest / 100));
            
            // Validate that user has enough funds for escrow if they're investing
            if (values.type === 'Invest' && potentialEscrowAmount > walletBalance) {
                throw new Error(`Insufficient funds for potential escrow. You need at least ${formatCurrency(potentialEscrowAmount)} in your wallet.`);
            }
            
            const ticket = await tradingService.createTicket(user.uid, {
                ...values,
                membershipTier,
                interest
            });
            setTickets(prev => [ticket, ...prev]);
            
            // Track the ticket creation
            await trackTransactionHistory(ticket, "Create Ticket");
            
            setDialogOpen(false);
        },
        { successMessage: "Ticket created successfully" }
    );

    const { form: disputeForm, handleSubmit: handleDisputeSubmit, loading: disputeLoading } = useFormWithValidation(
        disputeFormSchema,
        async (values) => {
            if (!disputeDetails.ticketId || !user) throw new Error("Invalid dispute");
            
            const ticket = tickets.find(t => t.id === disputeDetails.ticketId);
            if (!ticket) throw new Error("Ticket not found");
            
            // Call API route to create dispute
            const apiResponse = await fetch('/api/disputes/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ticketId: disputeDetails.ticketId,
                    userId: user.uid,
                    ...values
                })
            });

            if (!apiResponse.ok) {
                throw new Error('Failed to create dispute');
            }
            
            // Track the dispute creation
            await trackTransactionHistory(ticket, "Create Dispute", values.reason);
            
            // Update local ticket state
            setTickets(prev => prev.map(t => 
                t.id === disputeDetails.ticketId ? { ...t, status: 'Disputed' } : t
            ));
            
            setDisputeOpen(false);
        },
        { successMessage: "Dispute filed successfully" }
    );

    // Filter and sort tickets
    const getFilteredAndSortedTickets = () => {
        // First filter tickets
        const filteredTickets = filterStatus === "all" 
            ? tickets 
            : tickets.filter(ticket => ticket.status === filterStatus);
            
        // Then sort them
        return [...filteredTickets].sort((a, b) => {
            switch(sortBy) {
                case "date-asc":
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                case "date-desc":
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                case "amount-asc":
                    return a.amount - b.amount;
                case "amount-desc":
                    return b.amount - a.amount;
                case "interest-asc":
                    return a.interest - b.interest;
                case "interest-desc":
                    return b.interest - a.interest;
                default:
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
        });
    };

    const handleMatchTrade = async (ticket: TradeTicket) => {
        if (!user) return;
        
        setLoading(true);
        // Show status toast while finding match
        toast({
            title: "Finding Match",
            description: "Please wait while we find a match for your ticket...",
        });
        
        try {
            const match = await tradingService.findMatch(ticket);
            if (match) {
                // Calculate escrow amount including interest
                const ticketEscrowAmount = ticket.amount + (ticket.amount * (ticket.interest / 100));
                
                // Show processing toast
                toast({
                    title: "Match Found",
                    description: "Processing escrow setup...",
                });
                
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

                // Track transaction history
                await trackTransactionHistory(ticket, "Match Trade", `Matched with ticket ${match.id}`);

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
        // Show confirmation progress toast
        toast({
            title: "Confirming Trade",
            description: "Processing your confirmation...",
        });
        
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

            // Track transaction history
            await trackTransactionHistory(ticket, "Confirm Trade");

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

    const handleCancelTicket = async (ticket: TradeTicket) => {
        setLoading(true);
        // Show cancellation progress toast
        toast({
            title: "Cancelling Ticket",
            description: "Processing your cancellation request...",
        });
        
        try {
            // Call the trading service to cancel the ticket
            await tradingService.cancelTicket(ticket.id);
            
            // Update local state
            setTickets(prev => prev.filter(t => t.id !== ticket.id));
            
            // Track transaction history
            await trackTransactionHistory(ticket, "Cancel Ticket");

            toast({
                title: "Ticket Cancelled",
                description: "The ticket has been cancelled successfully."
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

    const handleOpenTicketDetails = (ticketId: string) => {
        setSelectedTicketId(ticketId);
        setTicketDetailsOpen(true);
    };
    
    const handleCloseTicketDetails = () => {
        setTicketDetailsOpen(false);
        setSelectedTicketId(null);
    };

    const trackTransactionHistory = async (ticket: TradeTicket, action: string, details?: string) => {
        if (!user) return;
        
        try {
            const historyEntry = {
                ticketId: ticket.id,
                userId: user.uid,
                action,
                details: details || '',
                timestamp: new Date(),
                ticketType: ticket.type,
                amount: ticket.amount,
                interest: ticket.interest,
                status: ticket.status
            };
            
            // Add the history entry to Firestore
            await addDoc(collection(db, "transactionHistory"), historyEntry);
            
            // Log the action
            console.log(`Transaction history tracked: ${action} for ticket ${ticket.id}`);
        } catch (error) {
            console.error("Error tracking transaction history:", error);
        }
    };

    // Load initial data
    useEffect(() => {
        if (!user) return;

        // Initial load of user data and wallet balances
        loadUserData();

        // Set up real-time listener for tickets
        const ticketsQuery = query(
            collection(db, "tickets"),
            where("userId", "==", user.uid),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(ticketsQuery, 
            (snapshot: any) => {
                setTickets(snapshot.docs.map((doc: any) => ({ 
                    id: doc.id, 
                    ...doc.data() 
                } as TradeTicket)));
                setIsLoading(false);
                
                // Refresh user data when tickets change to update balances
                loadUserData();
            },
            (error: any) => {
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
    }, [user, db, loadUserData, toast]);

    return (
        <ErrorBoundary>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Card className="overflow-hidden">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center">
                                    <svg className="mr-2 h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                    <span
                                        className="bg-clip-text text-transparent"
                                        style={{ backgroundImage: `linear-gradient(90deg, ${colors.primary.blue} 0%, ${colors.primary.purple} 100%)` }}
                                    >
                                        P2P Trading
                                    </span>
                                </CardTitle>
                                <CardDescription>Create and manage your borrow/invest tickets</CardDescription>
                            </div>
                            <motion.div 
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="hidden sm:block"
                            >
                                <Badge variant="outline" className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
                                    {membershipTier} Tier
                                </Badge>
                            </motion.div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {isLoading ? (
                            <div className="relative min-h-[400px]">
                                {/* Enhanced loading state with placeholder and visual feedback */}
                                <div className="px-2 py-6">
                                    <ContentPlaceholder 
                                        type="table"
                                        count={3}
                                        className="mt-4"
                                    />
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm">
                                    <PageLoading 
                                        message="Loading trading platform" 
                                        showAfterDelay={false}
                                        showTips={true}
                                    />
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <motion.div 
                                        className="border rounded-lg p-4 bg-gradient-to-br from-white to-gray-50 shadow-sm"
                                        whileHover={{ 
                                            y: -5,
                                            boxShadow: "0 12px 20px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -5px rgba(0, 0, 0, 0.04)"
                                        }}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 15 }}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-sm font-medium text-gray-500">Wallet Balance</p>
                                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                                </svg>
                                            </div>
                                        </div>
                                        <motion.p 
                                            className="text-2xl font-bold"
                                            initial={{ opacity: 0, scale: 0.5 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.2 }}
                                        >{formatCurrency(walletBalance)}</motion.p>
                                        <p className="text-xs text-gray-500 mt-1">Available for trading</p>
                                    </motion.div>
                                    
                                    <motion.div 
                                        className="border rounded-lg p-4 bg-gradient-to-br from-white to-gray-50 shadow-sm"
                                        whileHover={{ 
                                            y: -5,
                                            boxShadow: "0 12px 20px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -5px rgba(0, 0, 0, 0.04)"
                                        }}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.1 }}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-sm font-medium text-gray-500">Escrow Balance</p>
                                            <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                                                <svg className="h-4 w-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                </svg>
                                            </div>
                                        </div>
                                        <motion.p 
                                            className="text-2xl font-bold"
                                            initial={{ opacity: 0, scale: 0.5 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.3 }}
                                        >{formatCurrency(escrowBalance)}</motion.p>
                                        <p className="text-xs text-gray-500 mt-1">In pending trades</p>
                                    </motion.div>
                                    
                                    <motion.div 
                                        className="border rounded-lg p-4 relative overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50 shadow-sm"
                                        whileHover={{ 
                                            y: -5,
                                            boxShadow: "0 12px 20px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -5px rgba(0, 0, 0, 0.04)"
                                        }}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.2 }}
                                    >
                                        <div className="absolute top-0 right-0 w-16 h-16 -mt-6 -mr-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-20"></div>
                                        <div className="absolute bottom-0 left-0 w-24 h-24 -mb-12 -ml-12 bg-gradient-to-tr from-purple-400 to-blue-500 rounded-full opacity-10"></div>
                                        
                                        <div className="flex items-center justify-between mb-2 relative">
                                            <p className="text-sm font-medium text-gray-500">Quick Actions</p>
                                            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                                                <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                </svg>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-4">
                                            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                                    <DialogTrigger asChild>
                                        <motion.div
                                            whileHover={{ scale: 1.03 }}
                                            whileTap={{ scale: 0.97 }}
                                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                        >
                                            <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                                                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                </svg>
                                                Create New Ticket
                                            </Button>
                                        </motion.div>
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
                                                <Button type="submit" disabled={ticketLoading} className="relative">
                                                    {ticketLoading && (
                                                        <span className="absolute left-4">
                                                            <InlineLoading />
                                                        </span>
                                                    )}
                                                    {ticketLoading ? 'Creating...' : 'Create Ticket'}
                                                </Button>
                                            </div>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </div>
                                    </motion.div>
                                </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-semibold">Your Active Tickets</h3>
                                    <div className="flex space-x-2">
                                        {tickets.some(t => t.status === 'Disputed') && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.7 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="px-3 py-1 mr-2 rounded-full bg-red-50 border border-red-200 text-red-600 text-xs flex items-center"
                                            >
                                                <AlertTriangle className="h-3 w-3 mr-1" />
                                                <span>
                                                    {tickets.filter(t => t.status === 'Disputed').length} Dispute{tickets.filter(t => t.status === 'Disputed').length !== 1 ? 's' : ''} Active
                                                </span>
                                                <a href="/dashboard/disputes" className="ml-2 underline font-medium">View</a>
                                            </motion.div>
                                        )}
                                        <Select onValueChange={setFilterStatus} defaultValue="all">
                                            <SelectTrigger className="w-[130px]">
                                                <SelectValue placeholder="Filter" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Tickets</SelectItem>
                                                <SelectItem value="Open">Open</SelectItem>
                                                <SelectItem value="Escrow">In Escrow</SelectItem>
                                                <SelectItem value="Disputed">Disputed</SelectItem>
                                                <SelectItem value="Completed">Completed</SelectItem>
                                                <SelectItem value="Cancelled">Cancelled</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Select onValueChange={setSortBy} defaultValue="date-desc">
                                            <SelectTrigger className="w-[130px]">
                                                <SelectValue placeholder="Sort" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="date-desc">Newest First</SelectItem>
                                                <SelectItem value="date-asc">Oldest First</SelectItem>
                                                <SelectItem value="amount-desc">Highest Amount</SelectItem>
                                                <SelectItem value="amount-asc">Lowest Amount</SelectItem>
                                                <SelectItem value="interest-desc">Highest Interest</SelectItem>
                                                <SelectItem value="interest-asc">Lowest Interest</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 mb-4">Click on any ticket to view full details</p>
                                {tickets.length === 0 ? (
                                    <p className="text-sm text-gray-500">No active tickets found.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {getFilteredAndSortedTickets().map((ticket) => (
                                            <div
                                                key={ticket.id}
                                                className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                                                onClick={() => handleOpenTicketDetails(ticket.id)}
                                            >
                                                <div>
                                                    <p className="font-medium">{ticket.type} {ticket.type === 'Invest' ? 'Offer' : 'Request'}</p>
                                                    <p className="text-sm text-gray-500">
                                                        {formatCurrency(ticket.amount)} • {ticket.interest}% interest • 
                                                        <span className={ticket.status === 'Disputed' ? 'text-red-500 font-semibold' : ''}>
                                                            {ticket.status}
                                                        </span>
                                                    </p>
                                                    {ticket.description && (
                                                        <p className="text-xs text-gray-400 max-w-[200px] truncate">
                                                            {ticket.description}
                                                        </p>
                                                    )}
                                                    {ticket.matchedTicketId && (
                                                        <p className="text-xs text-blue-500">
                                                            Matched ticket #{ticket.matchedTicketId.substring(0, 8)}...
                                                        </p>
                                                    )}
                                                    {ticket.status === 'Disputed' && (
                                                        <p className="text-xs text-red-500">
                                                            Under dispute review • <a href="/dashboard/disputes" className="underline hover:text-red-700">Track status</a>
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="space-x-2" onClick={(e) => e.stopPropagation()}>
                                                    {ticket.status === 'Open' && (
                                                        <>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleMatchTrade(ticket)}
                                                                disabled={loading}
                                                                className="relative min-w-[90px]"
                                                            >
                                                                {loading ? (
                                                                    <InlineLoading message="Searching" />
                                                                ) : "Find Match"}
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleCancelTicket(ticket)}
                                                                disabled={loading}
                                                            >
                                                                Cancel
                                                            </Button>
                                                        </>
                                                    )}
                                                    {ticket.status === 'Escrow' && (
                                                        <>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleConfirmTrade(ticket)}
                                                                disabled={loading}
                                                                className="relative min-w-[90px]"
                                                            >
                                                                {loading ? (
                                                                    <InlineLoading message="Confirming" />
                                                                ) : "Confirm"}
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
                    </Card>
                </motion.div>
            </ErrorBoundary>
    );
}
