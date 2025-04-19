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
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

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

    const renderProgress = () => (
        <div className="mb-6">
            <div className="flex justify-between mb-2">
                <span>Verification Progress</span>
                <span>{Math.round(progress.totalProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${progress.totalProgress}%` }}
                />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
                <div className={`p-3 rounded-lg ${progress.personalInfo ? 'bg-green-50 text-green-700' : 'bg-gray-50'}`}>
                    <span className="flex items-center">
                        {progress.personalInfo ? '✓' : '○'} Personal Information
                    </span>
                </div>
                <div className={`p-3 rounded-lg ${progress.idDocument ? 'bg-green-50 text-green-700' : 'bg-gray-50'}`}>
                    <span className="flex items-center">
                        {progress.idDocument ? '✓' : '○'} ID Document
                    </span>
                </div>
                <div className={`p-3 rounded-lg ${progress.proofOfAddress ? 'bg-green-50 text-green-700' : 'bg-gray-50'}`}>
                    <span className="flex items-center">
                        {progress.proofOfAddress ? '✓' : '○'} Proof of Address
                    </span>
                </div>
                <div className={`p-3 rounded-lg ${progress.bankStatement ? 'bg-green-50 text-green-700' : 'bg-gray-50'}`}>
                    <span className="flex items-center">
                        {progress.bankStatement ? '✓' : '○'} Bank Statement
                    </span>
                </div>
            </div>
        </div>
    );

    const renderVerificationStep = () => {
        switch (kycStatus) {
            case KYCStatus.NONE:
                return (
                    <>
                        {renderProgress()}
                        <form onSubmit={handlePersonalInfoSubmit} className="space-y-4">
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="fullName">Full Name</Label>
                                    <Input
                                        id="fullName"
                                        value={personalInfo.fullName}
                                        onChange={(e) => setPersonalInfo({ ...personalInfo, fullName: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="idNumber">ID Number</Label>
                                    <Input
                                        id="idNumber"
                                        value={personalInfo.idNumber}
                                        onChange={(e) => setPersonalInfo({ ...personalInfo, idNumber: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                                    <Input
                                        id="dateOfBirth"
                                        type="date"
                                        value={personalInfo.dateOfBirth}
                                        onChange={(e) => setPersonalInfo({ ...personalInfo, dateOfBirth: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="nationality">Nationality</Label>
                                    <Input
                                        id="nationality"
                                        value={personalInfo.nationality}
                                        onChange={(e) => setPersonalInfo({ ...personalInfo, nationality: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="residentialAddress">Residential Address</Label>
                                    <Input
                                        id="residentialAddress"
                                        value={personalInfo.residentialAddress}
                                        onChange={(e) => setPersonalInfo({ ...personalInfo, residentialAddress: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="phoneNumber">Phone Number</Label>
                                    <Input
                                        id="phoneNumber"
                                        value={personalInfo.phoneNumber}
                                        onChange={(e) => setPersonalInfo({ ...personalInfo, phoneNumber: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <Button type="submit" disabled={loading}>
                                {loading ? "Submitting..." : "Submit Personal Information"}
                            </Button>
                        </form>
                    </>
                );

            case KYCStatus.BASIC:
                return (
                    <>
                        {renderProgress()}
                        <div className="space-y-4">
                            <div className="grid gap-4">
                                <div>
                                    <h3 className="text-lg font-semibold">Document Verification</h3>
                                    <p className="text-sm text-gray-500">Please upload the following documents:</p>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="idDocument">ID Document</Label>
                                    <Input
                                        id="idDocument"
                                        type="file"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleDocumentUpload("id", file);
                                        }}
                                        accept="image/*,.pdf"
                                        disabled={loading}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="proofOfAddress">Proof of Address</Label>
                                    <Input
                                        id="proofOfAddress"
                                        type="file"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleDocumentUpload("address", file);
                                        }}
                                        accept="image/*,.pdf"
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                        </div>
                    </>
                );

            case KYCStatus.INTERMEDIATE:
            case KYCStatus.ADVANCED:
                return (
                    <>
                        {renderProgress()}
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold">Document Status</h3>
                                <div className="mt-4 space-y-4">
                                    {documents.map((doc, index) => (
                                        <div key={index} className="border rounded-lg p-4">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <h4 className="font-medium capitalize">{doc.type} Document</h4>
                                                    <p className="text-sm text-gray-500">
                                                        Submitted: {doc.submissionDate.toLocaleDateString()}
                                                    </p>
                                                    {doc.expiryDate && (
                                                        <p className={`text-sm ${
                                                            new Date(doc.expiryDate) <= new Date()
                                                                ? 'text-red-500'
                                                                : new Date(doc.expiryDate).getTime() - new Date().getTime() <= 30 * 24 * 60 * 60 * 1000
                                                                ? 'text-yellow-500'
                                                                : 'text-gray-500'
                                                        }`}>
                                                            Expires: {new Date(doc.expiryDate).toLocaleDateString()}
                                                        </p>
                                                    )}
                                                </div>
                                                <Badge
                                                    variant={
                                                        doc.status === 'verified'
                                                            ? 'success'
                                                            : doc.status === 'rejected'
                                                            ? 'destructive'
                                                            : 'default'
                                                    }
                                                >
                                                    {doc.status}
                                                </Badge>
                                            </div>
                                            {doc.rejectionReason && (
                                                <p className="mt-2 text-sm text-red-500">
                                                    Reason: {doc.rejectionReason}
                                                </p>
                                            )}
                                            {doc.status === 'rejected' && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="mt-2"
                                                    onClick={() => handleReupload(doc.type)}
                                                >
                                                    Upload New Document
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                );

            case KYCStatus.VERIFIED:
                return (
                    <div className="space-y-4">
                        <div className="bg-green-50 p-4 rounded-md">
                            <h3 className="text-lg font-semibold text-green-800">Verification Complete</h3>
                            <p className="text-sm text-green-600">
                                Your account is fully verified. You can now access all platform features.
                            </p>
                        </div>
                    </div>
                );

            case KYCStatus.REJECTED:
                return (
                    <div className="space-y-4">
                        <div className="bg-red-50 p-4 rounded-md">
                            <h3 className="text-lg font-semibold text-red-800">Verification Failed</h3>
                            <p className="text-sm text-red-600">
                                Your verification was not successful. Please contact support for more information.
                            </p>
                        </div>
                    </div>
                );
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>KYC Verification</CardTitle>
                <CardDescription>
                    Complete your identity verification to access all platform features
                </CardDescription>
            </CardHeader>
            <CardContent>
                {renderVerificationStep()}
            </CardContent>
        </Card>
    );
}
