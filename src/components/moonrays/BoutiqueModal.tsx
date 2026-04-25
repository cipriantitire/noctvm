'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { MoonraysAsset, ProfileAsset } from '@/types/moonrays';
import { 
  ShoppingBagIcon, 
  SparklesIcon, 
  MoonIcon, 
  StarIcon, 
  ChevronRightIcon, 
  CheckCircle2Icon,
  ShoppingBasketIcon,
  XIcon
} from 'lucide-react';
import { PocketModal } from './PocketModal';

export const BoutiqueModal = ({ isOpen, onClose, pocketBalance }: { isOpen: boolean, onClose: () => void, pocketBalance: number }) => {
  const [assets, setAssets] = useState<MoonraysAsset[]>([]);
  const [inventory, setInventory] = useState<ProfileAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const fetchBoutique = async () => {
    try {
      const { data: assetsData } = await supabase.from('moonrays_assets').select('*').eq('is_active', true);
      const { data: invData } = await supabase.from('profile_assets').select('*').eq('status', 'active');
      
      if (assetsData) setAssets(assetsData);
      if (invData) setInventory(invData);
    } catch (err) {
      console.error('Error fetching boutique:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchBoutique();
  }, [isOpen]);

  const handlePurchase = async (asset: MoonraysAsset) => {
    if (pocketBalance < asset.cost) return;
    setPurchasing(asset.id);
    try {
      const { data, error } = await supabase.rpc('purchase_moonrays_asset', { p_asset_id: asset.id });
      if (error) throw error;
      if (data.success) {
        await fetchBoutique();
      } else {
        alert(data.error || 'Purchase failed');
      }
    } catch (err) {
      console.error('Purchase error:', err);
    } finally {
      setPurchasing(null);
    }
  };

  const handleEquip = async (profileAssetId: string) => {
    try {
      const { data, error } = await supabase.rpc('equip_moonrays_asset', { p_profile_asset_id: profileAssetId });
      if (error) throw error;
      if (data.success) await fetchBoutique();
    } catch (err) {
      console.error('Equip error:', err);
    }
  };

  const isOwned = (assetId: string) => inventory.some(i => i.asset_id === assetId);
  const getInventoryItem = (assetId: string) => inventory.find(i => i.asset_id === assetId);

  return (
    <PocketModal isOpen={isOpen} onClose={onClose} title="Digital Identity Boutique">
      <div className="space-y-8 py-2">
        {/* ── Category: Profile Vibes ───────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <SparklesIcon className="w-4 h-4 text-noctvm-gold" />
            <h3 className="text-xs font-heading font-black text-foreground uppercase tracking-widest">Atmospheres</h3>
          </div>

          {loading ? (
             <div className="grid grid-cols-1 gap-3">
               {[1, 2].map(i => (
                 <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse border border-white/5" />
               ))}
             </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {assets.map((asset) => {
                const invItem = getInventoryItem(asset.id);
                const owned = !!invItem;
                const canAfford = pocketBalance >= asset.cost;

                return (
                  <motion.div 
                    key={asset.id}
                    layout
                    className="group relative overflow-hidden rounded-3xl p-5 bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-all"
                  >
                    {/* Liquid Highlight Effect if owned */}
                    {owned && invItem.is_equipped && (
                      <div className="absolute inset-0 bg-noctvm-violet/10 backdrop-blur-sm pointer-events-none" />
                    )}

                    <div className="relative z-10 flex items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-noctvm-black/40 border border-white/5 flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform">
                          {asset.type === 'profile_background' ? '🌌' : asset.type === 'story_frame' ? '🖼️' : '✨'}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-foreground truncate">{asset.name}</h4>
                          <p className="text-noctvm-caption text-noctvm-silver/50 font-mono mt-0.5 uppercase tracking-wide">
                            {asset.type.replace('_', ' ')}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        {owned ? (
                          <button
                            onClick={() => !invItem.is_equipped && handleEquip(invItem.id)}
                            className={`px-4 py-1.5 rounded-full text-noctvm-caption font-black uppercase tracking-widest transition-all ${
                              invItem.is_equipped 
                                ? 'bg-noctvm-emerald/20 text-noctvm-emerald border border-noctvm-emerald/30' 
                                : 'bg-white/10 text-foreground border border-white/10 hover:bg-noctvm-violet hover:border-noctvm-violet'
                            }`}
                          >
                            {invItem.is_equipped ? 'Equipped' : 'Equip'}
                          </button>
                        ) : (
                          <button
                            disabled={!canAfford || purchasing === asset.id}
                            onClick={() => handlePurchase(asset)}
                            className={`px-5 py-2 rounded-full text-noctvm-caption font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                              canAfford 
                                ? 'bg-noctvm-violet text-foreground shadow-lg shadow-noctvm-violet/20 hover:scale-105 active:scale-[0.96]' 
                                : 'bg-white/5 text-noctvm-silver/40 border border-white/5 cursor-not-allowed'
                            }`}
                          >
                            {purchasing === asset.id ? (
                               <div className="w-3 h-3 border-2 border-white/50 border-t-transparent animate-spin rounded-full" />
                            ) : (
                              <>
                                <ShoppingBasketIcon className="w-3 h-3" />
                                {asset.cost} <span className="text-noctvm-xs font-mono">MR</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>

        {/* 🛍️ Boutique Status Footer ─────────────────────── */}
        <div className="pt-4 border-t border-white/5 flex items-center justify-between text-noctvm-micro text-noctvm-silver/40 font-mono uppercase italic tracking-widest">
           <span>Stock: {assets.length} Assets Available</span>
           <span className="flex items-center gap-1">
             Your Pocket: <span className="text-noctvm-violet font-bold">{pocketBalance.toLocaleString()} MR</span>
           </span>
        </div>
      </div>
    </PocketModal>
  );
};
