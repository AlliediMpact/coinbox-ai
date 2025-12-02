'use client';
import { motion } from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";
import { Newspaper, Download } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function PressPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-12">
            <Newspaper className="h-16 w-16 mx-auto mb-4 text-primary" />
            <h1 className="text-4xl font-bold mb-4">Press & Media</h1>
            <p className="text-xl text-muted-foreground">Latest news and media resources</p>
          </div>
          <Card className="mb-8">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4">Press Releases</h2>
              <p className="text-muted-foreground mb-4">For media inquiries and press releases, please contact:</p>
              <p className="font-semibold">press@coinbox.com</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4">Media Kit</h2>
              <p className="text-muted-foreground mb-4">Download our logo, brand guidelines, and company information.</p>
              <Button onClick={() => {
                const link = document.createElement('a');
                link.href = '/assets/media-kit.zip';
                link.download = 'coinbox-media-kit.zip';
                link.click();
              }}>
                <Download className="mr-2 h-4 w-4" />Download Media Kit
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
