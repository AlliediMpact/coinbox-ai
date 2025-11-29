'use client';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Eye, CheckCircle } from 'lucide-react';

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-12">
            <Shield className="h-16 w-16 mx-auto mb-4 text-primary" />
            <h1 className="text-4xl font-bold mb-4">Security</h1>
            <p className="text-xl text-muted-foreground">Your safety is our top priority</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Card><CardHeader><Lock className="h-8 w-8 mb-2 text-primary" /><CardTitle>Encryption</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">All data is encrypted using AES-256 encryption at rest and TLS 1.3 in transit.</p></CardContent></Card>
            <Card><CardHeader><Eye className="h-8 w-8 mb-2 text-primary" /><CardTitle>Monitoring</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">24/7 transaction monitoring to detect and prevent fraudulent activity.</p></CardContent></Card>
            <Card><CardHeader><CheckCircle className="h-8 w-8 mb-2 text-primary" /><CardTitle>Two-Factor Auth</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">Optional 2FA for additional account protection.</p></CardContent></Card>
            <Card><CardHeader><Shield className="h-8 w-8 mb-2 text-primary" /><CardTitle>Compliance</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">Full compliance with financial regulations and data protection laws.</p></CardContent></Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
