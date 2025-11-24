'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check, RefreshCw, Share2, Link } from "lucide-react";

interface ReferralCodeGeneratorProps {
  referralCode: string | null;
  onGenerate: () => Promise<void>;
}

export function ReferralCodeGenerator({ referralCode, onGenerate }: ReferralCodeGeneratorProps) {
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('link');
  
  // Base URL for referral links
  const baseUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/register?ref=` 
    : 'https://coinbox-connect.com/register?ref=';
    
  const referralLink = referralCode ? `${baseUrl}${referralCode}` : '';
  
  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  // Generate referral code
  const handleGenerateCode = async () => {
    setIsGenerating(true);
    await onGenerate();
    setIsGenerating(false);
  };
  
  // Share via native share API if available
  const shareReferralLink = () => {
    if (navigator.share && referralLink) {
      navigator.share({
        title: 'Join CoinBox Connect with my referral code',
        text: 'Use my referral link to join CoinBox Connect and we both earn rewards!',
        url: referralLink
      })
      .catch((error) => console.log('Error sharing', error));
    } else {
      copyToClipboard(referralLink);
    }
  };
  
  // Email template
  const emailTemplate = `
    Hello,
    
    I'd like to invite you to join CoinBox Connect, a platform for P2P trading and more.
    
    Use my referral code: ${referralCode || '[Your code will appear here]'}
    
    Or simply click this link to sign up: ${referralLink || '[Your link will appear here]'}
    
    Thanks!
  `.trim();
  
  // WhatsApp template
  const whatsappText = encodeURIComponent(
    `Join CoinBox Connect using my referral code: ${referralCode} and we both earn rewards! Sign up here: ${referralLink}`
  );
  const whatsappLink = `https://wa.me/?text=${whatsappText}`;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Your Referral Code</CardTitle>
            <CardDescription>Share your code to earn commissions</CardDescription>
          </div>
          
          {referralCode && (
            <Badge variant="outline" className="text-lg px-3 py-1 font-mono bg-primary/5">
              {referralCode}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!referralCode ? (
          <div className="flex flex-col items-center justify-center py-6">
            <p className="text-center mb-4 text-muted-foreground">
              You don&apos;t have a referral code yet. Generate one to start earning commissions.
            </p>
            <Button onClick={handleGenerateCode} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <RefreshCw className="mr-1 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Referral Code'
              )}
            </Button>
          </div>
        ) : (
          <>
            <Tabs defaultValue="link" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="link">Referral Link</TabsTrigger>
                <TabsTrigger value="email">Email Template</TabsTrigger>
                <TabsTrigger value="social">Social Share</TabsTrigger>
              </TabsList>
              
              <TabsContent value="link" className="mt-4">
                <div className="flex items-center space-x-2">
                  <div className="grid flex-1 gap-2">
                    <Input
                      readOnly
                      value={referralLink}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Share this link directly with friends or on social media
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => copyToClipboard(referralLink)}
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                <div className="mt-4 flex justify-between">
                  <Button variant="outline" size="sm" onClick={() => shareReferralLink()}>
                    <Share2 className="mr-1 h-4 w-4" />
                    Share Link
                  </Button>
                  
                  <a 
                    href={whatsappLink} 
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm">
                      Share via WhatsApp
                    </Button>
                  </a>
                </div>
              </TabsContent>
              
              <TabsContent value="email" className="mt-4">
                <div className="rounded-md border bg-muted/50 p-4">
                  <pre className="whitespace-pre-wrap text-sm">
                    {emailTemplate}
                  </pre>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(emailTemplate)}>
                    {copied ? (
                      <>
                        <Check className="mr-1 h-4 w-4 text-green-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-1 h-4 w-4" />
                        Copy Template
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="social" className="mt-4">
                <div className="grid gap-4">
                  <div className="flex flex-col space-y-2">
                    <h3 className="text-sm font-medium">Social Media Message</h3>
                    <div className="rounded-md border bg-muted/50 p-4">
                      <p className="text-sm">
                        Join CoinBox Connect using my referral code: {referralCode} and we both earn rewards! 
                        Sign up here: {referralLink}
                      </p>
                    </div>
                    <div className="flex justify-end">
                      <Button variant="outline" size="sm" onClick={() => copyToClipboard(
                        `Join CoinBox Connect using my referral code: ${referralCode} and we both earn rewards! Sign up here: ${referralLink}`
                      )}>
                        <Copy className="mr-1 h-4 w-4" />
                        Copy Message
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <a 
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                        `Join CoinBox Connect using my referral code: ${referralCode} and we both earn rewards! Sign up here: ${referralLink}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full"
                    >
                      <Button variant="outline" className="w-full">
                        Share on Twitter
                      </Button>
                    </a>
                    
                    <a 
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full"
                    >
                      <Button variant="outline" className="w-full">
                        Share on Facebook
                      </Button>
                    </a>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="mt-6 bg-muted/30 rounded-md p-4">
              <div className="flex items-start space-x-2">
                <Link className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium">How it works</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Share your referral code with friends. When they sign up and start trading, 
                    you&apos;ll earn a commission on their trading fees based on your membership tier. 
                    The more people you refer, the more you earn!
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
