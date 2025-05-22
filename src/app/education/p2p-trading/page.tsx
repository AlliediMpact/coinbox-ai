'use client';

import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, 
  Video, 
  HelpCircle, 
  ChevronRight, 
  Award,
  Shield,
  Layers,
  Users,
  Search
} from 'lucide-react';
import Link from 'next/link';

export default function P2PEducationCenter() {
  const [activeTab, setActiveTab] = useState('basics');

  // Content for each section
  const contentSections = {
    basics: {
      title: "P2P Trading Basics",
      description: "Learn the fundamentals of peer-to-peer trading",
      intro: "Peer-to-peer trading allows individuals to trade directly with each other without intermediaries. This guide covers the basics of P2P trading on the CoinBox platform.",
      sections: [
        {
          title: "What is P2P Trading?",
          content: "Peer-to-peer trading is a decentralized way of exchanging assets directly between users. Unlike traditional exchanges which act as intermediaries, P2P platforms connect buyers and sellers directly, often with an escrow service to ensure secure transactions."
        },
        {
          title: "Benefits of P2P Trading",
          content: "P2P trading offers several advantages including lower fees, more payment options, better privacy, and access to global markets. You can often find better rates and personalized service through direct peer trading."
        },
        {
          title: "Understanding the CoinBox P2P Process",
          content: "On CoinBox, the trading process is simple: browse available offers, select one that matches your needs, initiate a trade, complete the payment, and receive your assets once confirmed. Our escrow system protects both parties throughout the transaction."
        }
      ],
      video: {
        title: "P2P Trading Explained",
        duration: "5:42",
        thumbnail: "/assets/video-thumbnails/p2p-basics.jpg"
      }
    },
    security: {
      title: "Security Best Practices",
      description: "Protect your account and funds",
      intro: "Security is paramount when trading on any platform. Follow these guidelines to ensure your CoinBox experience remains safe and secure.",
      sections: [
        {
          title: "Strong Account Security",
          content: "Always use a strong, unique password and enable two-factor authentication (2FA) for your CoinBox account. Never share your password or 2FA codes with anyone, including support staff."
        },
        {
          title: "Safe Trading Habits",
          content: "Only trade with users who have good reputation scores. Start with smaller trades when dealing with new users. Always use the platform's messaging system to keep communication records."
        },
        {
          title: "Recognizing Scams",
          content: "Be wary of offers that seem too good to be true, users requesting to trade outside the platform, or anyone asking for your login credentials. All legitimate transactions happen through the platform's escrow system."
        }
      ],
      video: {
        title: "Securing Your CoinBox Account",
        duration: "7:15",
        thumbnail: "/assets/video-thumbnails/security.jpg"
      }
    },
    escrow: {
      title: "Understanding Escrow",
      description: "How our escrow system protects your trades",
      intro: "The escrow system is the foundation of safe P2P trading. Learn how it works and why it's essential for secure transactions.",
      sections: [
        {
          title: "What is Escrow?",
          content: "Escrow is a financial arrangement where a third party holds and regulates payment of funds required for two parties involved in a given transaction. It helps make transactions more secure by keeping the payment in a secure escrow account until all terms of the agreement are met."
        },
        {
          title: "How Escrow Works on CoinBox",
          content: "When you sell on CoinBox, your digital assets are held in escrow while the buyer makes payment. Once payment is confirmed, the assets are released to the buyer. This protects both parties from fraud and ensures smooth transactions."
        },
        {
          title: "Dispute Resolution",
          content: "If there's a disagreement during a trade, either party can open a dispute. Our support team will review the evidence and communication between parties to resolve the issue fairly according to our platform policies."
        }
      ],
      video: {
        title: "Escrow Deep Dive",
        duration: "6:30",
        thumbnail: "/assets/video-thumbnails/escrow.jpg"
      }
    },
    advanced: {
      title: "Advanced Trading Strategies",
      description: "Take your P2P trading to the next level",
      intro: "Once you're comfortable with the basics, you can employ more sophisticated trading strategies to optimize your experience and potentially increase returns.",
      sections: [
        {
          title: "Market Timing",
          content: "Understanding market cycles can help you make better trading decisions. Consider buying during market downturns and selling during uptrends for better returns. Monitor trends and price movements to identify optimal trading opportunities."
        },
        {
          title: "Diversification Strategies",
          content: "Don't put all your eggs in one basket. Spread your trades across different assets and trading partners to minimize risk. Having a diversified approach can protect you from volatility in specific markets."
        },
        {
          title: "Building Reputation for Better Terms",
          content: "A strong reputation on the platform can lead to preferential trading terms. Focus on completing trades promptly and professionally to build your reputation score. Higher reputation often means more trading opportunities."
        }
      ],
      video: {
        title: "Pro Trading Techniques",
        duration: "12:45",
        thumbnail: "/assets/video-thumbnails/advanced.jpg"
      }
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">P2P Trading Education Center</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <div className="bg-muted p-1 rounded-lg">
            <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <TabsTrigger value="basics" className="data-[state=active]:bg-white">
                <BookOpen className="h-4 w-4 mr-2" />
                Basics
              </TabsTrigger>
              <TabsTrigger value="security" className="data-[state=active]:bg-white">
                <Shield className="h-4 w-4 mr-2" />
                Security
              </TabsTrigger>
              <TabsTrigger value="escrow" className="data-[state=active]:bg-white">
                <Layers className="h-4 w-4 mr-2" />
                Escrow
              </TabsTrigger>
              <TabsTrigger value="advanced" className="data-[state=active]:bg-white">
                <Award className="h-4 w-4 mr-2" />
                Advanced
              </TabsTrigger>
            </TabsList>
          </div>
          
          {Object.keys(contentSections).map(key => (
            <TabsContent key={key} value={key} className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-2/3">
                  <Card>
                    <CardHeader>
                      <CardTitle>{contentSections[key].title}</CardTitle>
                      <CardDescription>{contentSections[key].description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-6">{contentSections[key].intro}</p>
                      
                      <div className="space-y-6">
                        {contentSections[key].sections.map((section, index) => (
                          <div key={index}>
                            <h3 className="text-lg font-semibold mb-2">{section.title}</h3>
                            <p>{section.content}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button variant="ghost" size="sm">
                        <Search className="h-4 w-4 mr-2" />
                        Learn more
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
                
                <div className="md:w-1/3">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Video Tutorial</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                        <div className="text-center">
                          <Video className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                          <h3 className="font-medium">{contentSections[key].video.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {contentSections[key].video.duration}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button className="w-full">
                        Watch Video
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle className="text-base">Related Resources</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        <li>
                          <Link href="#" className="flex items-center text-sm hover:underline">
                            <BookOpen className="h-4 w-4 mr-2" />
                            Detailed guide
                          </Link>
                        </li>
                        <li>
                          <Link href="#" className="flex items-center text-sm hover:underline">
                            <Users className="h-4 w-4 mr-2" />
                            Community forum
                          </Link>
                        </li>
                        <li>
                          <Link href="#" className="flex items-center text-sm hover:underline">
                            <HelpCircle className="h-4 w-4 mr-2" />
                            FAQ section
                          </Link>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Quick Reference Guide</CardTitle>
                  <CardDescription>Key points to remember</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {contentSections[key].sections.map((section, index) => (
                      <div key={index} className="bg-muted/50 p-4 rounded-lg">
                        <h4 className="font-medium mb-1">{section.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {section.content.substring(0, 100)}...
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" size="sm">
                    Download PDF Guide
                  </Button>
                  <Button variant="ghost" size="sm">
                    Next Lesson <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
