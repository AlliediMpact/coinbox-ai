'use client';
import { motion } from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";
import { Shield } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-12">
            <Shield className="h-16 w-16 mx-auto mb-4 text-primary" />
            <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </div>
          <Card>
            <CardContent className="p-8 space-y-6">
              <section>
                <h2 className="text-2xl font-bold mb-4">Data Collection</h2>
                <p className="text-muted-foreground">We collect personal information necessary for account creation, KYC verification, and service delivery. This includes your name, email, phone number, and identification documents.</p>
              </section>
              <section>
                <h2 className="text-2xl font-bold mb-4">Data Usage</h2>
                <p className="text-muted-foreground">Your data is used to provide services, prevent fraud, comply with legal obligations, and improve our platform. We do not sell your personal information to third parties.</p>
              </section>
              <section>
                <h2 className="text-2xl font-bold mb-4">Data Security</h2>
                <p className="text-muted-foreground">We employ industry-standard security measures including encryption, secure servers, and regular security audits to protect your data.</p>
              </section>
              <section>
                <h2 className="text-2xl font-bold mb-4">Your Rights</h2>
                <p className="text-muted-foreground">You have the right to access, correct, or delete your personal data. Contact privacy@coinbox.com to exercise these rights.</p>
              </section>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
