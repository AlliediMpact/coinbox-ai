'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import AuthPage from '@/app/auth/page';
import SignUpWizard from '@/components/home/SignUpWizard';

interface AuthModalProps {
  openLogin: boolean;
  openSignup: boolean;
  onCloseLogin: () => void;
  onCloseSignup: () => void;
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 260, damping: 24 },
  },
  exit: { opacity: 0, y: 30, scale: 0.96 },
};

export default function AuthModal({
  openLogin,
  openSignup,
  onCloseLogin,
  onCloseSignup,
}: AuthModalProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const show = (openLogin || openSignup) && isClient;

  const handleClose = () => {
    if (openSignup) onCloseSignup();
    if (openLogin) onCloseLogin();
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-xl mx-4"
          >
            {/* Gradient frame */}
            <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 opacity-80" />

            {/* Card */}
            <div className="relative rounded-3xl bg-slate-950/95 border border-white/10 shadow-2xl overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.35),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(139,92,246,0.35),_transparent_55%)] opacity-70" />

              <div className="relative p-6 sm:p-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-blue-300/80 mb-1">
                      CoinBox Connect
                    </p>
                    <h2 className="text-xl sm:text-2xl font-semibold text-white">
                      {openSignup ? 'Create your CoinBox membership' : 'Welcome back to CoinBox'}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300/90 mt-1 max-w-md">
                      {openSignup
                        ? 'Complete your secure account setup and choose the membership tier that matches how you want to trade, lend and borrow.'
                        : 'Sign in to manage your wallet, trades, referrals and security from one unified dashboard.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="ml-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-slate-200 hover:bg-white/20 transition"
                    aria-label="Close auth dialog"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Content area */}
                <div className="mt-4 bg-slate-950/60 rounded-2xl border border-white/5 p-4 sm:p-5 max-h-[70vh] overflow-y-auto">
                  {openSignup ? <SignUpWizard /> : <AuthPage />}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
