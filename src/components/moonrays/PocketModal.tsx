'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon } from 'lucide-react';

interface PocketModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const PocketModal = ({ isOpen, onClose, title, children }: PocketModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-noctvm-black/80 backdrop-blur-md z-modal"
          />
          
          {/* Modal Container */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="fixed bottom-0 left-0 right-0 max-w-2xl mx-auto z-modal bg-noctvm-midnight border-t border-white/10 rounded-t-[32px] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
              <h3 className="font-heading text-lg font-bold text-foreground uppercase tracking-wider">{title}</h3>
              <button 
                onClick={onClose}
                aria-label="Close modal"
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <XIcon className="w-5 h-5 text-noctvm-silver" />
              </button>
            </div>

            {/* Content Area */}
            <div className="p-6 overflow-y-auto max-h-[80vh] no-scrollbar pb-24">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
