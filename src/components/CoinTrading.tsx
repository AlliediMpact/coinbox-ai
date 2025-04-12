'use client';

import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {useState} from "react";
import {Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import {Textarea} from "@/components/ui/textarea";

export default function CoinTrading() {
  const [tickets, setTickets] = useState([
    {id: 1, type: "Borrow", amount: "R200", status: "Open"},
    {id: 2, type: "Invest", amount: "R500", status: "Closed"},
  ]);
  const [open, setOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({type: "Borrow", amount: "", description: ""});

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Coin Trading</CardTitle>
        <CardDescription>Engage in peer-to-peer coin trading.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <ul>
          {tickets.map((ticket) => (
            <li key={ticket.id} className="flex justify-between items-center">
              <span>
                {ticket.type} - {ticket.amount}
              </span>
              <span>Status: {ticket.status}</span>
            </li>
          ))}
        </ul>
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
                <select
                  id="type"
                  className="border rounded px-2 py-1"
                  value={newTicket.type}
                  onChange={(e) => setNewTicket({...newTicket, type: e.target.value})}
                >
                  <option value="Borrow">Borrow</option>
                  <option value="Invest">Invest</option>
                </select>
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
