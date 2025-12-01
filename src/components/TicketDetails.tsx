'use client';

import { useState, useEffect } from "react";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { TradeTicket } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Clock, Coins, UserCheck, FileText, Calendar, DollarSign, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { colors, animations } from "@/styles/designTokens";
import ContentPlaceholder from "@/components/ContentPlaceholder";
import { InlineLoading } from "@/components/PageLoading";

interface TicketDetailsProps {
  ticketId: string;
  onClose: () => void;
  onConfirm?: (ticket: TradeTicket) => void;
  onDispute?: (ticketId: string) => void;
  onCancel?: (ticket: TradeTicket) => void;
}

// Animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      type: "spring", 
      stiffness: 400, 
      damping: 25 
    }
  }
};

const badgeVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { 
      type: "spring",
      stiffness: 500,
      damping: 25
    }
  }
};

const buttonVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      type: "spring", 
      stiffness: 500, 
      damping: 25,
      delay: 0.3
    }
  },
  hover: { 
    scale: 1.05,
    transition: { 
      type: "spring", 
      stiffness: 400, 
      damping: 10 
    }
  },
  tap: { 
    scale: 0.95 
  }
};

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
      <Card className="w-full max-w-md overflow-hidden bg-gradient-to-br from-white to-gray-50 border-gray-200/80">
        <CardHeader>
          <div className="flex items-center gap-2">
            <InlineLoading message="Loading ticket details" />
          </div>
        </CardHeader>
        <CardContent className="py-6 relative min-h-[300px]">
          <ContentPlaceholder 
            type="card" 
            count={1}
            className="mb-4"
          />
          <ContentPlaceholder 
            type="list" 
            count={3}
            className="mb-4"
          />
          
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-[2px]">
            <div className="px-6 py-4 rounded-lg">
              <InlineLoading message="Loading ticket details and transaction history" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!ticket) {
    return (
      <Card className="w-full max-w-md overflow-hidden bg-gradient-to-br from-white to-gray-50 border-gray-200/80">
        <CardHeader>
          <motion.div 
            className="flex items-center gap-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
            <CardTitle>Ticket Not Found</CardTitle>
          </motion.div>
        </CardHeader>
        <CardContent className="py-6">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center text-center"
          >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.3 }}
              className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-3"
            >
              <svg className="h-8 w-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.div>
            <p className="text-gray-600 mb-4">The requested ticket could not be found or has been deleted.</p>
          </motion.div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <motion.div
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }}
          >
            <Button onClick={onClose} className="px-8">Close</Button>
          </motion.div>
        </CardFooter>
      </Card>
    );
  }

  // Format dates for display
  const createdDate = new Date(ticket.createdAt).toLocaleDateString();
  const createdTime = new Date(ticket.createdAt).toLocaleTimeString();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        layoutId={`ticket-${ticket.id}-details`}
      >
        <Card className="w-full max-w-md overflow-hidden bg-gradient-to-br from-white to-gray-50 border-gray-200/80">
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <CardHeader className="pb-4 border-b border-gray-100/80">
              <div className="flex justify-between items-center">
                <motion.div variants={itemVariants} className="flex items-center gap-2">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    ticket.type === 'Invest' 
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-purple-100 text-purple-600'
                  }`}>
                    {ticket.type === 'Invest' ? (
                      <DollarSign className="h-4 w-4" />
                    ) : (
                      <UserCheck className="h-4 w-4" />
                    )}
                  </div>
                  <CardTitle>Ticket Details</CardTitle>
                </motion.div>
                <motion.div variants={badgeVariants}>
                  <Badge 
                    className={`
                      ${ticket.status === 'Open' ? 'bg-blue-100 text-blue-700 border-blue-200' : 
                        ticket.status === 'Escrow' ? 'bg-amber-100 text-amber-700 border-amber-200' : 
                        ticket.status === 'Completed' ? 'bg-green-100 text-green-700 border-green-200' : 
                        'bg-red-100 text-red-700 border-red-200'} 
                      shadow-sm
                    `}
                  >
                    <motion.div 
                      className="flex items-center gap-1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className={`w-2 h-2 rounded-full ${
                        ticket.status === 'Open' ? 'bg-blue-500' : 
                        ticket.status === 'Escrow' ? 'bg-amber-500' : 
                        ticket.status === 'Completed' ? 'bg-green-500' :
                        'bg-red-500'
                      }`}></div>
                      {ticket.status}
                    </motion.div>
                  </Badge>
                </motion.div>
              </div>
              <motion.div variants={itemVariants}>
                <CardDescription className="mt-2 flex items-center gap-1">
                  <span className="text-blue-600 font-medium">{ticket.type}</span> 
                  <span className="text-gray-500">{ticket.type === 'Invest' ? 'Offer' : 'Request'}</span>
                  <motion.span
                    className="bg-gray-100 text-gray-500 px-2 py-0.5 text-xs rounded-full ml-2"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    #{ticket.id.substring(0, 8)}
                  </motion.span>
                </CardDescription>
              </motion.div>
            </CardHeader>
            
            <CardContent className="space-y-5 pt-5">
              <motion.div variants={itemVariants} className="bg-white/50 p-4 rounded-lg border border-gray-100 shadow-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Amount</p>
                    <motion.div 
                      className="flex items-center space-x-1"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                        <Coins className="h-4 w-4 text-green-600" />
                      </div>
                      <span className="font-bold text-lg">{formatCurrency(ticket.amount)}</span>
                    </motion.div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Interest Rate</p>
                    <motion.div 
                      className="flex items-center space-x-1"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <UserCheck className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="font-bold text-lg">{ticket.interest}%</span>
                    </motion.div>
                  </div>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-1">
                <p className="text-sm text-gray-500">Created</p>
                <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded">
                  <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center">
                    <Calendar className="h-3 w-3 text-gray-500" />
                  </div>
                  <span className="font-medium">{createdDate} at {createdTime}</span>
                </div>
              </motion.div>
              
              {ticket.description && (
                <motion.div variants={itemVariants} className="space-y-1">
                  <p className="text-sm text-gray-500">Description</p>
                  <div className="flex items-start space-x-2 bg-gray-50 p-3 rounded">
                    <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center mt-0.5">
                      <FileText className="h-3 w-3 text-gray-500" />
                    </div>
                    <span className="font-medium">{ticket.description}</span>
                  </div>
                </motion.div>
              )}
              
              {matchedTicket && (
                <motion.div 
                  variants={itemVariants}
                  className="mt-4 p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-100/50 shadow-sm"
                >
                  <motion.div 
                    className="flex items-center gap-2 mb-3"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                      <svg className="h-3 w-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-blue-700">Matched Ticket Details</p>
                  </motion.div>
                  
                  <motion.div 
                    className="grid grid-cols-2 gap-3 text-sm bg-white/80 p-3 rounded-md"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <div>
                      <p className="text-gray-500 text-xs">Type</p>
                      <p className="font-medium">{matchedTicket.type}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Amount</p>
                      <p className="font-medium">{formatCurrency(matchedTicket.amount)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Interest</p>
                      <p className="font-medium">{matchedTicket.interest}%</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Status</p>
                      <p className="font-medium flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${
                          matchedTicket.status === 'Open' ? 'bg-blue-500' : 
                          matchedTicket.status === 'Escrow' ? 'bg-amber-500' : 
                          matchedTicket.status === 'Completed' ? 'bg-green-500' :
                          'bg-red-500'
                        }`}></div>
                        {matchedTicket.status}
                      </p>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </CardContent>
            
            <CardFooter className="flex justify-between pt-4 border-t border-gray-100">
              <motion.div variants={itemVariants}>
                <Button 
                  variant="outline" 
                  onClick={onClose}
                  className="border-gray-200"
                >
                  Close
                </Button>
              </motion.div>
              
              <motion.div variants={itemVariants} className="space-x-2">
                {ticket.status === 'Open' && onCancel && (
                  <Button 
                    variant="destructive" 
                    onClick={() => onCancel(ticket)}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    <motion.div
                      className="flex items-center gap-1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      Cancel Ticket
                    </motion.div>
                  </Button>
                )}
                
                {ticket.status === 'Escrow' && (
                  <>
                    {onConfirm && (
                      <motion.div
                        variants={buttonVariants}
                        whileHover="hover"
                        whileTap="tap"
                      >
                        <Button 
                          variant="default" 
                          onClick={() => onConfirm(ticket)}
                          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                        >
                          Confirm Trade
                        </Button>
                      </motion.div>
                    )}
                    
                    {onDispute && (
                      <motion.div
                        variants={buttonVariants}
                        whileHover="hover"
                        whileTap="tap"
                      >
                        <Button 
                          variant="destructive" 
                          onClick={() => onDispute(ticket.id)}
                          className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                        >
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          Dispute
                        </Button>
                      </motion.div>
                    )}
                  </>
                )}
              </motion.div>
            </CardFooter>
          </motion.div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
