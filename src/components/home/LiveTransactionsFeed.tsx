'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { ArrowRight, TrendingUp, Send } from 'lucide-react';

interface Transaction {
  id: string;
  senderName: string;
  action: string;
  amount?: string;
  receiverName?: string;
  timestamp: Date;
}

export default function LiveTransactionsFeed() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Try to listen to real transactions
    try {
      const transactionsRef = collection(db, 'transactions');
      const q = query(
        transactionsRef,
        orderBy('timestamp', 'desc'),
        limit(5)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const txs: Transaction[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            // Only use safe, public fields
            if (data.senderFirstName || data.senderName) {
              txs.push({
                id: doc.id,
                senderName: data.senderFirstName || data.senderName?.split(' ')[0] || 'User',
                action: data.type === 'transfer' ? 'Sent' : data.type === 'receive' ? 'Received' : 'Bought tokens',
                amount: data.amount ? `R${data.amount}` : undefined,
                receiverName: data.receiverFirstName || data.receiverName?.split(' ')[0],
                timestamp: data.timestamp?.toDate() || new Date()
              });
            }
          });

          if (txs.length > 0) {
            setTransactions(txs);
          } else {
            // Fallback to mock data if no real transactions
            setFallbackData();
          }
          setIsLoading(false);
        },
        (error) => {
          console.error('Error fetching transactions:', error);
          setFallbackData();
          setIsLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up transaction listener:', error);
      setFallbackData();
      setIsLoading(false);
    }
  }, []);

  const setFallbackData = () => {
    setTransactions([
      { id: '1', senderName: 'John', action: 'Sent', amount: 'R50', receiverName: 'Sarah', timestamp: new Date() },
      { id: '2', senderName: 'Michael', action: 'Received', amount: 'R120', timestamp: new Date() },
      { id: '3', senderName: 'Thabo', action: 'Bought tokens', timestamp: new Date() },
      { id: '4', senderName: 'Emma', action: 'Sent', amount: 'R200', receiverName: 'David', timestamp: new Date() },
      { id: '5', senderName: 'Sarah', action: 'Received', amount: 'R75', timestamp: new Date() }
    ]);
  };

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (transactions.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % transactions.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [transactions.length]);

  const getActionIcon = (action: string) => {
    if (action.includes('Sent')) return Send;
    if (action.includes('Received')) return TrendingUp;
    return ArrowRight;
  };

  if (isLoading) {
    return (
      <section className="w-full py-20 px-4 sm:px-6 lg:px-8 bg-slate-900">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-800 rounded w-64 mx-auto mb-4" />
            <div className="h-4 bg-slate-800 rounded w-48 mx-auto" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full py-20 px-4 sm:px-6 lg:px-8 bg-slate-900 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.05)_1px,transparent_1px)] bg-[size:3rem_3rem]" />
      
      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-4">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-blue-400">Live Activity</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            Real-Time <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Transactions</span>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            See what&apos;s happening on the CoinBox platform right now
          </p>
        </motion.div>

        <div className="relative">
          {/* Transaction feed container */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 shadow-2xl">
            <div className="space-y-4 min-h-[300px] flex flex-col justify-center">
              <AnimatePresence mode="wait">
                {transactions.slice(0, 5).map((tx, idx) => {
                  const Icon = getActionIcon(tx.action);
                  const isVisible = idx === currentIndex;
                  
                  return (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, x: -50, scale: 0.9 }}
                      animate={{
                        opacity: isVisible ? 1 : 0.3,
                        x: 0,
                        scale: isVisible ? 1 : 0.95,
                        y: isVisible ? 0 : idx < currentIndex ? -20 : 20
                      }}
                      exit={{ opacity: 0, x: 50, scale: 0.9 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-300 ${
                        isVisible 
                          ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-2 border-blue-500/50 shadow-lg shadow-blue-500/20' 
                          : 'bg-slate-800/30 border border-slate-700/50'
                      }`}
                    >
                      <div className={`p-3 rounded-full ${
                        isVisible 
                          ? 'bg-blue-500/20 shadow-lg shadow-blue-500/30' 
                          : 'bg-slate-700/50'
                      }`}>
                        <Icon className={`w-5 h-5 ${isVisible ? 'text-blue-400' : 'text-slate-500'}`} />
                      </div>
                      
                      <div className="flex-1">
                        <p className={`font-medium ${isVisible ? 'text-white' : 'text-slate-400'}`}>
                          <span className="font-bold">{tx.senderName}</span>
                          {' • '}
                          {tx.action}
                          {tx.amount && (
                            <>
                              {' '}
                              <span className={isVisible ? 'text-blue-400' : 'text-slate-500'}>{tx.amount}</span>
                            </>
                          )}
                          {tx.receiverName && (
                            <>
                              {' to '}
                              <span className="font-bold">{tx.receiverName}</span>
                            </>
                          )}
                        </p>
                        <p className="text-xs text-slate-500">
                          {tx.timestamp.toLocaleTimeString()}
                        </p>
                      </div>

                      {isVisible && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
                        />
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Pagination dots */}
            <div className="flex justify-center gap-2 mt-6">
              {transactions.slice(0, 5).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    idx === currentIndex 
                      ? 'bg-blue-500 w-8' 
                      : 'bg-slate-600 hover:bg-slate-500'
                  }`}
                  aria-label={`View transaction ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Decorative elements */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute -top-10 -left-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"
          />
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 5, repeat: Infinity }}
            className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"
          />
        </div>
      </div>
    </section>
  );
}
