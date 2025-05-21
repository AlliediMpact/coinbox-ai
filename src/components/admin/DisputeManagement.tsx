'use client';

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, Timestamp, DocumentData, orderBy } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dispute, TradeTicket } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { AlertCircle, AlertTriangle, CheckCircle, Clock, HelpCircle, Search, Shield } from "lucide-react";
import { motion } from "framer-motion";
import PageLoading, { InlineLoading } from "@/components/PageLoading";
import ContentPlaceholder from "@/components/ContentPlaceholder";

interface DisputeWithDetails extends Dispute {
  ticket?: TradeTicket;
  userDetails?: {
    displayName: string;
    email: string;
  };
}

export default function DisputeManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [disputes, setDisputes] = useState<DisputeWithDetails[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<DisputeWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resolution, setResolution] = useState("");
  const [disputeStatus, setDisputeStatus] = useState<"Resolved" | "Rejected">("Resolved");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const db = getFirestore();

  // Fetch all disputes
  useEffect(() => {
    const fetchDisputes = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const disputesQuery = query(
          collection(db, "disputes"),
          orderBy("createdAt", "desc")
        );
        
        const querySnapshot = await getDocs(disputesQuery);
        const disputesData: DisputeWithDetails[] = [];
        
        for (const doc of querySnapshot.docs) {
          const disputeData = { id: doc.id, ...doc.data() } as DisputeWithDetails;
          
          // Fetch related ticket
          if (disputeData.ticketId) {
            const ticketDoc = await getDocs(query(collection(db, "tickets"), where("id", "==", disputeData.ticketId)));
            if (!ticketDoc.empty) {
              disputeData.ticket = { id: ticketDoc.docs[0].id, ...ticketDoc.docs[0].data() } as TradeTicket;
            }
          }
          
          // Fetch user details
          if (disputeData.userId) {
            const userDoc = await getDocs(query(collection(db, "users"), where("uid", "==", disputeData.userId)));
            if (!userDoc.empty) {
              const userData = userDoc.docs[0].data();
              disputeData.userDetails = {
                displayName: userData.displayName || "User",
                email: userData.email || "No email",
              };
            }
          }
          
          disputesData.push(disputeData);
        }
        
        setDisputes(disputesData);
      } catch (error) {
        console.error("Error fetching disputes:", error);
        toast({
          title: "Error",
          description: "Failed to load disputes",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDisputes();
  }, [user, db, toast]);
  
  // Function to handle opening the review dialog
  const handleOpenReview = (dispute: DisputeWithDetails) => {
    setSelectedDispute(dispute);
    setResolution("");
    setDisputeStatus("Resolved");
    setReviewDialogOpen(true);
  };
  
  // Submit dispute resolution
  const handleResolveDispute = async () => {
    if (!selectedDispute || !resolution) {
      toast({
        title: "Error",
        description: "Please provide a resolution",
        variant: "destructive"
      });
      return;
    }
    
    setIsProcessing(true);
    try {
      // Update the dispute in Firestore
      await updateDoc(doc(db, "disputes", selectedDispute.id), {
        status: disputeStatus,
        resolution,
        resolvedAt: new Date(),
        resolvedBy: user?.uid
      });
      
      // Update the ticket status if necessary
      if (selectedDispute.ticket) {
        await updateDoc(doc(db, "tickets", selectedDispute.ticket.id), {
          status: disputeStatus === "Resolved" ? "Completed" : "Cancelled",
          updatedAt: new Date()
        });
      }
      
      // Update local state
      setDisputes(disputes.map(d => 
        d.id === selectedDispute.id 
          ? { ...d, status: disputeStatus, resolution, resolvedAt: new Date() as any }
          : d
      ));
      
      // Show success notification
      toast({
        title: "Success",
        description: `Dispute has been ${disputeStatus.toLowerCase()}`,
      });
      
      // Close dialog
      setReviewDialogOpen(false);
    } catch (error) {
      console.error("Error resolving dispute:", error);
      toast({
        title: "Error",
        description: "Failed to resolve dispute",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Filter disputes based on search and status
  const filteredDisputes = disputes.filter(dispute => {
    const matchesSearch = 
      searchTerm === "" || 
      dispute.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispute.ticketId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispute.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispute.userDetails?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispute.reason.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = 
      filterStatus === "all" || 
      dispute.status.toString().toLowerCase() === filterStatus.toLowerCase();
      
    return matchesSearch && matchesStatus;
  });
  
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
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <CardTitle className="text-xl flex items-center">
              <Shield className="mr-2 h-5 w-5 text-blue-600" />
              Dispute Management
            </CardTitle>
            <CardDescription>
              Review and resolve user disputes for trades
            </CardDescription>
          </div>
          
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search disputes..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select onValueChange={setFilterStatus} defaultValue="all">
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="UnderReview">Under Review</SelectItem>
                <SelectItem value="Resolved">Resolved</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="relative min-h-[400px]">
              <ContentPlaceholder
                type="table"
                count={3}
                className="mt-4"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm">
                <PageLoading
                  message="Loading disputes"
                  showAfterDelay={false}
                  showTips={false}
                />
              </div>
            </div>
          ) : filteredDisputes.length === 0 ? (
            <div className="text-center py-10">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No disputes found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || filterStatus !== "all"
                  ? "Try adjusting your search or filter parameters"
                  : "There are no disputes to review at this time"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b">
                      <th className="pb-2 font-medium">ID</th>
                      <th className="pb-2 font-medium">User</th>
                      <th className="pb-2 font-medium">Ticket ID</th>
                      <th className="pb-2 font-medium">Submitted</th>
                      <th className="pb-2 font-medium">Status</th>
                      <th className="pb-2 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDisputes.map((dispute) => (
                      <motion.tr
                        key={dispute.id}
                        className="border-b"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <td className="py-3 text-sm">#{dispute.id.substring(0, 8)}</td>
                        <td className="py-3 text-sm">
                          {dispute.userDetails?.displayName || "Unknown User"}
                          <div className="text-xs text-gray-500">{dispute.userDetails?.email}</div>
                        </td>
                        <td className="py-3 text-sm">#{dispute.ticketId?.substring(0, 8) || "N/A"}</td>
                        <td className="py-3 text-sm">
                          {dispute.createdAt instanceof Date || dispute.createdAt instanceof Timestamp
                            ? formatDistanceToNow(
                                dispute.createdAt instanceof Date 
                                  ? dispute.createdAt 
                                  : dispute.createdAt.toDate(), 
                                { addSuffix: true }
                              )
                            : "Unknown"}
                        </td>
                        <td className="py-3 text-sm">
                          {getStatusBadge(dispute.status)}
                        </td>
                        <td className="py-3 text-sm text-right">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleOpenReview(dispute)}
                            disabled={dispute.status === "Resolved" || dispute.status === "Rejected"}
                          >
                            {dispute.status === "Open" || dispute.status === "UnderReview" 
                              ? "Review" 
                              : "View Details"}
                          </Button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Dispute Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Dispute Review</DialogTitle>
            <DialogDescription>
              Review the dispute details and provide a resolution
            </DialogDescription>
          </DialogHeader>
          
          {selectedDispute && (
            <div className="space-y-4 mt-2">
              {/* Dispute Details */}
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
                    <p className="text-sm text-gray-500">Submitted By</p>
                    <p className="text-sm font-medium">
                      {selectedDispute.userDetails?.displayName || "Unknown User"}
                      <span className="block text-xs text-gray-500">{selectedDispute.userDetails?.email}</span>
                    </p>
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
                </div>
              </div>
              
              {/* Dispute Reason */}
              <div className="space-y-2">
                <Label>Reason for Dispute</Label>
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="text-sm whitespace-pre-wrap">{selectedDispute.reason}</p>
                </div>
              </div>
              
              {/* Evidence if provided */}
              {selectedDispute.evidence && (
                <div className="space-y-2">
                  <Label>Supporting Evidence</Label>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <p className="text-sm whitespace-pre-wrap">{selectedDispute.evidence}</p>
                  </div>
                </div>
              )}
              
              {/* Ticket information */}
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
              
              {/* Resolution Form (only for Open and UnderReview disputes) */}
              {(selectedDispute.status === "Open" || selectedDispute.status === "UnderReview") && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="resolution-status">Resolution Status</Label>
                    <Select 
                      value={disputeStatus} 
                      onValueChange={(value) => setDisputeStatus(value as "Resolved" | "Rejected")}
                    >
                      <SelectTrigger id="resolution-status">
                        <SelectValue placeholder="Select resolution status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Resolved">Resolved (in favor of user)</SelectItem>
                        <SelectItem value="Rejected">Rejected (deny claim)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="resolution">Resolution Details</Label>
                    <Textarea
                      id="resolution"
                      placeholder="Provide details about the resolution..."
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      rows={5}
                    />
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setReviewDialogOpen(false)} disabled={isProcessing}>
                      Cancel
                    </Button>
                    <Button onClick={handleResolveDispute} disabled={!resolution || isProcessing}>
                      {isProcessing ? <InlineLoading message="Processing..." /> : "Submit Resolution"}
                    </Button>
                  </DialogFooter>
                </>
              )}
              
              {/* View only for already resolved disputes */}
              {(selectedDispute.status === "Resolved" || selectedDispute.status === "Rejected") && (
                <>
                  <div className="space-y-2">
                    <Label>Resolution</Label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <p className="text-sm whitespace-pre-wrap">{selectedDispute.resolution || "No resolution provided"}</p>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
                      Close
                    </Button>
                  </DialogFooter>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
