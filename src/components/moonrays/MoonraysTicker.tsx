'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ClockIcon, MoonIcon, PlusIcon, MinusIcon } from 'lucide-react';

interface Transaction {
  id: string;
  amount: number;
  description: string;
  created_at: string;
  txn_type: 'CREDIT' | 'DEBIT';
}

export function MoonraysTicker() {
  const { user } = useAuth();
  const [txns, setTxns] = useState<Transaction[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchTxns = async () => {
      const { data, error } = await supabase
        .from('moonrays_ledger_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!error && data) setTxns(data);
    };

    fetchTxns();

    const channel = supabase
      .channel('ledger_realtime')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'moonrays_ledger_transactions',
        filter: `user_id=eq.${user.id}` 
      }, (payload) => {
        setTxns(prev => [payload.new as Transaction, ...prev].slice(0, 5));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  if (!user || txns.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-sm font-heading font-bold text-white uppercase tracking-widest opacity-40">Live Feed</h2>
        <span className="text-noctvm-caption font-mono text-noctvm-violet animate-pulse uppercase tracking-wider flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-noctvm-violet" />
          Real-time Nexus
        </span>
      </div>
      
      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {txns.map((txn) => (
            <motion.div
              key={txn.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              className="group flex items-center justify-between p-4 bg-white/[0.03] border border-white/5 rounded-2xl hover:bg-white/[0.05] transition-colors overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-noctvm-violet/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center gap-4 relative z-10">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border border-white/5 bg-black/40 shadow-inner`}>
                  {txn.txn_type === 'CREDIT' ? 
                    <MoonIcon className="w-5 h-5 text-noctvm-violet" /> : 
                    <MinusIcon className="w-5 h-5 text-red-500/60" />
                  }
                </div>
                <div>
                  <p className="text-xs font-semibold text-white/90">{txn.description}</p>
                  <p className="text-noctvm-caption text-noctvm-silver/40 font-mono mt-0.5 uppercase flex items-center gap-1">
                    <ClockIcon className="w-2.5 h-2.5" />
                    {new Date(txn.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <div className={`text-sm font-mono font-bold flex items-center gap-1 relative z-10 ${txn.txn_type === 'CREDIT' ? 'text-noctvm-violet' : 'text-noctvm-silver'}`}>
                {txn.txn_type === 'CREDIT' ? <PlusIcon className="w-3 h-3" /> : ''}
                {txn.amount}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}
