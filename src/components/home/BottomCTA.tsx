'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function BottomCTA() {
  const router = useRouter();

  return (
    <section className="w-full py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-tr from-slate-900 via-blue-900 to-purple-900 relative overflow-hidden">
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.3)_0,transparent_60%)]" />
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <motion.h3
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-3xl sm:text-4xl font-bold text-white"
        >
          Ready to activate your CoinBox membership?
        </motion.h3>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-slate-300 mt-4"
        >
          Choose a tier, fund your security deposit, and start trading, borrowing, and earning commissions with a single wallet.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-8 flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button
            size="lg"
            onClick={() => router.push('/auth')}
            className="px-8 py-6 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg shadow-blue-500/50 transition-all duration-300 hover:scale-105"
          >
            Sign Up
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => router.push('/auth')}
            className="px-8 py-6 text-lg bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white hover:bg-white/20 transition-all duration-300 hover:scale-105"
          >
            Sign In
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
