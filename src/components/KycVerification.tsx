'use client';

import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import { useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface KycFormValues {
    fullName: string;
    idNumber: string;
    address: string;
    documentImage: File | null;
}

const initialFormValues: KycFormValues = {
    fullName: '',
    idNumber: '',
    address: '',
    documentImage: null,
};

export default function KycVerification() {
    const [verificationStatus, setVerificationStatus] = useState('Not Verified');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formValues, setFormValues] = useState<KycFormValues>(initialFormValues);
	const [open, setOpen] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormValues(prevValues => ({
            ...prevValues,
            [name]: value,
        }));
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setFormValues(prevValues => ({
            ...prevValues,
            documentImage: file || null,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate the verification process
        setTimeout(() => {
            setVerificationStatus('Pending');
            setTimeout(() => {
                // Simulate success
                setVerificationStatus('Verified');
                setIsSubmitting(false);
                setOpen(false);
                setFormValues(initialFormValues);
            }, 3000); // Simulate the duration of verification process
        }, 1000); // Simulate delay before starting verification
    };

    return (
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
                <CardTitle className="text-lg font-semibold">KYC Verification</CardTitle>
                <CardDescription className="text-gray-500">Verify your identity for enhanced security.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                <p>
                    <strong>Status:</strong> {verificationStatus}
                </p>
                {verificationStatus === 'Not Verified' && (
                    <>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button onClick={() => setOpen(true)}>Verify Identity</Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    Click to verify your identity
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>KYC Verification Form</DialogTitle>
                                    <DialogDescription>
                                        Please fill in the required details for identity verification.
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleSubmit} className="grid gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="fullName">Full Name</Label>
                                        <Input
                                            type="text"
                                            id="fullName"
                                            name="fullName"
                                            value={formValues.fullName}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="idNumber">ID Number</Label>
                                        <Input
                                            type="text"
                                            id="idNumber"
                                            name="idNumber"
                                            value={formValues.idNumber}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="address">Address</Label>
                                        <Input
                                            type="text"
                                            id="address"
                                            name="address"
                                            value={formValues.address}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="documentImage">Upload ID Document</Label>
                                        <Input
                                            type="file"
                                            id="documentImage"
                                            name="documentImage"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            required
                                        />
                                        {formValues.documentImage && (
                                            <p className="text-sm text-muted-foreground">
                                                Selected File: {formValues.documentImage.name}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex justify-end space-x-2">
                                        <DialogClose asChild>
                                            <Button type="button" variant="secondary">
                                                Cancel
                                            </Button>
                                        </DialogClose>
                                        <Button type="submit" disabled={isSubmitting}>
                                            {isSubmitting ? 'Submitting...' : 'Submit'}
                                        </Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </>
                )}
                {verificationStatus === 'Pending' && (
                    <p>Verification in progress...</p>
                )}
                {verificationStatus === 'Verified' && (
                    <p>Your identity has been successfully verified.</p>
                )}
            </CardContent>
        </Card>
    );
}
