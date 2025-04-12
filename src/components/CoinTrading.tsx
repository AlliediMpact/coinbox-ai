'use client';

import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {useState} from "react";
import {Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import {Textarea} from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CoinTrading() {
  const [tickets, setTickets] = useState([
    {id: 1, type: "Borrow", amount: "R200", status: "Open"},
    {id: 2, type: "Invest", amount: "R500", status: "Closed"},
  ]);
  const [open, setOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({type: "Borrow", amount: "", description: ""});
  const [tradeOffers, setTradeOffers] = useState([
    {id: 1, type: "Borrow", amount: "R300", interest: "15%", status: "Pending"},
    {id: 2, type: "Invest", amount: "R1000", interest: "10%", status: "Active"},
  ]);

  const handleCreateTicket = () => {
    // Implement ticket creation logic here
    setTickets([...tickets, {
      id: tickets.length + 1,
      type: newTicket.type,
      amount: newTicket.amount,
      status: "Open",
    }]);
    setOpen(false);
  };

  // Mock function to simulate automated matching
  const findMatchingTrades = (ticket: any) => {
    // This function would ideally connect to a backend service
    // to find matching investment/borrow requests.
    // For now, let's simulate a match.
    const matchedTrade = tradeOffers.find(offer => offer.type !== ticket.type && offer.status === "Pending");
    return matchedTrade || null;
  };

  const handleMatchTrade = (ticket: any) => {
    const match = findMatchingTrades(ticket);
    if (match) {
      // Update the state to reflect the matched trade
      setTradeOffers(tradeOffers.map(offer => offer.id === match.id ? {...offer, status: "Matched"} : offer));
      setTickets(tickets.map(t => t.id === ticket.id ? {...t, status: "Matched"} : t));
      alert(`Trade matched with offer ID: ${match.id}`);
    } else {
      alert("No matching trades found. Creating trade offer...");
      setTradeOffers([...tradeOffers, {
        id: tradeOffers.length + 1,
        type: ticket.type,
        amount: ticket.amount,
        interest: "N/A", // Interest would be determined by the offer
        status: "Pending",
      }]);
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
          <strong>Your Tickets:</strong>
          <ul>
            {tickets.map((ticket) => (
              <li key={ticket.id} className="flex justify-between items-center">
                <span>
                  {ticket.type} - {ticket.amount} - Status: {ticket.status}
                </span>
                {ticket.status === "Open" && (
                  <Button variant="secondary" size="sm" onClick={() => handleMatchTrade(ticket)}>
                    Find Match
                  </Button>
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
            <Button variant="outline">Create Ticket</Button>
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
                <input
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
