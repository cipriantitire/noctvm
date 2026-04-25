'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface Props {
  progress: number;
  color: string;
}

export const PrestigeProgressMotion = ({ progress, color }: Props) => {
  return (
    <div className="relative h-3 w-full overflow-hidden rounded-full bg-black/40 border border-white/10 backdrop-blur-md shadow-inner">
      {/* ── Base Fill Grow ─────────────────────────────── */}
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ 
          duration: 1.5,
          ease: "easeOut"
        }}
        className={`absolute inset-y-0 left-0 bg-gradient-to-r ${color} shadow-[0_0_20px_rgba(139,92,246,0.3)]`}
      >
        {/* ── Specular Sweep (Diagonal Shimmer) ──────────── */}
        <motion.div 
          animate={{ x: ["-100%", "200%"] }}
          transition={{ 
            duration: 3, 
            repeat: Infinity, 
            ease: "linear",
            repeatDelay: 0.5
          }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-1/2 -skew-x-12"
        />

        {/* ── Threshold Glow Pulse ────────────────────────── */}
        {progress > 90 && (
          <motion.div
            animate={{ opacity: [0.2, 0.6, 0.2] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-white/20 blur-sm"
          />
        )}
      </motion.div>
    </div>
  );
};
