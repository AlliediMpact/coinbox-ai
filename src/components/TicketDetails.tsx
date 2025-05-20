import { useState, useEffect } from "react";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { TradeTicket } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Clock, Coins, UserCheck, FileText, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TicketDetailsProps {
  ticketId: string;
  onClose: () => void;
  onConfirm?: (ticket: TradeTicket) => void;
  onDispute?: (ticketId: string) => void;
  onCancel?: (ticket: TradeTicket) => void;
}

export default function TicketDetails({ ticketId, onClose, onConfirm, onDispute, onCancel }: TicketDetailsProps) {
  const [ticket, setTicket] = useState<TradeTicket | null>(null);
  const [matchedTicket, setMatchedTicket] = useState<TradeTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const db = getFirestore();

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        setLoading(true);
        const ticketDoc = await getDoc(doc(db, "tickets", ticketId));
        
        if (ticketDoc.exists()) {
          const ticketData = { id: ticketDoc.id, ...ticketDoc.data() } as TradeTicket;
          setTicket(ticketData);
          
          // If there's a matched ticket, fetch that too
          if (ticketData.matchedTicketId) {
            const matchedDoc = await getDoc(doc(db, "tickets", ticketData.matchedTicketId));
            if (matchedDoc.exists()) {
              setMatchedTicket({ id: matchedDoc.id, ...matchedDoc.data() } as TradeTicket);
            }
          }
        } else {
          toast({
            title: "Error",
            description: "Ticket not found",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Error fetching ticket details:", error);
        toast({
          title: "Error",
          description: "Failed to load ticket details",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchTicket();
  }, [ticketId, db, toast]);
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Ticket Details</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </CardContent>
      </Card>
    );
  }
  
  if (!ticket) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ticket Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p>The requested ticket could not be found.</p>
        </CardContent>
        <CardFooter>
          <Button onClick={onClose}>Close</Button>
        </CardFooter>
      </Card>
    );
  }

  // Format dates for display
  const createdDate = new Date(ticket.createdAt).toLocaleDateString();
  const createdTime = new Date(ticket.createdAt).toLocaleTimeString();

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Ticket Details</CardTitle>
          <Badge variant={ticket.status === 'Open' ? 'outline' : 
                          ticket.status === 'Escrow' ? 'secondary' : 
                          ticket.status === 'Completed' ? 'default' : 
                          'destructive'}>
            {ticket.status}
          </Badge>
        </div>
        <CardDescription>{ticket.type} {ticket.type === 'Invest' ? 'Offer' : 'Request'} #{ticket.id.substring(0, 8)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Amount</p>
            <div className="flex items-center space-x-1">
              <Coins className="h-4 w-4" />
              <span className="font-medium">{formatCurrency(ticket.amount)}</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Interest Rate</p>
            <div className="flex items-center space-x-1">
              <UserCheck className="h-4 w-4" />
              <span className="font-medium">{ticket.interest}%</span>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-sm text-gray-500">Created</p>
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span className="font-medium">{createdDate} at {createdTime}</span>
          </div>
        </div>
        
        {ticket.description && (
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Description</p>
            <div className="flex items-start space-x-1">
              <FileText className="h-4 w-4 mt-1" />
              <span className="font-medium">{ticket.description}</span>
            </div>
          </div>
        )}
        
        {matchedTicket && (
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
            <p className="text-sm font-medium mb-2">Matched Ticket Details</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-gray-500">Type</p>
                <p>{matchedTicket.type}</p>
              </div>
              <div>
                <p className="text-gray-500">Amount</p>
                <p>{formatCurrency(matchedTicket.amount)}</p>
              </div>
              <div>
                <p className="text-gray-500">Interest</p>
                <p>{matchedTicket.interest}%</p>
              </div>
              <div>
                <p className="text-gray-500">Status</p>
                <p>{matchedTicket.status}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onClose}>Close</Button>
        
        <div className="space-x-2">
          {ticket.status === 'Open' && onCancel && (
            <Button variant="destructive" onClick={() => onCancel(ticket)}>
              Cancel Ticket
            </Button>
          )}
          
          {ticket.status === 'Escrow' && (
            <>
              {onConfirm && (
                <Button variant="default" onClick={() => onConfirm(ticket)}>
                  Confirm Trade
                </Button>
              )}
              
              {onDispute && (
                <Button variant="destructive" onClick={() => onDispute(ticket.id)}>
                  Dispute
                </Button>
              )}
            </>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
