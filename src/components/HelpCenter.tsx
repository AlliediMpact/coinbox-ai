'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import UserOnboarding from "./UserOnboarding";
import { 
  BookOpen, 
  Search, 
  HelpCircle, 
  MessageSquare, 
  Video, 
  FileText,
  Link,
  PenTool,
  Coins,
  Wallet,
  Shield,
  User,
  Lock,
  Share2,
  ChevronRight
} from 'lucide-react';

interface GuideCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  guides: Guide[];
}

interface Guide {
  id: string;
  title: string;
  description: string;
  contentType: 'article' | 'video' | 'tutorial';
  time: string; // Reading/watching time
  path: string; // URL path or action identifier
}

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("guides");
  
  // Sample guide categories and content
  const guideCategories: GuideCategory[] = [
    {
      id: 'getting-started',
      name: 'Getting Started',
      description: 'Essential guides for new users',
      icon: <User className="h-5 w-5" />,
      guides: [
        {
          id: 'platform-introduction',
          title: 'Platform Introduction',
          description: 'Learn about the Allied iMpact Coin Box platform and its core features',
          contentType: 'tutorial',
          time: '5 min',
          path: '/tutorials/introduction'
        },
        {
          id: 'account-setup',
          title: 'Setting Up Your Account',
          description: 'Complete your profile and verify your identity',
          contentType: 'article',
          time: '3 min',
          path: '/guides/account-setup'
        },
        {
          id: 'first-transaction',
          title: 'Making Your First Transaction',
          description: 'Step-by-step guide to your first coin transaction',
          contentType: 'video',
          time: '4 min',
          path: '/videos/first-transaction'
        }
      ]
    },
    {
      id: 'trading',
      name: 'Trading',
      description: 'Guides for buying and selling coins',
      icon: <Coins className="h-5 w-5" />,
      guides: [
        {
          id: 'create-trade',
          title: 'Creating a Trade Offer',
          description: 'How to create an attractive trade offer',
          contentType: 'article',
          time: '4 min',
          path: '/guides/create-trade'
        },
        {
          id: 'escrow-system',
          title: 'Understanding the Escrow System',
          description: 'How our secure escrow system protects your trades',
          contentType: 'article',
          time: '5 min',
          path: '/guides/escrow'
        },
        {
          id: 'dispute-resolution',
          title: 'Dispute Resolution Process',
          description: 'What to do if a trade doesn't go as planned',
          contentType: 'video',
          time: '7 min',
          path: '/videos/disputes'
        }
      ]
    },
    {
      id: 'wallet',
      name: 'Wallet Management',
      description: 'Managing your funds and transactions',
      icon: <Wallet className="h-5 w-5" />,
      guides: [
        {
          id: 'deposit-funds',
          title: 'Depositing Funds',
          description: 'How to add funds to your wallet',
          contentType: 'article',
          time: '3 min',
          path: '/guides/deposits'
        },
        {
          id: 'withdraw-funds',
          title: 'Withdrawing Funds',
          description: 'How to withdraw funds to your bank account',
          contentType: 'tutorial',
          time: '4 min',
          path: '/tutorials/withdrawals'
        }
      ]
    },
    {
      id: 'security',
      name: 'Security',
      description: 'Keeping your account and funds secure',
      icon: <Shield className="h-5 w-5" />,
      guides: [
        {
          id: 'enable-2fa',
          title: 'Setting Up Two-Factor Authentication',
          description: 'Enhance your account security with 2FA',
          contentType: 'tutorial',
          time: '5 min',
          path: '/tutorials/2fa'
        },
        {
          id: 'security-best-practices',
          title: 'Security Best Practices',
          description: 'Tips for keeping your account secure',
          contentType: 'article',
          time: '6 min',
          path: '/guides/security-tips'
        }
      ]
    },
    {
      id: 'referrals',
      name: 'Referral Program',
      description: 'Earn by referring friends to the platform',
      icon: <Share2 className="h-5 w-5" />,
      guides: [
        {
          id: 'referral-basics',
          title: 'Referral Basics',
          description: 'How the referral program works',
          contentType: 'article',
          time: '3 min',
          path: '/guides/referral-basics'
        },
        {
          id: 'maximize-earnings',
          title: 'Maximizing Your Referral Earnings',
          description: 'Strategies to increase your commissions',
          contentType: 'video',
          time: '8 min',
          path: '/videos/referral-tips'
        }
      ]
    }
  ];
  
  // Filter guides based on search query
  const filteredCategories = searchQuery 
    ? guideCategories.map(category => ({
        ...category,
        guides: category.guides.filter(guide =>
          guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          guide.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(category => category.guides.length > 0)
    : guideCategories;
    
  // Handler for guide selection
  const handleGuideSelect = (guide: Guide) => {
    if (guide.contentType === 'tutorial') {
      // Tutorials would typically launch the onboarding component
      console.log(`Opening tutorial: ${guide.title}`);
    } else {
      // Articles and videos would navigate to their respective pages
      console.log(`Navigating to: ${guide.path}`);
    }
  };
  
  // Content type icon mapping
  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'article':
        return <FileText className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'tutorial':
        return <PenTool className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">Help Center</CardTitle>
            <CardDescription>Find guides, tutorials, and answers to your questions</CardDescription>
          </div>
        </div>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Search for help articles..."
            className="pl-10"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="guides" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="guides" className="flex items-center">
              <BookOpen className="mr-2 h-4 w-4" />
              <span>Guides & Tutorials</span>
            </TabsTrigger>
            <TabsTrigger value="tutorials" className="flex items-center">
              <Video className="mr-2 h-4 w-4" />
              <span>Interactive Tutorials</span>
            </TabsTrigger>
            <TabsTrigger value="faq" className="flex items-center">
              <HelpCircle className="mr-2 h-4 w-4" />
              <span>FAQs</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Guides & Articles Tab */}
          <TabsContent value="guides">
            {filteredCategories.length > 0 ? (
              <div className="space-y-6">
                {filteredCategories.map((category) => (
                  <div key={category.id}>
                    <h3 className="text-lg font-semibold flex items-center mb-3">
                      <div className="p-1.5 bg-primary/10 rounded-md mr-2">
                        {category.icon}
                      </div>
                      {category.name}
                    </h3>
                    <div className="grid gap-3">
                      {category.guides.map((guide) => (
                        <motion.div 
                          key={guide.id}
                          whileHover={{ scale: 1.01 }}
                          className="border rounded-lg p-4 cursor-pointer bg-card hover:bg-accent/5"
                          onClick={() => handleGuideSelect(guide)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-base font-medium">{guide.title}</h4>
                              <p className="text-sm text-muted-foreground mt-1">{guide.description}</p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="flex items-center mt-3 gap-4">
                            <div className="flex items-center text-xs text-muted-foreground">
                              {getContentTypeIcon(guide.contentType)}
                              <span className="ml-1 capitalize">{guide.contentType}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {guide.time}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <HelpCircle className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                <h3 className="mt-4 text-lg font-medium">No guides found</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Try adjusting your search or browse all categories
                </p>
              </div>
            )}
          </TabsContent>
          
          {/* Interactive Tutorials Tab */}
          <TabsContent value="tutorials">
            <div className="p-6 border rounded-lg bg-muted/50">
              <UserOnboarding disableAutoShow={true} />
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2">Interactive Tutorials</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Learn how to use the platform with our step-by-step interactive guides
                </p>
                <Button>Start Tutorial</Button>
              </div>
            </div>
          </TabsContent>
          
          {/* FAQ Tab */}
          <TabsContent value="faq">
            <div className="space-y-4">
              {/* Example FAQs */}
              <div className="border rounded-lg p-4">
                <h4 className="text-base font-medium">How do I get started with trading?</h4>
                <p className="mt-2 text-sm text-muted-foreground">
                  To start trading, complete your profile, verify your identity, and deposit funds into your wallet. 
                  Then navigate to the Trading section to browse available offers or create your own.
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="text-base font-medium">How are my funds protected?</h4>
                <p className="mt-2 text-sm text-muted-foreground">
                  All trades are protected by our escrow system. When you initiate a trade, the coins are held in escrow 
                  until both parties confirm the transaction is complete, ensuring a safe trading experience.
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="text-base font-medium">What is the referral program?</h4>
                <p className="mt-2 text-sm text-muted-foreground">
                  Our referral program allows you to earn commissions when people you refer complete transactions. 
                  Your commission rate depends on your membership tier, with higher tiers earning more.
                </p>
              </div>
              {/* More FAQs can be added here */}
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Contact Support Section */}
        <div className="mt-8 border-t pt-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Still need help?</h3>
              <p className="text-sm text-muted-foreground">Our support team is ready to assist you</p>
            </div>
            <Button className="flex items-center">
              <MessageSquare className="mr-2 h-4 w-4" />
              <span>Contact Support</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export { HelpCenter };
