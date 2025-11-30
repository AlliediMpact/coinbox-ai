'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, Lock, Activity, Clock3 } from 'lucide-react';

const items = [
  {
    icon: ShieldCheck,
    title: 'Bank-grade security',
    body: 'End-to-end encryption and multi-factor protection on every account.',
  },
  {
    icon: Lock,
    title: 'Regulatory alignment',
    body: 'Designed with KYC, AML, and local compliance in mind.',
  },
  {
    icon: Activity,
    title: 'Always monitored',
    body: '24/7 risk and fraud monitoring across all transactions.',
  },
  {
    icon: Clock3,
    title: '99.98% uptime',
    body: 'Resilient infrastructure with continuous performance tracking.',
  },
];

export default function TrustStrip() {
  return (
    <section id="security" className="w-full py-14 px-4 sm:px-6 lg:px-8 bg-slate-900 border-y border-slate-800">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        <motion.div
          initial={{ opacity: 0.9, y: 6 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-4"
        >
          <div>
            <p className="uppercase tracking-[0.2em] text-xs text-emerald-400 mb-2">Security & trust</p>
            <h2 className="text-2xl sm:text-3xl font-semibold text-white">
              Built like critical financial infrastructure
            </h2>
          </div>
          <p className="text-sm text-slate-300 max-w-md">
            CoinBox combines modern UX with strict security controls so you never have to choose between speed and safety.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0.85, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-5 flex gap-3 items-start"
            >
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/40">
                <item.icon className="w-4 h-4 text-emerald-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white mb-1">{item.title}</p>
                <p className="text-xs text-slate-300 leading-relaxed">{item.body}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
