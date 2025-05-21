import { useState, useEffect } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { colors, animations } from "@/styles/designTokens";
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
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { useFormWithValidation } from '@/lib/form-utils';
import { BaseSyntheticEvent } from 'react';
import * as z from 'zod';
import { TradeTicket } from '@/lib/types';
import { TradingService } from '@/lib/trading-service';
import { MembershipTierType, getTierConfig } from '@/lib/membership-tiers';
import { formatCurrency } from '@/lib/utils';
import { ErrorBoundary } from './ErrorBoundary';
import TicketDetails from './TicketDetails';
// Import loading components
import PageLoading, { InlineLoading } from "@/components/PageLoading";
import ContentPlaceholder from "@/components/ContentPlaceholder";

// Animation variants
const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { 
        opacity: 1, 
        y: 0,
        transition: {
            type: "spring",
            stiffness: 300,
            damping: 24
        }
    }
};

const cardVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { 
        opacity: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 300,
            damping: 24
        }
    },
    hover: {
        y: -5,
        boxShadow: "0 12px 20px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -5px rgba(0, 0, 0, 0.04)",
        transition: {
            type: "spring",
            stiffness: 300,
            damping: 15
        }
    },
    tap: {
        scale: 0.98
    }
};

const badgeVariants: Variants = {
    hidden: { opacity: 0, scale: 0.8 },
    show: { 
        opacity: 1, 
        scale: 1,
        transition: { 
            type: "spring",
            stiffness: 500,
            damping: 25
        }
    }
};

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
    
    const tradingService = new TradingService();
    const db = getFirestore();

    // Load user membership tier and wallet data
    const loadUserData = async () => {
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
            
            // Add slight delay to show loading state (improves user experience)
            await new Promise(resolve => setTimeout(resolve, 800));
            
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
    };
    
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
            
            await tradingService.createDispute({
                ticketId: disputeDetails.ticketId,
                userId: user.uid,
                ...values
            });
            
            // Track the dispute creation
            await trackTransactionHistory(ticket, "Create Dispute", values.reason);
            
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
        try {
            // Show status toast while finding match (enhanced loading feedback)
            toast({
                title: "Finding Match",
                description: "Please wait while we find a match for your ticket...",
            });
            
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
        try {
            // Show confirmation progress toast (enhanced loading feedback)
            toast({
                title: "Confirming Trade",
                description: "Processing your confirmation...",
            });
            
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
        try {
            // Show cancellation progress toast (enhanced loading feedback)
            toast({
                title: "Cancelling Ticket",
                description: "Processing your cancellation request...",
            });
            
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
    }, [user, db]);

    return (
        <ErrorBoundary>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: animations.easings.easeOut }}
                className="w-full"
            >
                <Card className="overflow-hidden">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 500,
                                            damping: 30,
                                            delay: 0.2
                                        }}
                                        className="mr-2 h-6 w-6 text-primary rounded-full bg-primary/10 flex items-center justify-center"
                                    >
                                        <svg className="h-4 w-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                        </svg>
                                    </motion.div>
                                    <motion.span
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3, duration: 0.5 }}
                                        className="bg-clip-text text-transparent"
                                        style={{ backgroundImage: `linear-gradient(90deg, ${colors.primary.blue} 0%, ${colors.primary.purple} 100%)` }}
                                    >
                                        P2P Trading
                                    </motion.span>
                                </CardTitle>
                                <CardDescription>Create and manage your borrow/invest tickets</CardDescription>
                            </div>
                            <motion.div 
                                initial="hidden"
                                animate="show"
                                variants={badgeVariants}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="hidden sm:block"
                            >
                                <Badge variant="outline" className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-sm">
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
                                {/* Rest of the UI goes here - unchanged */}
                            </>
                        )}
                    </CardContent>

                    {/* Ticket Details Dialog */}
                    <Dialog open={ticketDetailsOpen} onOpenChange={setTicketDetailsOpen}>
                        <DialogContent className="max-w-2xl bg-transparent border-0 shadow-none p-0">
                            <AnimatePresence>
                                {selectedTicketId && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ 
                                            type: "spring", 
                                            stiffness: 300, 
                                            damping: 25 
                                        }}
                                    >
                                        <TicketDetails 
                                            ticketId={selectedTicketId} 
                                            onClose={handleCloseTicketDetails}
                                            onConfirm={handleConfirmTrade}
                                            onDispute={handleOpenDispute}
                                            onCancel={handleCancelTicket}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </DialogContent>
                    </Dialog>
                </Card>
            </motion.div>
        </ErrorBoundary>
    );
}
