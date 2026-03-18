'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { MoonraysAsset } from '@/types/moonrays';

interface BoutiqueContextType {
  activePreview: MoonraysAsset | null;
  setPreview: (asset: MoonraysAsset | null) => void;
  purchaseAsset: (asset: MoonraysAsset) => Promise<{ success: boolean; error?: string }>;
  isPurchasing: boolean;
}

const BoutiqueContext = createContext<BoutiqueContextType | undefined>(undefined);

export function BoutiqueProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [activePreview, setActivePreview] = useState<MoonraysAsset | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const setPreview = useCallback((asset: MoonraysAsset | null) => {
    setActivePreview(asset);
  }, []);

  const purchaseAsset = useCallback(async (asset: MoonraysAsset) => {
    if (!user) return { success: false, error: 'Auth required' };
    
    setIsPurchasing(true);
    try {
      // 1. Dry run first
      const { data: dryRun, error: dryError } = await supabase.rpc('purchase_moonrays_asset', {
        p_asset_code: asset.asset_code,
        p_dry_run: true
      });

      if (dryError) throw dryError;
      if (!dryRun.success) return { success: false, error: dryRun.error };

      // 2. Actual purchase
      const { data: result, error: buyError } = await supabase.rpc('purchase_moonrays_asset', {
        p_asset_code: asset.asset_code,
        p_dry_run: false
      });

      if (buyError) throw buyError;
      
      if (result.success) {
        setActivePreview(null); // Clear preview on success
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (err: any) {
      console.error('Boutique error:', err);
      return { success: false, error: err.message || 'Purchase failed' };
    } finally {
      setIsPurchasing(false);
    }
  }, [user]);

  const value = useMemo(() => ({
    activePreview,
    setPreview,
    purchaseAsset,
    isPurchasing
  }), [activePreview, setPreview, purchaseAsset, isPurchasing]);

  return (
    <BoutiqueContext.Provider value={value}>
      {children}
    </BoutiqueContext.Provider>
  );
}

export function useBoutique() {
  const context = useContext(BoutiqueContext);
  if (context === undefined) {
    throw new Error('useBoutique must be used within a BoutiqueProvider');
  }
  return context;
}
