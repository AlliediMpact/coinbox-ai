'use client';

import { motion } from 'framer-motion';
import { UserPlus, CreditCard, Send, CheckCircle2 } from 'lucide-react';

const steps = [
  {
    icon: UserPlus,
    title: 'Create your CoinBox wallet',
    body: 'Sign up in minutes with basic details and secure verification.',
  },
  {
    icon: CreditCard,
    title: 'Fund instantly',
    body: 'Top up from your bank or card with transparent fees.',
  },
  {
    icon: Send,
    title: 'Send & receive globally',
    body: 'Move money between friends, family, or teams in real time.',
  },
  {
    icon: CheckCircle2,
    title: 'Cash out with confidence',
    body: 'Withdraw to local accounts with full history and receipts.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="w-full py-20 px-4 sm:px-6 lg:px-8 bg-slate-950">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0.85, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <p className="uppercase tracking-[0.2em] text-xs text-blue-400 mb-3">How it works</p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            From sign up to settlement
          </h2>
          <p className="text-slate-300 max-w-2xl mx-auto">
            A clear, three-step flow so you always know what happens next.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0.85, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.05 }}
              className="relative rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/80 to-slate-950/80 p-6 flex flex-col gap-4 shadow-[0_18px_60px_rgba(15,23,42,0.7)]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-500/20 border border-blue-500/30">
                    <step.icon className="w-5 h-5 text-blue-300" />
                  </div>
                  <p className="text-sm font-semibold text-slate-200">Step {index + 1}</p>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{step.body}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
