'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-12">
            <FileText className="h-16 w-16 mx-auto mb-4 text-primary" />
            <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <Card>
            <CardContent className="p-8 space-y-6">
              <section>
                <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
                <p className="text-muted-foreground leading-relaxed">
                  By accessing and using CoinBox Connect ("the Platform"), you agree to be bound by these Terms of Service. 
                  If you do not agree to these terms, please do not use our services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">2. User Accounts</h2>
                <p className="text-muted-foreground leading-relaxed mb-2">
                  To use our platform, you must:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Be at least 18 years of age</li>
                  <li>Provide accurate and complete registration information</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Accept responsibility for all activities under your account</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">3. Platform Services</h2>
                <p className="text-muted-foreground leading-relaxed">
                  CoinBox Connect provides peer-to-peer trading services, wallet management, and related financial services. 
                  We reserve the right to modify, suspend, or discontinue any service at any time.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">4. User Obligations</h2>
                <p className="text-muted-foreground leading-relaxed mb-2">
                  You agree to:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Comply with all applicable laws and regulations</li>
                  <li>Not engage in fraudulent or illegal activities</li>
                  <li>Provide truthful information during KYC verification</li>
                  <li>Not attempt to manipulate or abuse the platform</li>
                  <li>Respect the rights of other users</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">5. Trading and Transactions</h2>
                <p className="text-muted-foreground leading-relaxed">
                  All trades are subject to our escrow system. Disputes must be reported within 24 hours of the trade. 
                  Transaction fees apply based on your membership tier.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">6. Prohibited Activities</h2>
                <p className="text-muted-foreground leading-relaxed mb-2">
                  The following activities are strictly prohibited:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Money laundering or terrorist financing</li>
                  <li>Market manipulation or insider trading</li>
                  <li>Creating multiple accounts to circumvent limits</li>
                  <li>Automated trading or botting without authorization</li>
                  <li>Harassment or abusive behavior toward other users</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">7. Limitation of Liability</h2>
                <p className="text-muted-foreground leading-relaxed">
                  CoinBox Connect is not liable for any indirect, incidental, or consequential damages arising from 
                  your use of the platform. Our total liability shall not exceed the fees paid by you in the past 12 months.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">8. Termination</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We reserve the right to suspend or terminate your account for violations of these terms, 
                  suspicious activity, or at our discretion. You may close your account at any time.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">9. Changes to Terms</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may update these terms from time to time. Continued use of the platform after changes 
                  constitutes acceptance of the modified terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">10. Contact Information</h2>
                <p className="text-muted-foreground leading-relaxed">
                  For questions about these terms, please contact us at legal@coinbox.com
                </p>
              </section>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
