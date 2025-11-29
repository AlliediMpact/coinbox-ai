'use client';
import { motion } from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";
import { Cookie } from 'lucide-react';

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-12">
            <Cookie className="h-16 w-16 mx-auto mb-4 text-primary" />
            <h1 className="text-4xl font-bold mb-4">Cookie Policy</h1>
          </div>
          <Card>
            <CardContent className="p-8 space-y-6">
              <section>
                <h2 className="text-2xl font-bold mb-4">What Are Cookies?</h2>
                <p className="text-muted-foreground">Cookies are small text files stored on your device that help us provide and improve our services.</p>
              </section>
              <section>
                <h2 className="text-2xl font-bold mb-4">How We Use Cookies</h2>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Essential cookies for platform functionality</li>
                  <li>Analytics cookies to understand usage patterns</li>
                  <li>Preference cookies to remember your settings</li>
                </ul>
              </section>
              <section>
                <h2 className="text-2xl font-bold mb-4">Managing Cookies</h2>
                <p className="text-muted-foreground">You can control cookies through your browser settings. Note that disabling certain cookies may affect platform functionality.</p>
              </section>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
