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
} from "firebase/firestore";
import {app} from "@/lib/firebase";

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
        // Retrieve user profile and membership tier from Firestore
        const userDoc = await getDoc(doc(db, "users", user?.uid || 'default'));
        if (!userDoc.exists()) {
            console.error("User document not found");
            return null;
        }
        const userData = userDoc.data();
        const { membership } = userData;

        const potentialMatch = tradeOffers.find(offer =>
            offer.type !== ticket.type && offer.status === "Pending"
        );

        if (potentialMatch) {
            try {
                const riskAssessment = await getRiskAssessment({ userId: user?.uid || 'default' });
                const riskScore = riskAssessment?.riskScore || 50; // Default risk score

                if (riskScore < 70) {
                    // Check based on membership tier
                    if (isTradeSuitableForTier(membership, potentialMatch)) {
                        return potentialMatch;
                    } else {
                        console.log("Trade is not suitable for the user's membership tier.");
                        return null;
                    }
                } else {
                    console.log("Risk assessment failed for potential match.");
                    return null;
                }
            } catch (error) {
                console.error("Failed to retrieve risk assessment:", error);
                return null; // Do not match if risk assessment fails
            }
        }

        return null;
    };

    // Function to determine if a trade is suitable for a membership tier
    const isTradeSuitableForTier = (membership: string, trade: any) => {
        // Define rules based on membership (example rules)
        switch (membership) {
            case "Basic":
                return parseFloat(trade.amount) <= 200; // Basic members trade less than 200 coins
            case "Ambassador":
                return parseFloat(trade.amount) <= 500; // Ambassador members trade less than 500 coins
            case "Business":
                return true; // Business members can invest in any trade
            default:
                return false;
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

    const handleFileDispute = () => {
        // Simulate submitting the dispute details to admin - replace with actual Firebase function call
        toast({
            title: "Dispute Filed",
            description: `Dispute for trade ID: ${disputeDetails.tradeId} has been filed. Our team will review it shortly.`,
        });
        setDisputeOpen(false);
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
                  <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                          <label htmlFor="reason">Reason for Dispute</label>
                          <Textarea
                              id="reason"
                              placeholder="Describe the issue"
                              value={disputeDetails.reason}
                              onChange={(e) => setDisputeDetails({ ...disputeDetails, reason: e.target.value })}
                          />
                      </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                      <DialogClose asChild>
                          <Button type="button" variant="secondary">
                              Cancel
                          </Button>
                      </DialogClose>
                      <Button type="button" onClick={handleFileDispute}>
                          File Dispute
                      </Button>
                  </div>
              </DialogContent>
          </Dialog>
      </CardContent>
    </Card>
  );
}

