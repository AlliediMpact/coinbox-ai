'use client';

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, getStorage } from "firebase/storage";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, Clock, Upload, Shield } from "lucide-react";
import { colors, animations } from "@/styles/designTokens";

export enum KYCStatus {
    NONE = "none",
    BASIC = "basic",
    INTERMEDIATE = "intermediate",
    ADVANCED = "advanced",
    VERIFIED = "verified",
    REJECTED = "rejected"
}

interface KYCDocument {
    type: string;
    status: "pending" | "verified" | "rejected";
    submissionDate: Date;
    verificationDate?: Date;
    expiryDate?: Date;
    fileUrl: string;
    rejectionReason?: string;
}

interface KYCProgress {
    personalInfo: boolean;
    idDocument: boolean;
    proofOfAddress: boolean;
    bankStatement: boolean;
    totalProgress: number;
}

export default function KycVerification() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [kycStatus, setKycStatus] = useState<KYCStatus>(KYCStatus.NONE);
    const [documents, setDocuments] = useState<KYCDocument[]>([]);
    const [progress, setProgress] = useState<KYCProgress>({
        personalInfo: false,
        idDocument: false,
        proofOfAddress: false,
        bankStatement: false,
        totalProgress: 0
    });
    const db = getFirestore();
    const storage = getStorage();

    // Form states
    const [personalInfo, setPersonalInfo] = useState({
        fullName: "",
        idNumber: "",
        dateOfBirth: "",
        nationality: "",
        residentialAddress: "",
        phoneNumber: "",
    });

    useEffect(() => {
        if (user) {
            loadKYCStatus();
        }
    }, [user]);

    const loadKYCStatus = async () => {
        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                setKycStatus(userData.kycStatus || KYCStatus.NONE);
                setDocuments(userData.kycDocuments || []);
                if (userData.personalInfo) {
                    setPersonalInfo(userData.personalInfo);
                }
            }
        } catch (error) {
            console.error("Error loading KYC status:", error);
        }
    };

    const handlePersonalInfoSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await updateDoc(doc(db, "users", user.uid), {
                personalInfo,
                kycStatus: KYCStatus.BASIC,
                updatedAt: new Date()
            });

            setKycStatus(KYCStatus.BASIC);
            toast({
                title: "Personal Information Updated",
                description: "Your information has been saved successfully.",
            });
        } catch (error: any) {
            toast({
                title: "Update Failed",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const calculateProgress = useCallback(() => {
        const steps = {
            personalInfo: !!personalInfo.fullName && !!personalInfo.idNumber,
            idDocument: documents.some(d => d.type === 'id'),
            proofOfAddress: documents.some(d => d.type === 'address'),
            bankStatement: documents.some(d => d.type === 'bank')
        };
        
        const completedSteps = Object.values(steps).filter(Boolean).length;
        const totalProgress = (completedSteps / Object.keys(steps).length) * 100;

        setProgress({
            ...steps,
            totalProgress
        });
    }, [documents, personalInfo]);

    useEffect(() => {
        calculateProgress();
    }, [documents, personalInfo, calculateProgress]);

    const handleDocumentUpload = async (type: string, file: File) => {
        setLoading(true);
        try {
            // Calculate document expiry date (1 year from submission for most documents)
            const expiryDate = new Date();
            expiryDate.setFullYear(expiryDate.getFullYear() + 1);

            // Here you would typically:
            // 1. Upload the file to Firebase Storage
            const storageRef = ref(storage, `kyc-documents/${user.uid}/${type}/${file.name}`);
            await uploadBytes(storageRef, file);
            const fileUrl = await getDownloadURL(storageRef);

            const newDocument: KYCDocument = {
                type,
                status: "pending",
                submissionDate: new Date(),
                expiryDate,
                fileUrl
            };

            const updatedDocuments = [...documents, newDocument];
            
            await updateDoc(doc(db, "users", user.uid), {
                kycDocuments: updatedDocuments,
                kycStatus: KYCStatus.INTERMEDIATE,
                updatedAt: new Date()
            });

            setDocuments(updatedDocuments);
            setKycStatus(KYCStatus.INTERMEDIATE);
            calculateProgress();

            toast({
                title: "Document Uploaded",
                description: "Your document has been uploaded and is pending verification.",
            });
        } catch (error: any) {
            toast({
                title: "Upload Failed",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const checkDocumentExpiry = useCallback(() => {
        const now = new Date();
        documents.forEach(doc => {
            if (doc.expiryDate && new Date(doc.expiryDate) <= now) {
                toast({
                    title: "Document Expired",
                    description: `Your ${doc.type} document has expired. Please upload a new one.`,
                    variant: "destructive",
                });
            } else if (doc.expiryDate && 
                      new Date(doc.expiryDate).getTime() - now.getTime() <= 30 * 24 * 60 * 60 * 1000) {
                toast({
                    title: "Document Expiring Soon",
                    description: `Your ${doc.type} document will expire in ${Math.ceil((new Date(doc.expiryDate).getTime() - now.getTime()) / (24 * 60 * 60 * 1000))} days.`,
                });
            }
        });
    }, [documents, toast]);

    useEffect(() => {
        checkDocumentExpiry();
        // Check document expiry every 24 hours
        const interval = setInterval(checkDocumentExpiry, 24 * 60 * 60 * 1000);
        return () => clearInterval(interval);
    }, [checkDocumentExpiry]);
    
    const handleReupload = (type: string) => {
        // Create a hidden input element
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,.pdf';
        input.style.display = 'none';
        
        // Handle file selection
        input.onchange = (e: any) => {
            const file = e.target.files?.[0];
            if (file) {
                handleDocumentUpload(type, file);
            }
        };
        
        // Trigger file selection dialog
        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);
    };

    const renderProgress = () => (
        <motion.div 
            className="mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="flex justify-between mb-2">
                <span className="font-medium">Verification Progress</span>
                <motion.span 
                    key={`progress-${Math.round(progress.totalProgress)}`}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                    className="font-bold"
                    style={{ color: progress.totalProgress >= 75 ? colors.status.success : colors.primary.purple }}
                >
                    {Math.round(progress.totalProgress)}%
                </motion.span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <motion.div
                    className="h-2.5 rounded-full"
                    style={{ 
                        background: progress.totalProgress >= 75 
                            ? colors.status.success 
                            : `linear-gradient(90deg, ${colors.primary.blue} 0%, ${colors.primary.purple} 100%)` 
                    }}
                    initial={{ width: "0%" }}
                    animate={{ width: `${progress.totalProgress}%` }}
                    transition={{ 
                        duration: 0.8,
                        ease: animations.easings.spring
                    }}
                />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
                <motion.div 
                    className={`p-3 rounded-lg border flex items-center ${
                        progress.personalInfo ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                    {progress.personalInfo ? (
                        <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    ) : (
                        <Clock className="h-4 w-4 mr-2 text-gray-400" />
                    )}
                    <span className={progress.personalInfo ? 'text-green-700' : 'text-gray-600'}>
                        Personal Info
                    </span>
                </motion.div>
                <motion.div 
                    className={`p-3 rounded-lg border flex items-center ${
                        progress.idDocument ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                    {progress.idDocument ? (
                        <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    ) : (
                        <Clock className="h-4 w-4 mr-2 text-gray-400" />
                    )}
                    <span className={progress.idDocument ? 'text-green-700' : 'text-gray-600'}>
                        ID Document
                    </span>
                </motion.div>
                <motion.div 
                    className={`p-3 rounded-lg border flex items-center ${
                        progress.proofOfAddress ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                    {progress.proofOfAddress ? (
                        <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    ) : (
                        <Clock className="h-4 w-4 mr-2 text-gray-400" />
                    )}
                    <span className={progress.proofOfAddress ? 'text-green-700' : 'text-gray-600'}>
                        Proof of Address
                    </span>
                </motion.div>
                <motion.div 
                    className={`p-3 rounded-lg border flex items-center ${
                        progress.bankStatement ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                    {progress.bankStatement ? (
                        <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    ) : (
                        <Clock className="h-4 w-4 mr-2 text-gray-400" />
                    )}
                    <span className={progress.bankStatement ? 'text-green-700' : 'text-gray-600'}>
                        Bank Statement
                    </span>
                </motion.div>
            </div>
        </motion.div>
    );

    const renderVerificationStep = () => {
        switch (kycStatus) {
            case KYCStatus.NONE:
                return (
                    <>
                        {renderProgress()}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <h3 className="text-sm font-medium text-blue-800 flex items-center">
                                    <AlertCircle className="h-4 w-4 mr-2" />
                                    Step 1: Personal Information
                                </h3>
                                <p className="text-xs text-blue-600 mt-1">
                                    Please provide your personal details for identity verification
                                </p>
                            </div>
                        </motion.div>
                        
                        <form onSubmit={handlePersonalInfoSubmit} className="space-y-4">
                            <motion.div 
                                className="grid gap-4 sm:grid-cols-2"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <motion.div 
                                    className="grid gap-2"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    <Label htmlFor="fullName" className="font-medium">Full Name</Label>
                                    <Input
                                        id="fullName"
                                        value={personalInfo.fullName}
                                        onChange={(e) => setPersonalInfo({ ...personalInfo, fullName: e.target.value })}
                                        required
                                        className="border-gray-300 focus:ring-primary-purple focus:border-primary-purple"
                                        placeholder="John Doe"
                                    />
                                </motion.div>
                                
                                <motion.div 
                                    className="grid gap-2"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.45 }}
                                >
                                    <Label htmlFor="idNumber" className="font-medium">ID Number</Label>
                                    <Input
                                        id="idNumber"
                                        value={personalInfo.idNumber}
                                        onChange={(e) => setPersonalInfo({ ...personalInfo, idNumber: e.target.value })}
                                        required
                                        className="border-gray-300"
                                        placeholder="ID12345678"
                                    />
                                </motion.div>
                                
                                <motion.div 
                                    className="grid gap-2"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.5 }}
                                >
                                    <Label htmlFor="dateOfBirth" className="font-medium">Date of Birth</Label>
                                    <Input
                                        id="dateOfBirth"
                                        type="date"
                                        value={personalInfo.dateOfBirth}
                                        onChange={(e) => setPersonalInfo({ ...personalInfo, dateOfBirth: e.target.value })}
                                        required
                                        className="border-gray-300"
                                    />
                                </motion.div>
                                
                                <motion.div 
                                    className="grid gap-2"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.55 }}
                                >
                                    <Label htmlFor="nationality" className="font-medium">Nationality</Label>
                                    <Input
                                        id="nationality"
                                        value={personalInfo.nationality}
                                        onChange={(e) => setPersonalInfo({ ...personalInfo, nationality: e.target.value })}
                                        required
                                        className="border-gray-300"
                                        placeholder="South African"
                                    />
                                </motion.div>
                                
                                <motion.div 
                                    className="grid gap-2 sm:col-span-2"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.6 }}
                                >
                                    <Label htmlFor="residentialAddress" className="font-medium">Residential Address</Label>
                                    <Input
                                        id="residentialAddress"
                                        value={personalInfo.residentialAddress}
                                        onChange={(e) => setPersonalInfo({ ...personalInfo, residentialAddress: e.target.value })}
                                        required
                                        className="border-gray-300"
                                        placeholder="123 Main Street, City"
                                    />
                                </motion.div>
                                
                                <motion.div 
                                    className="grid gap-2 sm:col-span-2"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.65 }}
                                >
                                    <Label htmlFor="phoneNumber" className="font-medium">Phone Number</Label>
                                    <Input
                                        id="phoneNumber"
                                        value={personalInfo.phoneNumber}
                                        onChange={(e) => setPersonalInfo({ ...personalInfo, phoneNumber: e.target.value })}
                                        required
                                        className="border-gray-300"
                                        placeholder="+27 12 345 6789"
                                    />
                                </motion.div>
                            </motion.div>
                            
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7 }}
                                className="pt-2"
                            >
                                <Button 
                                    type="submit" 
                                    disabled={loading}
                                    className="w-full sm:w-auto"
                                >
                                    {loading ? (
                                        <motion.div
                                            className="flex items-center"
                                            animate={{ opacity: [0.6, 1, 0.6] }}
                                            transition={{ duration: 1.5, repeat: Infinity }}
                                        >
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Submitting...
                                        </motion.div>
                                    ) : (
                                        <span className="flex items-center">
                                            Continue to Document Verification
                                            <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </span>
                                    )}
                                </Button>
                            </motion.div>
                        </form>
                    </>
                );

            case KYCStatus.BASIC:
                return (
                    <>
                        {renderProgress()}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <h3 className="text-sm font-medium text-blue-800 flex items-center">
                                    <Upload className="h-4 w-4 mr-2" />
                                    Step 2: Document Verification
                                </h3>
                                <p className="text-xs text-blue-600 mt-1">
                                    Upload your identification documents to verify your identity
                                </p>
                            </div>
                        </motion.div>
                        
                        <div className="space-y-6">
                            <motion.div 
                                className="grid gap-6 sm:grid-cols-2"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <motion.div 
                                    className="border rounded-lg p-4 hover:shadow-md transition-shadow relative overflow-hidden"
                                    whileHover={{ 
                                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                                    }}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{
                                        duration: 0.5,
                                        ease: animations.easings.easeInOut,
                                        delay: 0.4
                                    }}
                                >
                                    {loading && (
                                        <motion.div 
                                            className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                        >
                                            <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        </motion.div>
                                    )}
                                    
                                    <div className="text-center p-2">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <svg className="h-8 w-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                                            </svg>
                                        </div>
                                        
                                        <h3 className="font-medium text-gray-900">ID Document</h3>
                                        <p className="text-xs text-gray-500 mb-4">
                                            National ID, Passport, or Driver&apos;s License
                                        </p>
                                        
                                        <div className="mt-2">
                                            <Label
                                                htmlFor="idDocument"
                                                className="cursor-pointer inline-flex items-center justify-center text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary hover:bg-primary/90 text-white rounded-md px-4 py-2"
                                            >
                                                <Upload className="mr-2 h-4 w-4" />
                                                Select File
                                            </Label>
                                            <Input
                                                id="idDocument"
                                                type="file"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) handleDocumentUpload("id", file);
                                                }}
                                                accept="image/*,.pdf"
                                                disabled={loading}
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                                
                                <motion.div 
                                    className="border rounded-lg p-4 hover:shadow-md transition-shadow relative overflow-hidden"
                                    whileHover={{ 
                                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                                    }}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{
                                        duration: 0.5,
                                        ease: animations.easings.easeInOut,
                                        delay: 0.5
                                    }}
                                >
                                    {loading && (
                                        <motion.div 
                                            className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                        >
                                            <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        </motion.div>
                                    )}
                                    
                                    <div className="text-center p-2">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <svg className="h-8 w-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                            </svg>
                                        </div>
                                        
                                        <h3 className="font-medium text-gray-900">Proof of Address</h3>
                                        <p className="text-xs text-gray-500 mb-4">
                                            Utility Bill, Bank Statement, or Rental Agreement
                                        </p>
                                        
                                        <div className="mt-2">
                                            <Label
                                                htmlFor="proofOfAddress"
                                                className="cursor-pointer inline-flex items-center justify-center text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary hover:bg-primary/90 text-white rounded-md px-4 py-2"
                                            >
                                                <Upload className="mr-2 h-4 w-4" />
                                                Select File
                                            </Label>
                                            <Input
                                                id="proofOfAddress"
                                                type="file"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) handleDocumentUpload("address", file);
                                                }}
                                                accept="image/*,.pdf"
                                                disabled={loading}
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            </motion.div>
                            
                            <motion.div
                                className="border-t pt-4 mt-4"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 }}
                            >
                                <p className="text-sm text-gray-600">
                                    <AlertCircle className="inline h-4 w-4 mr-1 text-amber-500" />
                                    Make sure your documents are clear, current, and show all corners. We accept JPG, PNG, and PDF formats.
                                </p>
                            </motion.div>
                        </div>
                    </>
                );

            case KYCStatus.INTERMEDIATE:
            case KYCStatus.ADVANCED:
                return (
                    <>
                        {renderProgress()}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <h3 className="text-sm font-medium text-blue-800 flex items-center">
                                    <Clock className="h-4 w-4 mr-2" />
                                    Step 3: Verification in Progress
                                </h3>
                                <p className="text-xs text-blue-600 mt-1">
                                    Your documents have been submitted and are being reviewed
                                </p>
                            </div>
                        </motion.div>
                        
                        <div className="space-y-4">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <h3 className="text-lg font-semibold flex items-center">
                                    <svg className="mr-2 h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Document Status
                                </h3>
                                
                                <div className="mt-4 space-y-4">
                                    {documents.map((doc, index) => (
                                        <motion.div 
                                            key={index} 
                                            className={`border rounded-lg p-4 transition-all ${
                                                doc.status === 'verified' 
                                                    ? 'border-green-200 bg-green-50' 
                                                    : doc.status === 'rejected'
                                                    ? 'border-red-200 bg-red-50'
                                                    : 'border-gray-200 hover:border-blue-200'
                                            }`}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3 + (index * 0.15) }}
                                            whileHover={{ 
                                                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
                                            }}
                                        >
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <h4 className="font-medium capitalize flex items-center">
                                                        {doc.type === 'id' && (
                                                            <svg className="mr-2 h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                                                            </svg>
                                                        )}
                                                        {doc.type === 'address' && (
                                                            <svg className="mr-2 h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                                            </svg>
                                                        )}
                                                        {doc.type === 'bank' && (
                                                            <svg className="mr-2 h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                                                            </svg>
                                                        )}
                                                        {doc.type} Document
                                                    </h4>
                                                    
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        <span className="inline-flex items-center text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                                            <svg className="mr-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                            Submitted: {doc.submissionDate.toLocaleDateString()}
                                                        </span>
                                                        
                                                        {doc.expiryDate && (
                                                            <span className={`inline-flex items-center text-xs px-2 py-1 rounded-full ${
                                                                new Date(doc.expiryDate) <= new Date()
                                                                    ? 'bg-red-100 text-red-500'
                                                                    : new Date(doc.expiryDate).getTime() - new Date().getTime() <= 30 * 24 * 60 * 60 * 1000
                                                                    ? 'bg-yellow-100 text-yellow-600'
                                                                    : 'bg-gray-100 text-gray-500'
                                                            }`}>
                                                                <svg className="mr-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                                Expires: {new Date(doc.expiryDate).toLocaleDateString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                <motion.div
                                                    initial={{ scale: 0.8 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ delay: 0.5 + (index * 0.1) }}
                                                >
                                                    <Badge
                                                        variant={
                                                            doc.status === 'verified'
                                                                ? 'success'
                                                                : doc.status === 'rejected'
                                                                ? 'destructive'
                                                                : 'default'
                                                        }
                                                        className="ml-2 capitalize"
                                                    >
                                                        {doc.status === 'verified' && <CheckCircle className="h-3 w-3 mr-1" />}
                                                        {doc.status === 'rejected' && <AlertCircle className="h-3 w-3 mr-1" />}
                                                        {doc.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                                                        {doc.status}
                                                    </Badge>
                                                </motion.div>
                                            </div>
                                            
                                            <AnimatePresence>
                                                {doc.rejectionReason && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        className="mt-3 p-2 bg-red-50 border border-red-100 rounded-md"
                                                    >
                                                        <p className="text-sm text-red-600 flex items-start">
                                                            <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                                                            <span>{doc.rejectionReason}</span>
                                                        </p>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                            
                                            {doc.status === 'rejected' && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.2 }}
                                                    className="mt-3"
                                                >
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="bg-white hover:bg-gray-50"
                                                        onClick={() => handleReupload(doc.type)}
                                                    >
                                                        <Upload className="h-4 w-4 mr-1" />
                                                        Upload New Document
                                                    </Button>
                                                </motion.div>
                                            )}
                                            
                                            {/* Preview thumbnail - in a real app would show actual document thumbnail */}
                                            {doc.fileUrl && (
                                                <motion.div 
                                                    className="mt-3 inline-block"
                                                    whileHover={{ scale: 1.05 }}
                                                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                                >
                                                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800">
                                                        <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                        View document
                                                    </a>
                                                </motion.div>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                            
                            {kycStatus === KYCStatus.INTERMEDIATE && documents.length < 3 && (
                                <motion.div 
                                    className="mt-6 text-center"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.6 }}
                                >
                                    <p className="text-sm text-gray-600 mb-3">
                                        To achieve full verification, please upload all required documents.
                                    </p>
                                    <Button
                                        onClick={() => setKycStatus(KYCStatus.BASIC)}
                                        variant="outline"
                                    >
                                        <Upload className="mr-2 h-4 w-4" />
                                        Upload Additional Documents
                                    </Button>
                                </motion.div>
                            )}
                        </div>
                    </>
                );

            case KYCStatus.VERIFIED:
                return (
                    <motion.div 
                        className="space-y-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <motion.div 
                            className="bg-green-50 border border-green-100 p-6 rounded-lg shadow-sm"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
                        >
                            <div className="flex items-center">
                                <div className="mr-4 flex-shrink-0">
                                    <motion.div
                                        className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center"
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                                    >
                                        <CheckCircle className="h-6 w-6 text-green-600" />
                                    </motion.div>
                                </div>
                                <div>
                                    <motion.h3 
                                        className="text-lg font-semibold text-green-800"
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.5 }}
                                    >
                                        Verification Complete
                                    </motion.h3>
                                    <motion.p 
                                        className="text-sm text-green-600 mt-1"
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.6 }}
                                    >
                                        Your account is fully verified. You can now access all platform features.
                                    </motion.p>
                                </div>
                            </div>
                            
                            <motion.div 
                                className="mt-4 border-t border-green-100 pt-4"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.7 }}
                            >
                                <h4 className="text-sm font-medium text-green-800 mb-2">Benefits of full verification:</h4>
                                <ul className="space-y-2">
                                    {[
                                        "Increased transaction limits",
                                        "Access to exclusive investment opportunities",
                                        "Faster processing times for withdrawals",
                                        "Lower transaction fees"
                                    ].map((benefit, index) => (
                                        <motion.li 
                                            key={index}
                                            className="flex items-center text-sm text-green-600"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.8 + (index * 0.1) }}
                                        >
                                            <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                                            {benefit}
                                        </motion.li>
                                    ))}
                                </ul>
                            </motion.div>
                            
                            <motion.div 
                                className="mt-4"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.2 }}
                            >
                                <Button className="w-full sm:w-auto">
                                    Continue to Dashboard
                                    <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </Button>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                );

            case KYCStatus.REJECTED:
                return (
                    <motion.div 
                        className="space-y-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <motion.div 
                            className="bg-red-50 border border-red-100 p-6 rounded-lg shadow-sm"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
                        >
                            <div className="flex items-center">
                                <div className="mr-4 flex-shrink-0">
                                    <motion.div
                                        className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                                    >
                                        <AlertCircle className="h-6 w-6 text-red-600" />
                                    </motion.div>
                                </div>
                                <div>
                                    <motion.h3 
                                        className="text-lg font-semibold text-red-800"
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.5 }}
                                    >
                                        Verification Failed
                                    </motion.h3>
                                    <motion.p 
                                        className="text-sm text-red-600 mt-1"
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.6 }}
                                    >
                                        Your verification was not successful. Please contact support or try again.
                                    </motion.p>
                                </div>
                            </div>
                            
                            <motion.div 
                                className="mt-4 border-t border-red-100 pt-4 space-y-3"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.7 }}
                            >
                                <h4 className="text-sm font-medium text-red-800">Common reasons for verification failure:</h4>
                                <ul className="space-y-2">
                                    {[
                                        "Documents provided were unclear or incomplete",
                                        "Information mismatch between documents and personal details",
                                        "Expired identification documents",
                                        "Failed security or fraud checks"
                                    ].map((reason, index) => (
                                        <motion.li 
                                            key={index}
                                            className="flex items-start text-sm text-red-600"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.8 + (index * 0.1) }}
                                        >
                                            <span className="mr-2 mt-1">•</span>
                                            {reason}
                                        </motion.li>
                                    ))}
                                </ul>
                            </motion.div>
                            
                            <motion.div 
                                className="mt-6 flex flex-col sm:flex-row gap-3"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.2 }}
                            >
                                <Button 
                                    variant="default"
                                    className="flex-1"
                                    onClick={() => setKycStatus(KYCStatus.NONE)}
                                >
                                    Try Again
                                </Button>
                                <Button 
                                    variant="outline"
                                    className="flex-1"
                                >
                                    Contact Support
                                </Button>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                );
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <Card className="border-t-4" style={{ borderTopColor: colors.primary.purple }}>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center">
                                <Shield className="mr-2 h-5 w-5 text-primary" />
                                <span
                                    className="bg-clip-text text-transparent"
                                    style={{ backgroundImage: `linear-gradient(90deg, ${colors.primary.blue} 0%, ${colors.primary.purple} 100%)` }}
                                >
                                    KYC Verification
                                </span>
                            </CardTitle>
                            <CardDescription>
                                Complete your identity verification to access all platform features
                            </CardDescription>
                        </div>
                        {kycStatus !== KYCStatus.NONE && (
                            <motion.div 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 500, damping: 15 }}
                            >
                                <Badge
                                    variant={
                                        kycStatus === KYCStatus.VERIFIED
                                            ? 'success'
                                            : kycStatus === KYCStatus.REJECTED
                                            ? 'destructive'
                                            : 'default'
                                    }
                                    className="ml-2"
                                >
                                    {kycStatus.toUpperCase()}
                                </Badge>
                            </motion.div>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={kycStatus}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                        >
                            {renderVerificationStep()}
                        </motion.div>
                    </AnimatePresence>
                </CardContent>
            </Card>
        </motion.div>
    );
}
