'use client';

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Upload, 
  Shield, 
  FileText, 
  Camera,
  MapPin,
  CreditCard
} from "lucide-react";
import { enhancedKycService, KycDocument, KycVerification } from "@/lib/kyc-service-enhanced";

const documentTypes = [
  {
    type: 'id_document' as const,
    title: 'Government ID',
    description: 'Upload your passport, driver\'s license, or national ID',
    icon: <FileText className="h-5 w-5" />,
    required: true
  },
  {
    type: 'proof_of_address' as const,
    title: 'Proof of Address',
    description: 'Upload a utility bill or bank statement (less than 3 months old)',
    icon: <MapPin className="h-5 w-5" />,
    required: true
  },
  {
    type: 'selfie' as const,
    title: 'Selfie Verification',
    description: 'Take a clear selfie holding your ID document',
    icon: <Camera className="h-5 w-5" />,
    required: true
  },
  {
    type: 'bank_statement' as const,
    title: 'Bank Statement',
    description: 'Upload recent bank statement for financial verification',
    icon: <CreditCard className="h-5 w-5" />,
    required: false
  }
];

export default function EnhancedKycVerification() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [verification, setVerification] = useState<KycVerification | null>(null);
  const [documents, setDocuments] = useState<KycDocument[]>([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<KycDocument['type'] | null>(null);

  const loadKycData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Load verification status
      let verificationData = await enhancedKycService.getVerificationStatus(user.uid);
      
      // Initialize KYC if not exists
      if (!verificationData) {
        verificationData = await enhancedKycService.initializeKyc(user.uid);
      }
      
      setVerification(verificationData);

      // Load documents
      const userDocs = await enhancedKycService.getUserDocuments(user.uid);
      setDocuments(userDocs);

    } catch (error) {
      console.error('Error loading KYC data:', error);
      toast({
        title: "Error",
        description: "Failed to load verification data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    loadKycData();
  }, [loadKycData]);

  const handleFileUpload = async (file: File, documentType: KycDocument['type']) => {
    if (!user || !file) return;

    // Validate file
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB",
        variant: "destructive"
      });
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload JPG, PNG, or PDF files only",
        variant: "destructive"
      });
      return;
    }

    setUploadingDoc(documentType);
    try {
      await enhancedKycService.uploadDocument(user.uid, file, documentType);
      
      toast({
        title: "Document uploaded successfully",
        description: "Your document has been submitted for verification",
      });

      // Reload data
      await loadKycData();
      setUploadDialogOpen(false);
      setSelectedDocType(null);

    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload document. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploadingDoc(null);
    }
  };

  const getStatusIcon = (status: KycDocument['status']) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: KycDocument['status']) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const calculateProgress = () => {
    const requiredDocs = documentTypes.filter(doc => doc.required);
    const completedDocs = requiredDocs.filter(doc => 
      documents.some(d => d.type === doc.type && d.status === 'approved')
    );
    return (completedDocs.length / requiredDocs.length) * 100;
  };

  const getOverallStatus = () => {
    if (!verification) return 'incomplete';
    return verification.status;
  };

  const getStatusMessage = () => {
    const status = getOverallStatus();
    switch (status) {
      case 'approved':
        return 'Your identity has been verified. You have full access to all features.';
      case 'rejected':
        return 'Some documents were rejected. Please review and resubmit.';
      case 'pending_review':
        return 'Your documents are being reviewed. This usually takes 1-2 business days.';
      default:
        return 'Complete your identity verification to unlock all features.';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#193281]"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-[#193281]" />
                Identity Verification
              </CardTitle>
              <CardDescription>
                {getStatusMessage()}
              </CardDescription>
            </div>
            <Badge className={getStatusColor(getOverallStatus() as any)}>
              {getOverallStatus().replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progress</span>
                <span className="text-sm text-gray-500">{Math.round(calculateProgress())}%</span>
              </div>
              <Progress value={calculateProgress()} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Upload Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {documentTypes.map((docType) => {
          const uploadedDoc = documents.find(d => d.type === docType.type);
          const isUploaded = !!uploadedDoc;

          return (
            <motion.div
              key={docType.type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className={`relative ${isUploaded ? 'border-green-200' : 'border-gray-200'}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {docType.icon}
                    {docType.title}
                    {docType.required && (
                      <Badge variant="outline" className="text-xs">Required</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {docType.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    {isUploaded ? (
                      <div className="flex items-center gap-2">
                        {getStatusIcon(uploadedDoc.status)}
                        <span className="text-sm font-medium">
                          {uploadedDoc.status.charAt(0).toUpperCase() + uploadedDoc.status.slice(1)}
                        </span>
                        {uploadedDoc.verificationNotes && (
                          <span className="text-xs text-gray-500">
                            - {uploadedDoc.verificationNotes}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">Not uploaded</span>
                    )}
                    
                    <Dialog open={uploadDialogOpen && selectedDocType === docType.type} 
                            onOpenChange={(open) => {
                              setUploadDialogOpen(open);
                              if (!open) setSelectedDocType(null);
                            }}>
                      <DialogTrigger asChild>
                        <Button
                          variant={isUploaded ? "outline" : "default"}
                          size="sm"
                          onClick={() => setSelectedDocType(docType.type)}
                          disabled={uploadingDoc === docType.type}
                        >
                          {uploadingDoc === docType.type ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-1" />
                              {isUploaded ? 'Replace' : 'Upload'}
                            </>
                          )}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Upload {docType.title}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <p className="text-sm text-gray-600">
                            {docType.description}
                          </p>
                          <div>
                            <Label htmlFor={`file-${docType.type}`}>Choose file</Label>
                            <Input
                              id={`file-${docType.type}`}
                              type="file"
                              accept="image/*,.pdf"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file && selectedDocType) {
                                  handleFileUpload(file, selectedDocType);
                                }
                              }}
                              className="mt-1"
                            />
                          </div>
                          <div className="text-xs text-gray-500">
                            Supported formats: JPG, PNG, PDF (max 10MB)
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Need Help?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• Ensure all documents are clear and legible</p>
            <p>• Documents should be in color, not black and white</p>
            <p>• Make sure all four corners of the document are visible</p>
            <p>• Verification typically takes 1-2 business days</p>
            <p>• Contact support if you need assistance: support@coinboxai.com</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
