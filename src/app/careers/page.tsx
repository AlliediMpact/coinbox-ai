'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, Users, Heart, TrendingUp, Mail } from 'lucide-react';
import Link from 'next/link';

export default function CareersPage() {
  const positions = [
    {
      title: 'Senior Full-Stack Developer',
      department: 'Engineering',
      location: 'Remote / Johannesburg',
      type: 'Full-time'
    },
    {
      title: 'Customer Support Specialist',
      department: 'Support',
      location: 'Cape Town',
      type: 'Full-time'
    },
    {
      title: 'Compliance Officer',
      department: 'Legal & Compliance',
      location: 'Johannesburg',
      type: 'Full-time'
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
            <h1 className="text-4xl font-bold mb-4">Join Our Team</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Help us build the future of peer-to-peer financial services in Africa
            </p>
          </div>

          {/* Why Join Us */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <Card>
              <CardHeader>
                <Users className="h-10 w-10 mb-2 text-primary" />
                <CardTitle>Great Team</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Work with talented professionals who are passionate about fintech innovation.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <TrendingUp className="h-10 w-10 mb-2 text-primary" />
                <CardTitle>Growth Opportunities</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Continuous learning and career development in a fast-growing company.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Heart className="h-10 w-10 mb-2 text-primary" />
                <CardTitle>Work-Life Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Flexible working arrangements and comprehensive benefits package.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Open Positions */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6">Open Positions</h2>
            <div className="space-y-4">
              {positions.map((position, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card>
                    <CardContent className="flex items-center justify-between p-6">
                      <div className="flex items-start space-x-4">
                        <Briefcase className="h-6 w-6 text-primary mt-1" />
                        <div>
                          <h3 className="font-semibold text-lg">{position.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {position.department} • {position.location} • {position.type}
                          </p>
                        </div>
                      </div>
                      <Button>Apply Now</Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Contact */}
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-8 text-center">
              <Mail className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Don't see a perfect fit?</h3>
              <p className="mb-4">
                We're always looking for talented individuals. Send us your CV!
              </p>
              <Button variant="secondary" asChild>
                <Link href="mailto:careers@coinbox.com">
                  Contact HR Team
                </Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
