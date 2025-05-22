'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  BookOpen, 
  HelpCircle, 
  Activity, 
  Shield, 
  Github, 
  Twitter, 
  Linkedin, 
  Facebook,
  Mail 
} from 'lucide-react';

export default function SiteFooter() {
  const router = useRouter();
  
  return (
    <footer className="bg-background border-t">
      <div className="container px-4 py-8 mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-semibold text-sm mb-3">Company</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="hover:underline">About Us</Link>
              </li>
              <li>
                <Link href="/contact" className="hover:underline">Contact</Link>
              </li>
              <li>
                <Link href="/careers" className="hover:underline">Careers</Link>
              </li>
              <li>
                <Link href="/press" className="hover:underline">Press</Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-sm mb-3">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/education/p2p-trading" className="flex items-center hover:underline">
                  <BookOpen className="w-4 h-4 mr-1" />
                  P2P Trading Education
                </Link>
              </li>
              <li>
                <Link href="/help-center" className="flex items-center hover:underline">
                  <HelpCircle className="w-4 h-4 mr-1" />
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/system-status" className="flex items-center hover:underline">
                  <Activity className="w-4 h-4 mr-1" />
                  System Status
                </Link>
              </li>
              <li>
                <Link href="/security" className="flex items-center hover:underline">
                  <Shield className="w-4 h-4 mr-1" />
                  Security
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-sm mb-3">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terms" className="hover:underline">Terms of Service</Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/compliance" className="hover:underline">Compliance</Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:underline">Cookie Policy</Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-sm mb-3">Connect with Us</h3>
            <div className="flex space-x-2 mb-4">
              <Link href="https://twitter.com/coinbox" target="_blank" className="p-2 rounded-full hover:bg-muted">
                <Twitter className="w-5 h-5" />
              </Link>
              <Link href="https://linkedin.com/company/coinbox" target="_blank" className="p-2 rounded-full hover:bg-muted">
                <Linkedin className="w-5 h-5" />
              </Link>
              <Link href="https://facebook.com/coinboxapp" target="_blank" className="p-2 rounded-full hover:bg-muted">
                <Facebook className="w-5 h-5" />
              </Link>
              <Link href="https://github.com/coinbox" target="_blank" className="p-2 rounded-full hover:bg-muted">
                <Github className="w-5 h-5" />
              </Link>
            </div>
            <Link href="mailto:contact@coinbox.com" className="flex items-center text-sm hover:underline">
              <Mail className="w-4 h-4 mr-1" />
              contact@coinbox.com
            </Link>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Allied iMpact Coin Box. All rights reserved.
            </p>
            <div className="flex items-center mt-4 md:mt-0">
              <p className="text-sm text-muted-foreground mr-2">Region:</p>
              <select 
                className="text-sm bg-transparent border rounded p-1"
                defaultValue="us"
              >
                <option value="us">United States</option>
                <option value="eu">European Union</option>
                <option value="uk">United Kingdom</option>
                <option value="ca">Canada</option>
                <option value="au">Australia</option>
                <option value="za">South Africa</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
