'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { doc, getDoc, getFirestore } from 'firebase/firestore';

interface UserProfileData {
    fullName: string;
    phone: string;
    email: string;
    membershipTier: string;
    address?: string;
    city?: string;
    country?: string;
    postalCode?: string;
    dateOfBirth?: string;
    idNumber?: string;
}

export default function ProfilePage() {
    const { user, updateUserProfile } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [profileData, setProfileData] = useState<UserProfileData>({
        fullName: '',
        phone: '',
        email: '',
        membershipTier: '',
        address: '',
        city: '',
        country: '',
        postalCode: '',
        dateOfBirth: '',
        idNumber: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isNewUser, setIsNewUser] = useState(false);

    useEffect(() => {
        const checkProfileCompletion = async () => {
            if (!user) {
                router.push('/auth');
                return;
            }

            const db = getFirestore();
            const userDoc = await getDoc(doc(db, "users", user.uid));
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                setProfileData({
                    fullName: userData.fullName || '',
                    phone: userData.phone || '',
                    email: userData.email || '',
                    membershipTier: userData.membershipTier || '',
                    address: userData.address || '',
                    city: userData.city || '',
                    country: userData.country || '',
                    postalCode: userData.postalCode || '',
                    dateOfBirth: userData.dateOfBirth || '',
                    idNumber: userData.idNumber || '',
                });

                // Check if this is a new user who hasn't completed their profile
                setIsNewUser(!userData.profileCompleted);
            }
        };

        checkProfileCompletion();
    }, [user, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await updateUserProfile({
                ...profileData,
                profileCompleted: true,
            });

            toast({
                title: "Profile Updated",
                description: "Your profile has been updated successfully.",
            });

            // If this was a new user completing their profile for the first time,
            // redirect them to the dashboard
            if (isNewUser) {
                router.push('/dashboard');
            }
        } catch (error: any) {
            toast({
                title: "Update Failed",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container mx-auto py-8">
            <Card className="max-w-5xl mx-auto">
                <CardHeader>
                    <CardTitle>{isNewUser ? 'Complete Your Profile' : 'Edit Profile'}</CardTitle>
                    <CardDescription>
                        {isNewUser 
                            ? 'Please complete your profile information to continue' 
                            : 'Update your personal information'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="fullName">Full Name</Label>
                                <Input
                                    id="fullName"
                                    value={profileData.fullName}
                                    onChange={(e) => setProfileData(prev => ({
                                        ...prev,
                                        fullName: e.target.value
                                    }))}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input
                                    id="phone"
                                    value={profileData.phone}
                                    onChange={(e) => setProfileData(prev => ({
                                        ...prev,
                                        phone: e.target.value
                                    }))}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                                <Input
                                    id="dateOfBirth"
                                    type="date"
                                    value={profileData.dateOfBirth}
                                    onChange={(e) => setProfileData(prev => ({
                                        ...prev,
                                        dateOfBirth: e.target.value
                                    }))}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="idNumber">ID Number</Label>
                                <Input
                                    id="idNumber"
                                    value={profileData.idNumber}
                                    onChange={(e) => setProfileData(prev => ({
                                        ...prev,
                                        idNumber: e.target.value
                                    }))}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="address">Address</Label>
                                <Input
                                    id="address"
                                    value={profileData.address}
                                    onChange={(e) => setProfileData(prev => ({
                                        ...prev,
                                        address: e.target.value
                                    }))}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="city">City</Label>
                                <Input
                                    id="city"
                                    value={profileData.city}
                                    onChange={(e) => setProfileData(prev => ({
                                        ...prev,
                                        city: e.target.value
                                    }))}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="country">Country</Label>
                                <Input
                                    id="country"
                                    value={profileData.country}
                                    onChange={(e) => setProfileData(prev => ({
                                        ...prev,
                                        country: e.target.value
                                    }))}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="postalCode">Postal Code</Label>
                                <Input
                                    id="postalCode"
                                    value={profileData.postalCode}
                                    onChange={(e) => setProfileData(prev => ({
                                        ...prev,
                                        postalCode: e.target.value
                                    }))}
                                    required
                                />
                            </div>
                        </div>
                        <div className="flex justify-end space-x-4">
                            {!isNewUser && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.back()}
                                >
                                    Cancel
                                </Button>
                            )}
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Saving...' : isNewUser ? 'Complete Profile' : 'Save Changes'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}