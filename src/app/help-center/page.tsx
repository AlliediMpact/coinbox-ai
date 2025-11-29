'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  HelpCircle, 
  Search, 
  BookOpen, 
  MessageCircle, 
  Shield,
  Wallet,
  Users,
  FileText
} from 'lucide-react';
import Link from 'next/link';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    {
      icon: Wallet,
      title: 'Getting Started',
      description: 'Learn the basics of CoinBox',
      articles: 5
    },
    {
      icon: Shield,
      title: 'Security',
      description: 'Keep your account safe',
      articles: 8
    },
    {
      icon: Users,
      title: 'Trading',
      description: 'P2P trading guide',
      articles: 12
    },
    {
      icon: FileText,
      title: 'Account Management',
      description: 'Manage your profile',
      articles: 6
    }
  ];

  const faqs = [
    {
      question: 'How do I create an account?',
      answer: 'Click on the "Sign Up" button on the homepage and fill in your details. You will need to verify your email address before you can start trading.'
    },
    {
      question: 'Is my money safe on CoinBox?',
      answer: 'Yes, we use industry-standard encryption and security measures. Your funds are stored securely, and we implement multi-factor authentication for added protection.'
    },
    {
      question: 'How long does KYC verification take?',
      answer: 'KYC verification typically takes 24-48 hours. You will receive an email notification once your verification is complete.'
    },
    {
      question: 'What are the trading fees?',
      answer: 'Trading fees vary based on your membership tier. Basic members pay 2%, Ambassadors 1.5%, and Business members 1%. Check the membership page for more details.'
    },
    {
      question: 'How do I withdraw my funds?',
      answer: 'Navigate to your Wallet, select Withdraw, enter the amount and your bank details. Withdrawals are processed within 1-3 business days.'
    },
    {
      question: 'Can I cancel a trade?',
      answer: 'Once a trade is initiated, it enters escrow. You can dispute a trade if there is an issue, but cancellations must be agreed upon by both parties.'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="text-center mb-12">
            <HelpCircle className="h-16 w-16 mx-auto mb-4 text-primary" />
            <h1 className="text-4xl font-bold mb-4">Help Center</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Find answers to common questions and learn how to use CoinBox
            </p>

            {/* Search */}
            <div className="max-w-2xl mx-auto relative">
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search for help articles..."
                className="pl-12 h-12 text-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Categories */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {categories.map((category, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <category.icon className="h-10 w-10 mb-2 text-primary" />
                    <CardTitle>{category.title}</CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {category.articles} articles
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* FAQs */}
          <div className="max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold mb-6">Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Contact Support */}
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-8 text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Still need help?</h3>
              <p className="mb-4">
                Our support team is available 24/7 to assist you
              </p>
              <div className="flex gap-4 justify-center">
                <Button variant="secondary" asChild>
                  <Link href="/dashboard/support">
                    Contact Support
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/education/p2p-trading">
                    <BookOpen className="mr-2 h-4 w-4" />
                    View Tutorials
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
