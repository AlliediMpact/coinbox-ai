'use client';

import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {useState, useEffect} from "react";
import {Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import {Textarea} from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast"; // Import the useToast hook
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useAuth } from '@/components/AuthProvider';
import {getRiskAssessment} from "@/ai/flows/risk-assessment-flow";
import {
    doc,
    getDoc,
    setDoc,
    getFirestore,
    updateDoc,
    collection,
    query,
    where,
    getDocs,
} from "firebase/firestore";
import {app} from "@/lib/firebase";
import * as z from "zod"
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod"

// Mock function to simulate fetching loan limit based on membership tier
const getLoanLimitForUser = (membershipTier: string) => {
    switch (membershipTier) {
        case "Basic":
            return 500;
        case "Ambassador":
            return 1000;
        case "Business":
            return 5000;
        default:
            return 0;
    }
};

// Zod schema for dispute form validation
const disputeFormSchema = z.object({
    reason: z.string().min(10, { message: "Reason must be at least 10 characters." }),
    evidence: z.string().optional(), // Add file upload later
});

export default function CoinTrading() {
    const [tickets, setTickets] = useState([
        { id: 1, type: "Borrow", amount: "200", status: "Open", interest: "15" },
        { id: 2, type: "Invest", amount: "500", status: "Closed", interest: "10" },
    ]);
  const [open, setOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({type: "Borrow", amount: "", description: ""});
  const [tradeOffers, setTradeOffers] = useState([
    {id: 1, type: "Borrow", amount: "300", interest: "15", status: "Pending"},
    {id: 2, type: "Invest", amount: "1000", interest: "10", status: "Active"},
  ]);
	const [loanAmount, setLoanAmount] = useState('');
	const [investmentAmount, setInvestmentAmount] = useState('');
	const [selectedAmount, setSelectedAmount] = useState('');
	const { toast } = useToast(); // Initialize the useToast hook
    const { user } = useAuth();
    const [walletBalance, setWalletBalance] = useState(1800); // Mock Balance
    const [borrowing, setBorrowing] = useState(false); // Track if borrowing flow is active
    const [disputeOpen, setDisputeOpen] = useState(false);
    const [disputeDetails, setDisputeDetails] = useState({ tradeId: null, reason: "" });
    const [escrowBalance, setEscrowBalance] = useState(0);
    const db = getFirestore(app); // Initialize Firestore

    const form = useForm<z.infer<typeof disputeFormSchema>>({
        resolver: zodResolver(disputeFormSchema),
        defaultValues: {
            reason: "",
            evidence: "",
        },
    });

    useEffect(() => {
        // Load wallet balance from local storage on component mount
        const storedBalance = localStorage.getItem('walletBalance');
        if (storedBalance) {
            setWalletBalance(parseFloat(storedBalance));
        }
    }, []);

    const handleCreateTicket = () => {
        setTickets([...tickets, {
            id: tickets.length + 1,
            type: newTicket.type,
            amount: newTicket.amount,
            status: "Open",
            interest: "10"
        }]);
        setOpen(false);
        toast({
            title: "Ticket Created",
            description: "Your ticket has been created and is awaiting matching.",
        });
    };

    const canAffordInvestment = (amount: number) => {
        return walletBalance >= amount;
    };

    const handleInvestCoins = async () => {
        const amount = parseFloat(investmentAmount);

        if (isNaN(amount) || amount <= 0) {
            toast({
                title: "Error",
                description: "Please enter a valid investment amount.",
                variant: "destructive",
            });
            return;
        }

        if (!canAffordInvestment(amount)) {
            toast({
                title: "Error",
                description: "Insufficient funds in your wallet.",
                variant: "destructive",
            });
            return;
        }

        try {
            // Update wallet balance and trade offers locally
            const newWalletBalance = walletBalance - amount;
            setWalletBalance(newWalletBalance);
            localStorage.setItem('walletBalance', newWalletBalance.toString());

            // Add new investment to trade offers - adapt to Firestore as needed
            const newInvestment = {
                id: tradeOffers.length + 1,
                type: "Invest",
                amount: amount.toString(),
                interest: "20", // fixed 20% return
                status: "Locked",
            };
            setTradeOffers(prevOffers => [...prevOffers, newInvestment]);

            toast({
                title: "Investment Successful",
                description: `Investing ${amount} coins with a fixed 20% return per month. Funds will be locked until maturity.`,
            });
        } catch (error) {
            console.error("Investment failed:", error);
            toast({
                title: "Investment Error",
                description: "Failed to invest coins. Please try again.",
                variant: "destructive",
            });
        }
    };


    const handleBorrowCoins = async () => {
        const amount = parseFloat(loanAmount);
        if (isNaN(amount) || amount <= 0) {
            toast({
                title: "Error",
                description: "Please enter a valid loan amount.",
                variant: "destructive",
            });
            return;
        }

        if (borrowing) {
            return;
        }

        setBorrowing(true); // Start borrowing process

        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (!userDoc.exists()) {
                throw new Error("User profile not found.");
            }

            const userData = userDoc.data();
            const membershipTier = userData.membershipTier || "Basic"; // Get membership tier from Firestore
            const loanLimit = getLoanLimitForUser(membershipTier);

            if (amount > loanLimit) {
                throw new Error(`You cannot borrow more than your loan limit: ${loanLimit}.`);
            }

            // Simulate successful borrowing
            const newWalletBalance = walletBalance + amount;
            setWalletBalance(newWalletBalance);
            localStorage.setItem('walletBalance', newWalletBalance.toString());

            const newBorrowOffer = {
                id: tradeOffers.length + 1,
                type: "Borrow",
                amount: amount.toString(),
                interest: "20", // fixed 20% repayment fee
                status: "Active",
            };
            setTradeOffers(prevOffers => [...prevOffers, newBorrowOffer]);

            toast({
                title: "Loan Initiated",
                description: `Borrowing ${loanAmount} coins with a 20% repayment fee.`,
            });
            setLoanAmount("");

        } catch (error: any) {
            console.error("Borrowing failed:", error.message);
            toast({
                title: "Borrow Error",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setBorrowing(false); // End borrowing process
        }
    };



    const findMatchingTrades = async (ticket: any) => {
        if (!user?.uid) {
            console.error("User ID is not available");
            return null;
        }

        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) {
            console.error("User document not found");
            return null;
        }
        const userData = userDoc.data();
        const membershipTier = userData.membershipTier;

        // Fetch trade offers from Firestore that match the ticket and user's membership tier
        const tradeOffersRef = collection(db, 'tradeOffers');
        const q = query(tradeOffersRef,
            where('type', '!=', ticket.type),
            where('status', '==', 'Pending'),
            where('membershipTier', '==', membershipTier), // Ensure only trades suitable for user's tier are matched
        );

        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            // Get the first matching trade offer
            const potentialMatch = querySnapshot.docs[0].data();

            try {
                const riskAssessment = await getRiskAssessment({userId: user.uid});
                const riskScore = riskAssessment?.riskScore || 50; // Default risk score

                if (riskScore < 70) {
                    return potentialMatch;
                } else {
                    console.log("Risk assessment failed for potential match.");
                    return null; // Do not match if risk assessment fails
                }
            } catch (error) {
                console.error("Failed to retrieve risk assessment:", error);
                return null; // Do not match if risk assessment fails
            }
        } else {
            console.log("No matching trade offers found.");
            return null; // No matching trade offers found
        }
    };


    const handleMatchTrade = async (ticket: any) => {
        const match = await findMatchingTrades(ticket);

        if (match) {
            // Calculate escrow amount (including interest)
            const escrowAmount = parseFloat(ticket.amount) + (parseFloat(ticket.amount) * (parseFloat(ticket.interest) / 100));

            // Update status of matched ticket and trade offer
            setTickets(tickets.map(t =>
                t.id === ticket.id ? { ...t, status: "Escrow", escrowAmount: escrowAmount } : t
            ));
            setTradeOffers(tradeOffers.map(offer =>
                offer.id === match.id ? { ...offer, status: "Escrow", escrowAmount: escrowAmount } : offer
            ));

            // Update escrow balance
            setEscrowBalance(prevBalance => prevBalance + escrowAmount);

            toast({
                title: "Trade Matched",
                description: `Trade matched with offer ID: ${match.id}. Funds are now in escrow.`,
            });
        } else {
            toast({
                title: "No Match Found",
                description: "No matching trade offers found.",
            });
        }
    };


    const handleConfirmTrade = (ticket: any) => {
        // Simulate fund transfer and finalize the trade
        setTickets(tickets.map(t =>
            t.id === ticket.id ? { ...t, status: "Completed" } : t
        ));
        setTradeOffers(tradeOffers.map(offer =>
            offer.id === ticket.id ? { ...offer, status: "Completed" } : offer
        ));

        // Update escrow balance
        setEscrowBalance(prevBalance => prevBalance - parseFloat(ticket.amount));

        toast({
            title: "Trade Completed",
            description: `Trade completed successfully. Funds have been transferred.`,
        });
    };

    const handleOpenDispute = (tradeId: any) => {
        setDisputeOpen(true);
        setDisputeDetails({ ...disputeDetails, tradeId: tradeId });
    };

    const handleFileDispute = async (values: z.infer<typeof disputeFormSchema>) => {
        if (!disputeDetails.tradeId) {
            toast({
                title: "Error",
                description: "Trade ID is missing.",
                variant: "destructive",
            });
            return;
        }

        try {
            // Here, you would typically save the dispute details to your database
            // along with any uploaded evidence.
            console.log("Dispute details submitted:", {
                tradeId: disputeDetails.tradeId,
                reason: values.reason,
                evidence: values.evidence,
            });

            toast({
                title: "Dispute Filed",
                description: `Dispute for trade ID: ${disputeDetails.tradeId} has been filed. Our team will review it shortly.`,
            });
            setDisputeOpen(false);
        } catch (error: any) {
            console.error("Failed to file dispute:", error.message);
            toast({
                title: "Filing Dispute Error",
                description: error.message,
                variant: "destructive",
            });
        }
    };


  return (
    <Card>
      <CardHeader>
        <CardTitle>Coin Trading</CardTitle>
        <CardDescription>Engage in peer-to-peer coin trading.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
		  <div>
			  <strong>Invest Coins:</strong>
			  <div className="grid gap-2">
				  <label htmlFor="investmentAmount">Select Investment Amount</label>
				  <Select onValueChange={(value) => {
					  setInvestmentAmount(value);
					  setSelectedAmount(value);
				  }}>
					  <SelectTrigger id="investmentAmount">
						  <SelectValue placeholder={selectedAmount || "Select Amount"} />
					  </SelectTrigger>
					  <SelectContent>
						  <SelectItem value="100">100 Coins</SelectItem>
						  <SelectItem value="500">500 Coins</SelectItem>
						  <SelectItem value="1000">1000 Coins</SelectItem>
						  <SelectItem value="5000">5000 Coins</SelectItem>
					  </SelectContent>
				  </Select>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="secondary" size="sm" onClick={handleInvestCoins} disabled={!investmentAmount}>
                                Invest Coins
                            </Button>
                         </TooltipTrigger>
                        <TooltipContent>
                          Click to invest coins
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
			  </div>
		  </div>
		  <div>
			  <strong>Borrow Coins:</strong>
			  <div className="grid gap-2">
				  <label htmlFor="loanAmount">Enter Loan Amount</label>
				  <Input
					  type="number"
					  id="loanAmount"
					  placeholder="Loan Amount"
					  value={loanAmount}
					  onChange={(e) => setLoanAmount(e.target.value)}
					  disabled={borrowing} // Disable input while borrowing
				  />
                     <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                             <Button variant="secondary" size="sm" onClick={handleBorrowCoins} disabled={borrowing}>
                                 {borrowing ? "Borrowing..." : "Borrow Coins"}
                              </Button>
                         </TooltipTrigger>
                        <TooltipContent>
                          Click to borrow coins
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
			  </div>
		  </div>
          <div>
              <strong>Escrow Balance:</strong> R{escrowBalance}
          </div>
        <div>
          <strong>Your Tickets:</strong>
          <ul>
            {tickets.map((ticket) => (
              <li key={ticket.id} className="flex justify-between items-center">
                <span>
                  {ticket.type} - {ticket.amount} - Status: {ticket.status}
                </span>
                {ticket.status === "Open" && (
                     <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="secondary" size="sm" onClick={() => handleMatchTrade(ticket)}>
                                Find Match
                            </Button>
                         </TooltipTrigger>
                        <TooltipContent>
                          Click to find a match
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                )}
                  {ticket.status === "Escrow" && (
                      <>
                          <TooltipProvider>
                              <Tooltip>
                                  <TooltipTrigger asChild>
                                      <Button variant="secondary" size="sm" onClick={() => handleConfirmTrade(ticket)}>
                                          Confirm Trade
                                      </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                      Click to confirm trade and release funds
                                  </TooltipContent>
                              </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                              <Tooltip>
                                  <TooltipTrigger asChild>
                                      <Button variant="destructive" size="sm" onClick={() => handleOpenDispute(ticket.id)}>
                                          File Dispute
                                      </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                      Click to file a dispute
                                  </TooltipContent>
                              </Tooltip>
                          </TooltipProvider>
                      </>
                  )}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <strong>Trade Offers:</strong>
          <ul>
            {tradeOffers.map((offer) => (
              <li key={offer.id} className="flex justify-between items-center">
                <span>
                  {offer.type} - {offer.amount} - Interest: {offer.interest} - Status: {offer.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
               <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline">Create Ticket</Button>
                     </TooltipTrigger>
                    <TooltipContent>
                      Click to create a new ticket
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Ticket</DialogTitle>
              <DialogDescription>Create a new borrow or invest ticket.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="type">Type</label>
                <Select onValueChange={(value) => setNewTicket({...newTicket, type: value})}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder={newTicket.type} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Borrow">Borrow</SelectItem>
                    <SelectItem value="Invest">Invest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <label htmlFor="amount">Amount</label>
				  <Input
                  type="number"
                  id="amount"
                  className="border rounded px-2 py-1"
                  value={newTicket.amount}
                  onChange={(e) => setNewTicket({...newTicket, amount: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="description">Description</label>
                <Textarea
                  id="description"
                  placeholder="Describe your ticket"
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="button" onClick={handleCreateTicket}>
                Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>
          <Dialog open={disputeOpen} onOpenChange={setDisputeOpen}>
              <DialogContent>
                  <DialogHeader>
                      <DialogTitle>File Dispute</DialogTitle>
                      <DialogDescription>
                          Explain why you are filing a dispute for this trade.
                      </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={form.handleSubmit(handleFileDispute)} className="grid gap-4">
                      <div className="grid gap-2">
                          <Label htmlFor="reason">Reason for Dispute</Label>
                          <Input
                              id="reason"
                              placeholder="Describe the issue"
                              {...form.register("reason")}
                              required
                          />
                          {form.formState.errors.reason && (
                              <p className="text-sm text-red-500">{form.formState.errors.reason?.message}</p>
                          )}
                      </div>
                      <div className="grid gap-2">
                          <Label htmlFor="evidence">Supporting Evidence (Optional)</Label>
                          <Textarea
                              id="evidence"
                              placeholder="Add links or additional details to support your claim"
                              {...form.register("evidence")}
                          />
                      </div>
                      <div className="flex justify-end space-x-2">
                          <DialogClose asChild>
                              <Button type="button" variant="secondary">
                                  Cancel
                              </Button>
                          </DialogClose>
                          <Button type="submit">
                              File Dispute
                          </Button>
                      </div>
                  </form>
              </DialogContent>
          </Dialog>
      </CardContent>
    </Card>
  );
}
