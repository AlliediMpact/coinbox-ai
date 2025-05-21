'use client';

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { Dispute, TradeTicket } from "@/lib/types";
import { getFirestore, collection, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";
import { AlertCircle, AlertTriangle, CheckCircle, Clock, HelpCircle, Shield } from "lucide-react";
import ContentPlaceholder from "@/components/ContentPlaceholder";
import { motion } from "framer-motion";

interface DisputeWithTicket extends Dispute {
  ticket?: TradeTicket;
}

export default function UserDisputeTracking() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [disputes, setDisputes] = useState<DisputeWithTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<DisputeWithTicket | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const db = getFirestore();

  useEffect(() => {
    const fetchDisputes = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        const disputesQuery = query(
          collection(db, "disputes"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );

        const querySnapshot = await getDocs(disputesQuery);
        const disputesData: DisputeWithTicket[] = [];

        for (const doc of querySnapshot.docs) {
          const disputeData = { id: doc.id, ...doc.data() } as DisputeWithTicket;

          // Fetch related ticket
          if (disputeData.ticketId) {
            const ticketDoc = await getDocs(
              query(collection(db, "tickets"), where("id", "==", disputeData.ticketId))
            );
            if (!ticketDoc.empty) {
              disputeData.ticket = { id: ticketDoc.docs[0].id, ...ticketDoc.docs[0].data() } as TradeTicket;
            }
          }

          disputesData.push(disputeData);
        }

        setDisputes(disputesData);
      } catch (error) {
        console.error("Error fetching disputes:", error);
        toast({
          title: "Error",
          description: "Failed to load your disputes",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDisputes();
  }, [user, db, toast]);

  const handleOpenDetails = (dispute: DisputeWithTicket) => {
    setSelectedDispute(dispute);
    setDetailsOpen(true);
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { color: string, icon: JSX.Element } } = {
      "Open": { color: "bg-blue-500", icon: <Clock className="w-3 h-3" /> },
      "UnderReview": { color: "bg-yellow-500", icon: <AlertCircle className="w-3 h-3" /> },
      "Resolved": { color: "bg-green-500", icon: <CheckCircle className="w-3 h-3" /> },
      "Rejected": { color: "bg-red-500", icon: <AlertTriangle className="w-3 h-3" /> }
    };
    
    return (
      <Badge className={`${statusMap[status]?.color || "bg-gray-500"} text-white flex items-center space-x-1`}>
        {statusMap[status]?.icon || <HelpCircle className="w-3 h-3" />}
        <span>{status}</span>
      </Badge>
    );
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <Shield className="mr-2 h-5 w-5 text-blue-600" />
          Your Disputes
        </CardTitle>
        <CardDescription>Track the status of your trade disputes</CardDescription>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <ContentPlaceholder type="list" count={2} />
        ) : disputes.length === 0 ? (
          <div className="text-center py-10">
            <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No disputes</h3>
            <p className="mt-1 text-sm text-gray-500">
              You haven't filed any disputes yet
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {disputes.map((dispute) => (
              <motion.div
                key={dispute.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => handleOpenDetails(dispute)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">
                      Dispute #{dispute.id.substring(0, 8)}
                      {dispute.ticket && (
                        <span className="ml-2 text-sm text-gray-500">
                          for Ticket #{dispute.ticket.id.substring(0, 8)}
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                      {dispute.reason}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Filed {dispute.createdAt instanceof Date || dispute.createdAt instanceof Timestamp
                        ? formatDistanceToNow(
                            dispute.createdAt instanceof Date 
                              ? dispute.createdAt 
                              : dispute.createdAt.toDate(), 
                            { addSuffix: true }
                          )
                        : "Unknown"}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(dispute.status)}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Dispute Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Dispute Details</DialogTitle>
            <DialogDescription>
              View the details of your dispute and its current status
            </DialogDescription>
          </DialogHeader>

          {selectedDispute && (
            <div className="space-y-4 mt-2">
              <Tabs defaultValue="details">
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger value="details">Dispute Details</TabsTrigger>
                  <TabsTrigger value="resolution">Resolution</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="space-y-4">
                  {/* Dispute Information */}
                  <div className="p-4 bg-gray-50 rounded-md">
                    <h3 className="font-medium mb-2">Dispute Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Dispute ID</p>
                        <p className="text-sm font-medium">#{selectedDispute.id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Status</p>
                        <p className="text-sm font-medium">{getStatusBadge(selectedDispute.status)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Submitted On</p>
                        <p className="text-sm font-medium">
                          {selectedDispute.createdAt instanceof Date || selectedDispute.createdAt instanceof Timestamp
                            ? new Date(
                                selectedDispute.createdAt instanceof Date 
                                  ? selectedDispute.createdAt 
                                  : selectedDispute.createdAt.toDate()
                              ).toLocaleString()
                            : "Unknown"}
                        </p>
                      </div>
                      {selectedDispute.status === "Resolved" || selectedDispute.status === "Rejected" ? (
                        <div>
                          <p className="text-sm text-gray-500">Resolved On</p>
                          <p className="text-sm font-medium">
                            {selectedDispute.resolvedAt instanceof Date || selectedDispute.resolvedAt instanceof Timestamp
                              ? new Date(
                                  selectedDispute.resolvedAt instanceof Date 
                                    ? selectedDispute.resolvedAt 
                                    : selectedDispute.resolvedAt.toDate()
                                ).toLocaleString()
                              : "Not resolved yet"}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm text-gray-500">Estimated Resolution</p>
                          <p className="text-sm font-medium">Within 48 hours</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Ticket Information */}
                  {selectedDispute.ticket && (
                    <div className="p-4 bg-blue-50 rounded-md">
                      <h3 className="font-medium mb-2">Related Ticket Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Ticket ID</p>
                          <p className="text-sm font-medium">#{selectedDispute.ticket.id}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Ticket Type</p>
                          <p className="text-sm font-medium">{selectedDispute.ticket.type}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Amount</p>
                          <p className="text-sm font-medium">R{selectedDispute.ticket.amount}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Interest</p>
                          <p className="text-sm font-medium">{selectedDispute.ticket.interest}%</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Status</p>
                          <p className="text-sm font-medium">{selectedDispute.ticket.status}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Created On</p>
                          <p className="text-sm font-medium">
                            {selectedDispute.ticket.createdAt instanceof Date || selectedDispute.ticket.createdAt instanceof Timestamp
                              ? new Date(
                                  selectedDispute.ticket.createdAt instanceof Date 
                                    ? selectedDispute.ticket.createdAt 
                                    : selectedDispute.ticket.createdAt.toDate()
                                ).toLocaleString()
                              : "Unknown"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Dispute Reason */}
                  <div className="space-y-2">
                    <h3 className="font-medium">Reason for Dispute</h3>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <p className="text-sm whitespace-pre-wrap">{selectedDispute.reason}</p>
                    </div>
                  </div>
                  
                  {/* Evidence if provided */}
                  {selectedDispute.evidence && (
                    <div className="space-y-2">
                      <h3 className="font-medium">Supporting Evidence</h3>
                      <div className="p-3 bg-gray-50 rounded-md">
                        <p className="text-sm whitespace-pre-wrap">{selectedDispute.evidence}</p>
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="resolution" className="space-y-4">
                  {selectedDispute.status === "Resolved" || selectedDispute.status === "Rejected" ? (
                    <>
                      <div className="p-4 rounded-md" className={selectedDispute.status === "Resolved" ? "bg-green-50" : "bg-red-50"}>
                        <h3 className="font-medium mb-2">Resolution Status</h3>
                        <div className="flex items-center space-x-2">
                          {selectedDispute.status === "Resolved" ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                          )}
                          <span className="font-medium">
                            {selectedDispute.status === "Resolved" 
                              ? "Your dispute has been resolved"
                              : "Your dispute has been rejected"}
                          </span>
                        </div>
                      </div>
                      
                      {/* Resolution details */}
                      <div className="space-y-2">
                        <h3 className="font-medium">Resolution Details</h3>
                        <div className="p-3 bg-gray-50 rounded-md">
                          <p className="text-sm whitespace-pre-wrap">
                            {selectedDispute.resolution || "No detailed resolution provided."}
                          </p>
                        </div>
                      </div>
                      
                      {/* Resolution date */}
                      <div className="p-3 bg-gray-50 rounded-md">
                        <p className="text-sm text-gray-500">Resolved on</p>
                        <p className="text-sm font-medium">
                          {selectedDispute.resolvedAt instanceof Date || selectedDispute.resolvedAt instanceof Timestamp
                            ? new Date(
                                selectedDispute.resolvedAt instanceof Date 
                                  ? selectedDispute.resolvedAt 
                                  : selectedDispute.resolvedAt.toDate()
                              ).toLocaleString()
                            : "Unknown"}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-10">
                      <Clock className="mx-auto h-12 w-12 text-blue-400" />
                      <h3 className="mt-2 text-lg font-medium text-gray-900">Pending Resolution</h3>
                      <p className="mt-1 text-sm text-gray-500 max-w-md mx-auto">
                        Your dispute is currently {selectedDispute.status === "Open" ? "waiting to be reviewed" : "under review"} by our support team. 
                        We aim to resolve all disputes within 48 hours.
                      </p>
                      
                      <div className="mt-6 border-t pt-4">
                        <h4 className="text-sm font-medium mb-2">What happens next?</h4>
                        <ul className="text-sm text-gray-600 space-y-1 text-left max-w-md mx-auto">
                          <li>• Our support team will review your dispute details</li>
                          <li>• We may contact you for additional information if needed</li>
                          <li>• Once a decision is made, you'll be notified via email</li>
                          <li>• The resolution will be displayed in this section</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
              
              <CardFooter className="flex justify-end pt-4 border-t">
                <Button variant="outline" onClick={() => setDetailsOpen(false)}>
                  Close
                </Button>
              </CardFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
