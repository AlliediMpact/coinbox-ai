'use client';
import { motion } from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";
import { FileCheck } from 'lucide-react';

export default function CompliancePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-12">
            <FileCheck className="h-16 w-16 mx-auto mb-4 text-primary" />
            <h1 className="text-4xl font-bold mb-4">Compliance</h1>
          </div>
          <Card>
            <CardContent className="p-8 space-y-6">
              <section>
                <h2 className="text-2xl font-bold mb-4">Regulatory Compliance</h2>
                <p className="text-muted-foreground">CoinBox Connect operates in full compliance with South African financial regulations, including FICA and POPIA.</p>
              </section>
              <section>
                <h2 className="text-2xl font-bold mb-4">Anti-Money Laundering (AML)</h2>
                <p className="text-muted-foreground">We maintain strict AML policies and procedures, including transaction monitoring and suspicious activity reporting.</p>
              </section>
              <section>
                <h2 className="text-2xl font-bold mb-4">Know Your Customer (KYC)</h2>
                <p className="text-muted-foreground">All users must complete KYC verification to ensure platform integrity and regulatory compliance.</p>
              </section>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
