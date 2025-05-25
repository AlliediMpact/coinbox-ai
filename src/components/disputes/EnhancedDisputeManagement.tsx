import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { 
  disputeResolutionService, 
  Dispute, 
  DisputeStatus,
  DisputeComment,
  DisputeEvidence
} from "@/lib/dispute-resolution-service";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  HelpCircle, 
  Search, 
  Shield, 
  Paperclip,
  Send,
  Plus,
  Filter,
  ChevronDown,
  FileText,
  MoreHorizontal,
  MessageCircle,
  Users,
  Scale,
  Flag,
  CalendarClock
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

interface DisputeDetailProps {
  dispute: Dispute;
  onBack: () => void;
  onResolve: (disputeId: string, resolution: any) => void;
  currentUserRole: 'admin' | 'user' | 'arbitrator';
}

function DisputeDetail({ dispute, onBack, onResolve, currentUserRole }: DisputeDetailProps) {
  const [activeTab, setActiveTab] = useState("details");
  const [newComment, setNewComment] = useState("");
  const [newEvidence, setNewEvidence] = useState({
    type: "text" as "text" | "image" | "document" | "video",
    content: "",
    description: "",
  });
  const [isPrivateComment, setIsPrivateComment] = useState(false);
  const [isAddingEvidence, setIsAddingEvidence] = useState(false);
  const { toast } = useToast();

  // Submit a new comment
  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    try {
      const role = currentUserRole;
      await disputeResolutionService.addComment(
        dispute.id,
        dispute.userId, // This should be the current user's ID in a real implementation
        role,
        newComment,
        isPrivateComment
      );
      
      setNewComment("");
      toast({
        title: "Comment Added",
        description: "Your comment has been added to the dispute"
      });
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({
        title: "Error",
        description: "Failed to add your comment",
        variant: "destructive"
      });
    }
  };

  // Submit new evidence
  const handleSubmitEvidence = async () => {
    if (!newEvidence.content || !newEvidence.description) {
      toast({
        title: "Invalid Evidence",
        description: "Please provide both content and description",
        variant: "destructive"
      });
      return;
    }

    try {
      await disputeResolutionService.submitEvidence(
        dispute.id,
        dispute.userId, // This should be the current user's ID in a real implementation
        {
          type: newEvidence.type,
          content: newEvidence.content,
          description: newEvidence.description
        }
      );
      
      setNewEvidence({
        type: "text",
        content: "",
        description: ""
      });
      setIsAddingEvidence(false);
      
      toast({
        title: "Evidence Submitted",
        description: "Your evidence has been added to the dispute"
      });
    } catch (error) {
      console.error("Error submitting evidence:", error);
      toast({
        title: "Error",
        description: "Failed to submit evidence",
        variant: "destructive"
      });
    }
  };

  // Render a timeline event
  const renderTimelineEvent = (event: any, index: number) => {
    let icon;
    let color;

    switch (event.status) {
      case 'Open':
        icon = <Flag className="h-4 w-4" />;
        color = "text-blue-500";
        break;
      case 'Evidence':
        icon = <Paperclip className="h-4 w-4" />;
        color = "text-yellow-500";
        break;
      case 'UnderReview':
        icon = <Search className="h-4 w-4" />;
        color = "text-orange-500";
        break;
      case 'Arbitration':
        icon = <Scale className="h-4 w-4" />;
        color = "text-purple-500";
        break;
      case 'Resolved':
        icon = <CheckCircle className="h-4 w-4" />;
        color = "text-green-500";
        break;
      case 'Rejected':
        icon = <AlertTriangle className="h-4 w-4" />;
        color = "text-red-500";
        break;
      default:
        icon = <HelpCircle className="h-4 w-4" />;
        color = "text-gray-500";
    }

    return (
      <div key={index} className="flex gap-3 mb-4">
        <div className={`mt-0.5 p-1 rounded-full bg-muted ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium">
            Status changed to <span className="font-semibold">{event.status}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {event.message}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {event.timestamp?.toDate ? format(event.timestamp.toDate(), 'MMM d, yyyy • HH:mm') : 'Unknown date'}
          </p>
        </div>
      </div>
    );
  };

  // Render a comment
  const renderComment = (comment: DisputeComment) => {
    const isAdmin = comment.role === 'admin' || comment.role === 'arbitrator';
    const isOwn = comment.userId === dispute.userId;

    return (
      <div 
        key={comment.id}
        className={`flex gap-3 mb-4 ${comment.isPrivate ? 'bg-muted/50 p-3 rounded-md border-l-2 border-amber-500' : ''}`}
      >
        <Avatar>
          <AvatarFallback className={isAdmin ? 'bg-primary/20' : isOwn ? 'bg-blue-100' : 'bg-green-100'}>
            {isAdmin ? 'AD' : isOwn ? 'ME' : 'OP'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">
              {isAdmin ? 'Admin' : isOwn ? 'You' : 'Counterparty'}
            </p>
            {comment.isPrivate && currentUserRole === 'admin' && (
              <Badge variant="outline" className="text-amber-500 border-amber-500">
                Private
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {comment.createdAt?.toDate ? formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true }) : 'Unknown time'}
            </span>
          </div>
          <p className="text-sm mt-1">
            {comment.message}
          </p>
        </div>
      </div>
    );
  };

  // Render evidence
  const renderEvidence = (evidence: DisputeEvidence) => {
    const isOwn = evidence.userId === dispute.userId;

    return (
      <div key={evidence.id} className="border rounded-md p-3 mb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">
              {isOwn ? 'Your Evidence' : 'Counterparty Evidence'}
            </p>
            <Badge variant="outline">
              {evidence.type}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {evidence.submittedAt?.toDate ? formatDistanceToNow(evidence.submittedAt.toDate(), { addSuffix: true }) : 'Unknown time'}
          </p>
        </div>
        <p className="text-sm mt-2 font-medium">{evidence.description}</p>
        
        {evidence.type === 'text' && (
          <p className="text-sm mt-2 p-3 bg-muted/30 rounded border">
            {evidence.content}
          </p>
        )}
        
        {evidence.type === 'image' && (
          <div className="mt-2">
            <img 
              src={evidence.content} 
              alt={evidence.description}
              className="max-h-64 rounded border" 
            />
          </div>
        )}
        
        {(evidence.type === 'document' || evidence.type === 'video') && (
          <div className="mt-2">
            <Button variant="outline" size="sm" asChild>
              <a href={evidence.content} target="_blank" rel="noopener noreferrer">
                <FileText className="mr-2 h-4 w-4" />
                View {evidence.type}
              </a>
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <Button variant="ghost" onClick={onBack} className="px-2">
            <ChevronDown className="mr-2 h-4 w-4 rotate-90" />
            Back to list
          </Button>
          {currentUserRole === 'admin' && ['Open', 'Evidence', 'UnderReview', 'Arbitration'].includes(dispute.status) && (
            <Button onClick={() => onResolve(dispute.id, { decision: 'buyer', reason: 'Admin decision' })}>
              Resolve Dispute
            </Button>
          )}
        </div>
        <CardTitle className="mt-4 flex items-center gap-2">
          Dispute #{dispute.id.slice(0, 8)}
          <Badge className={
            dispute.status === 'Open' ? 'bg-blue-500' :
            dispute.status === 'Evidence' ? 'bg-yellow-500' :
            dispute.status === 'UnderReview' ? 'bg-orange-500' :
            dispute.status === 'Arbitration' ? 'bg-purple-500' :
            dispute.status === 'Resolved' ? 'bg-green-500' : 
            dispute.status === 'Rejected' ? 'bg-red-500' : 'bg-gray-500'
          }>
            {dispute.status}
          </Badge>
          {dispute.priority === 'high' && (
            <Badge variant="destructive">High Priority</Badge>
          )}
        </CardTitle>
        <CardDescription>
          Ticket ID: {dispute.ticketId}
        </CardDescription>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="px-6">
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
            <TabsTrigger value="evidence">Evidence</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>
        </div>
        
        <CardContent className="pt-6">
          <TabsContent value="details" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-medium mb-2">Dispute Reason</h3>
                <p className="text-sm font-semibold">{dispute.reason}</p>
                <p className="text-sm mt-2">{dispute.description}</p>
                
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">Flags</h3>
                  <div className="flex gap-2 flex-wrap">
                    {dispute.flags?.map(flag => (
                      <Badge key={flag} variant="outline">{flag}</Badge>
                    ))}
                    {(!dispute.flags || dispute.flags.length === 0) && (
                      <p className="text-sm text-muted-foreground">No flags</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Parties</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Avatar>
                      <AvatarFallback>U1</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">Dispute Creator</p>
                      <p className="text-xs text-muted-foreground">ID: {dispute.userId}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Avatar>
                      <AvatarFallback>U2</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">Counterparty</p>
                      <p className="text-xs text-muted-foreground">ID: {dispute.counterpartyId}</p>
                    </div>
                  </div>
                </div>
                
                {dispute.resolution && (
                  <div className="mt-4 p-3 border rounded-md bg-muted/30">
                    <h3 className="text-sm font-medium mb-2">Resolution</h3>
                    <Badge className={
                      dispute.resolution.decision === 'buyer' ? 'bg-green-500' :
                      dispute.resolution.decision === 'seller' ? 'bg-blue-500' :
                      dispute.resolution.decision === 'partial' ? 'bg-yellow-500' : 'bg-red-500'
                    }>
                      {dispute.resolution.decision.charAt(0).toUpperCase() + dispute.resolution.decision.slice(1)}
                    </Badge>
                    <p className="text-sm mt-2">{dispute.resolution.reason}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Resolved {dispute.resolution.resolvedAt?.toDate ? 
                        formatDistanceToNow(dispute.resolution.resolvedAt.toDate(), { addSuffix: true }) : 
                        'Unknown time'}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {currentUserRole === 'admin' && ['Open', 'Evidence', 'UnderReview'].includes(dispute.status) && (
              <div className="pt-4 mt-4 border-t">
                <h3 className="text-sm font-medium mb-2">Admin Actions</h3>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => {}}>
                    Request More Evidence
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => {}}>
                    Move to Review
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => {}}>
                    Escalate to Arbitration
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="comments">
            <ScrollArea className="h-[400px] pr-4">
              {dispute.comments && dispute.comments.length > 0 ? (
                dispute.comments
                  .filter(comment => 
                    // Only show private comments to admins
                    !comment.isPrivate || currentUserRole === 'admin'
                  )
                  .map(comment => renderComment(comment))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No comments yet
                </p>
              )}
            </ScrollArea>
            
            {['Open', 'Evidence', 'UnderReview', 'Arbitration'].includes(dispute.status) && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="comment">Add Comment</Label>
                  {currentUserRole === 'admin' && (
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="private-comment"
                        checked={isPrivateComment}
                        onChange={(e) => setIsPrivateComment(e.target.checked)}
                        className="mr-2"
                      />
                      <Label htmlFor="private-comment" className="text-xs cursor-pointer">
                        Private (only visible to admins)
                      </Label>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Textarea
                    id="comment"
                    placeholder="Type your comment here..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1"
                  />
                  <Button size="icon" onClick={handleSubmitComment} disabled={!newComment.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="evidence">
            <div className="mb-4">
              {dispute.evidence && dispute.evidence.length > 0 ? (
                dispute.evidence.map(evidence => renderEvidence(evidence))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No evidence submitted yet
                </p>
              )}
            </div>
            
            {['Open', 'Evidence', 'UnderReview'].includes(dispute.status) && !isAddingEvidence && (
              <Button onClick={() => setIsAddingEvidence(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Submit Evidence
              </Button>
            )}
            
            {isAddingEvidence && (
              <div className="border rounded-md p-4">
                <h3 className="text-sm font-medium mb-4">Submit New Evidence</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="evidence-type">Type of Evidence</Label>
                    <Select
                      value={newEvidence.type}
                      onValueChange={(value) => setNewEvidence({...newEvidence, type: value as any})}
                    >
                      <SelectTrigger id="evidence-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="image">Image</SelectItem>
                        <SelectItem value="document">Document</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="evidence-description">Description</Label>
                    <Input
                      id="evidence-description"
                      placeholder="Brief description of this evidence"
                      value={newEvidence.description}
                      onChange={(e) => setNewEvidence({...newEvidence, description: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="evidence-content">
                      {newEvidence.type === 'text' ? 'Content' : 'URL'}
                    </Label>
                    {newEvidence.type === 'text' ? (
                      <Textarea
                        id="evidence-content"
                        placeholder="Enter your text evidence here"
                        value={newEvidence.content}
                        onChange={(e) => setNewEvidence({...newEvidence, content: e.target.value})}
                      />
                    ) : (
                      <Input
                        id="evidence-content"
                        placeholder={`URL to your ${newEvidence.type}`}
                        value={newEvidence.content}
                        onChange={(e) => setNewEvidence({...newEvidence, content: e.target.value})}
                      />
                    )}
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAddingEvidence(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSubmitEvidence}>
                      Submit Evidence
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="timeline">
            <div className="space-y-1">
              {dispute.timeline && dispute.timeline.length > 0 ? (
                dispute.timeline.map(renderTimelineEvent)
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No timeline events available
                </p>
              )}
            </div>
          </TabsContent>
        </CardContent>
      </Tabs>
      
      <CardFooter className="flex justify-between border-t pt-4">
        <div className="text-xs text-muted-foreground">
          <p>Dispute created {dispute.createdAt?.toDate ? formatDistanceToNow(dispute.createdAt.toDate(), { addSuffix: true }) : 'Unknown time'}</p>
          <p>Last updated {dispute.updatedAt?.toDate ? formatDistanceToNow(dispute.updatedAt.toDate(), { addSuffix: true }) : 'Unknown time'}</p>
        </div>
        
        <div className="flex gap-2">
          {currentUserRole === 'admin' && dispute.status !== 'Resolved' && dispute.status !== 'Rejected' && (
            <Button variant="outline" size="sm">
              <Flag className="mr-2 h-4 w-4" />
              Update Status
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

export default function EnhancedDisputeManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resolution, setResolution] = useState("");
  const [disputeStatus, setDisputeStatus] = useState<"Resolved" | "Rejected">("Resolved");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<'admin' | 'user'>('user');
  
  // In a real implementation, this would come from the user's role in the system
  useEffect(() => {
    // Mock implementation - this would be replaced with actual role checking
    setCurrentUserRole('admin');
  }, [user]);

  // Fetch disputes
  useEffect(() => {
    const fetchDisputes = async () => {
      // Mock implementation - this would fetch actual disputes
      // from the disputeResolutionService
      setIsLoading(true);
      try {
        // Simulated data - in real implementation, this would be:
        // const disputesData = await disputeResolutionService.getDisputes();
        setTimeout(() => {
          const mockDisputes: Dispute[] = [
            {
              id: "dispute123",
              ticketId: "ticket456",
              userId: "user789",
              counterpartyId: "user012",
              reason: "Funds not received",
              description: "I completed the transaction but never received the funds in my account",
              status: "UnderReview",
              evidence: [
                {
                  id: "ev1",
                  userId: "user789",
                  type: "image",
                  content: "https://example.com/screenshot.jpg",
                  description: "Screenshot of transaction details",
                  submittedAt: { toDate: () => new Date(Date.now() - 24 * 60 * 60 * 1000) } as any
                }
              ],
              comments: [
                {
                  id: "comment1",
                  userId: "user789",
                  role: "buyer",
                  message: "I've been waiting for over 24 hours but the funds still haven't arrived",
                  createdAt: { toDate: () => new Date(Date.now() - 23 * 60 * 60 * 1000) } as any,
                  isPrivate: false
                },
                {
                  id: "comment2",
                  userId: "adminXYZ",
                  role: "admin",
                  message: "We're looking into this issue and have contacted the seller",
                  createdAt: { toDate: () => new Date(Date.now() - 12 * 60 * 60 * 1000) } as any,
                  isPrivate: false
                },
                {
                  id: "comment3",
                  userId: "adminXYZ",
                  role: "admin",
                  message: "Note: User has previous successful transactions with no issues",
                  createdAt: { toDate: () => new Date(Date.now() - 12 * 60 * 60 * 1000) } as any,
                  isPrivate: true
                }
              ],
              timeline: [
                {
                  status: "Open",
                  timestamp: { toDate: () => new Date(Date.now() - 48 * 60 * 60 * 1000) } as any,
                  message: "Dispute created"
                },
                {
                  status: "Evidence",
                  timestamp: { toDate: () => new Date(Date.now() - 36 * 60 * 60 * 1000) } as any,
                  message: "Evidence collection started"
                },
                {
                  status: "UnderReview",
                  timestamp: { toDate: () => new Date(Date.now() - 24 * 60 * 60 * 1000) } as any,
                  message: "Dispute moved to review by admin"
                }
              ],
              createdAt: { toDate: () => new Date(Date.now() - 48 * 60 * 60 * 1000) } as any,
              updatedAt: { toDate: () => new Date(Date.now() - 12 * 60 * 60 * 1000) } as any,
              priority: "high",
              flags: ["high_value"]
            },
            {
              id: "dispute456",
              ticketId: "ticket789",
              userId: "user345",
              counterpartyId: "user678",
              reason: "Product not as described",
              description: "The item I received does not match the description in the listing",
              status: "Resolved",
              evidence: [],
              comments: [],
              timeline: [
                {
                  status: "Open",
                  timestamp: { toDate: () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } as any,
                  message: "Dispute created"
                },
                {
                  status: "Resolved",
                  timestamp: { toDate: () => new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) } as any,
                  message: "Dispute resolved in favor of buyer"
                }
              ],
              createdAt: { toDate: () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } as any,
              updatedAt: { toDate: () => new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) } as any,
              priority: "medium",
              resolution: {
                decision: "buyer",
                reason: "Seller agreed that product was different from listing",
                resolvedBy: "adminXYZ",
                resolvedAt: { toDate: () => new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) } as any
              }
            }
          ];
          
          setDisputes(mockDisputes);
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error("Error fetching disputes:", error);
        toast({
          title: "Error",
          description: "Failed to load disputes",
          variant: "destructive"
        });
        setIsLoading(false);
      }
    };
    
    fetchDisputes();
  }, [toast]);

  // Filter disputes based on search and status
  const filteredDisputes = disputes.filter(dispute => {
    const matchesSearch = 
      searchTerm === "" || 
      dispute.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispute.ticketId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispute.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispute.description.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = 
      filterStatus === "all" || 
      dispute.status.toString().toLowerCase() === filterStatus.toLowerCase();
      
    return matchesSearch && matchesStatus;
  });

  // Open dispute details
  const handleOpenDispute = (dispute: Dispute) => {
    setSelectedDispute(dispute);
  };

  // Open resolution dialog
  const handleOpenResolve = (disputeId: string) => {
    const dispute = disputes.find(d => d.id === disputeId);
    if (dispute) {
      setSelectedDispute(dispute);
      setResolution("");
      setDisputeStatus("Resolved");
      setReviewDialogOpen(true);
    }
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
      // In a real implementation, this would call the service:
      // await disputeResolutionService.resolveDispute(selectedDispute.id, user.uid, {
      //   decision: disputeStatus === "Resolved" ? "buyer" : "rejected",
      //   reason: resolution
      // });
      
      // Update local state for the demo
      setDisputes(disputes.map(d => 
        d.id === selectedDispute.id 
          ? { 
              ...d, 
              status: disputeStatus, 
              resolution: {
                decision: disputeStatus === "Resolved" ? "buyer" : "rejected",
                reason: resolution,
                resolvedBy: "adminXYZ",
                resolvedAt: { toDate: () => new Date() } as any
              }
            }
          : d
      ));
      
      // Show success notification
      toast({
        title: "Success",
        description: `Dispute has been ${disputeStatus.toLowerCase()}`,
      });
      
      // Close dialog and clear selection
      setReviewDialogOpen(false);
      setSelectedDispute(null);
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

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { color: string, icon: JSX.Element } } = {
      "Open": { color: "bg-blue-500", icon: <Clock className="w-3 h-3" /> },
      "Evidence": { color: "bg-yellow-500", icon: <Paperclip className="w-3 h-3" /> },
      "UnderReview": { color: "bg-orange-500", icon: <AlertCircle className="w-3 h-3" /> },
      "Arbitration": { color: "bg-purple-500", icon: <Scale className="w-3 h-3" /> },
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
      {selectedDispute ? (
        <DisputeDetail 
          dispute={selectedDispute}
          onBack={() => setSelectedDispute(null)}
          onResolve={handleOpenResolve}
          currentUserRole={currentUserRole}
        />
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Dispute Management</CardTitle>
              <CardDescription>
                Manage and resolve customer disputes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-grow">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search disputes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select 
                  value={filterStatus} 
                  onValueChange={setFilterStatus}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="evidence">Evidence</SelectItem>
                    <SelectItem value="underreview">Under Review</SelectItem>
                    <SelectItem value="arbitration">Arbitration</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button variant="outline" className="md:w-auto">
                  <Filter className="mr-2 h-4 w-4" /> Advanced Filter
                </Button>
              </div>

              <Tabs defaultValue="active">
                <TabsList className="mb-4">
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="resolved">Resolved</TabsTrigger>
                  <TabsTrigger value="all">All</TabsTrigger>
                </TabsList>

                <div className="rounded-md border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="p-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ID</th>
                          <th className="p-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Ticket</th>
                          <th className="p-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Reason</th>
                          <th className="p-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                          <th className="p-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Created</th>
                          <th className="p-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Priority</th>
                          <th className="p-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {isLoading ? (
                          <tr>
                            <td colSpan={7} className="p-4 text-center">
                              <div className="flex justify-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                              </div>
                              <p className="text-sm mt-2 text-muted-foreground">Loading disputes...</p>
                            </td>
                          </tr>
                        ) : filteredDisputes.length > 0 ? (
                          filteredDisputes.map((dispute) => (
                            <tr key={dispute.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => handleOpenDispute(dispute)}>
                              <td className="p-3 text-sm">
                                {dispute.id.slice(0, 8)}...
                              </td>
                              <td className="p-3 text-sm">
                                {dispute.ticketId.slice(0, 8)}...
                              </td>
                              <td className="p-3 text-sm max-w-[200px] truncate">
                                {dispute.reason}
                              </td>
                              <td className="p-3">
                                {getStatusBadge(dispute.status)}
                              </td>
                              <td className="p-3 text-sm whitespace-nowrap">
                                {dispute.createdAt?.toDate ? formatDistanceToNow(dispute.createdAt.toDate(), { addSuffix: true }) : 'Unknown'}
                              </td>
                              <td className="p-3">
                                <Badge className={`${
                                  dispute.priority === 'high' ? 'bg-red-100 text-red-800 hover:bg-red-200' : 
                                  dispute.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' : 
                                  'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                }`}>
                                  {dispute.priority}
                                </Badge>
                              </td>
                              <td className="p-3 text-right">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenDispute(dispute);
                                  }}
                                >
                                  View
                                </Button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-muted-foreground">
                              {searchTerm || filterStatus !== 'all' ? 
                                "No disputes match your search criteria" : 
                                "No disputes found"}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Tabs>
            </CardContent>
          </Card>

          {/* Resolution Dialog */}
          <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Resolve Dispute</DialogTitle>
                <DialogDescription>
                  Provide a resolution for dispute #{selectedDispute?.id.slice(0, 8)}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Resolution Status</Label>
                  <Select
                    value={disputeStatus}
                    onValueChange={(value: "Resolved" | "Rejected") => setDisputeStatus(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Resolved">Resolved</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
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
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setReviewDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleResolveDispute}
                  disabled={isProcessing || !resolution}
                >
                  {isProcessing ? "Submitting..." : "Submit Resolution"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
