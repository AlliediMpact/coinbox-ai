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
    {id: 1, type: "Borrow", amount: "200", status: "Open"},
    {id: 2, type: "Invest", amount: "500", status: "Closed"},
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

    const handleInvestCoins = () => {
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

        // Lock funds and set maturity in real implementation

        // Update wallet balance and trade offers locally
        setWalletBalance(prevBalance => prevBalance - amount);
        localStorage.setItem('walletBalance', (walletBalance - amount).toString());
        setTradeOffers(prevOffers => [
            ...prevOffers,
            {
                id: prevOffers.length + 1,
                type: "Invest",
                amount: amount.toString(),
                interest: "20", // fixed 20% return
                status: "Locked",
            },
        ]);

        toast({
            title: "Investment Successful",
            description: `Investing ${amount} coins with a fixed 20% return per month. Funds will be locked until maturity.`,
        });
    };

    const handleBorrowCoins = () => {
        const amount = parseFloat(loanAmount);
        const membershipTier = "Basic"; // Replace with user's actual membership tier
        const loanLimit = getLoanLimitForUser(membershipTier);
        console.log(loanLimit)
        if (isNaN(amount) || amount <= 0) {
            toast({
                title: "Error",
                description: "Please enter a valid loan amount.",
                variant: "destructive",
            });
            return;
        }
        if (amount > loanLimit) {
            toast({
                title: "Error",
                description: `You cannot borrow more than your loan limit: ${loanLimit}.`,
                variant: "destructive",
            });
            return;
        }
        if (borrowing) {
            return;
        }

        // Implement borrow coin logic here
        setBorrowing(true); // Start borrowing process
        setTimeout(() => {
            // Simulate successful borrowing
            setWalletBalance(prevBalance => prevBalance + amount);
            localStorage.setItem('walletBalance', (walletBalance + amount).toString());
            setTradeOffers(prevOffers => [
                ...prevOffers,
                {
                    id: prevOffers.length + 1,
                    type: "Borrow",
                    amount: amount.toString(),
                    interest: "20", // fixed 20% repayment fee
                    status: "Active",
                },
            ]);
            toast({
                title: "Loan Initiated",
                description: `Borrowing ${loanAmount} coins with a 20% repayment fee.`,
            });
            setLoanAmount("");
            setBorrowing(false); // End borrowing process
        }, 2000);
    };

  // Mock function to simulate automated matching
  const findMatchingTrades = (ticket: any) => {
    const matchedTrade = tradeOffers.find(offer => offer.type !== ticket.type && offer.status === "Pending");
    return matchedTrade || null;
  };

  const determineInterestRate = (amount: number, type: string) => {
    // Implement more complex logic here based on user tier, market conditions, etc.
    return type === "Borrow" ? 10 + Math.random() * 5 : 5 + Math.random() * 5; // Example rates
  };

    const handleMatchTrade = (ticket: any) => {
        // Find a matching trade offer
        const match = tradeOffers.find(offer => offer.type !== ticket.type && offer.status === "Pending");

        if (match) {
            // Update status of matched ticket
            setTickets(tickets.map(t =>
                t.id === ticket.id ? { ...t, status: "Matched" } : t
            ));

            // Update the status of matched trade offer
            setTradeOffers(tradeOffers.map(offer =>
                offer.id === match.id ? { ...offer, status: "Matched" } : offer
            ));

            toast({
                title: "Trade Matched",
                description: `Trade matched with offer ID: ${match.id}.`,
            });
        } else {
            toast({
                title: "No Match Found",
                description: "No matching trade offers found.",
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
      </CardContent>
    </Card>
  );
}
