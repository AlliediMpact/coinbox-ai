'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, Zap, Globe2, History } from 'lucide-react';

export default function WhyCoinBox() {
  const items = [
    { icon: ShieldCheck, title: 'Regulated mindset', text: 'Designed around FSCA & SARB-aligned KYC and audit trails.' },
    { icon: Zap, title: 'Tiered earnings', text: 'Membership tiers that scale your limits and referral commissions.' },
    { icon: Globe2, title: 'P2P first', text: 'Invest or borrow directly with peers using coin-based tickets.' },
    { icon: History, title: 'Transparent fees', text: 'Clear admin, transaction, and interest fees on every trade.' }
  ];

  return (
    <section className="w-full py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0.85, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900">
            Why <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">CoinBox</span>
          </h2>
          <p className="text-slate-600 mt-3">A regulated-first P2P marketplace for lending, borrowing, and earning.</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0.9, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: idx * 0.08 }}
              className="rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 border">
                  <item.icon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <p className="text-sm text-slate-600">{item.text}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
