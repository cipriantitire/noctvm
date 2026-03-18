export type MoonraysRank = 'Bronze Voyager' | 'Silver Pulse' | 'Gold Eclipse' | 'Platinum Aura' | 'Diamond Night-Owl' | 'MASTERY';

export interface RankInfo {
  name: MoonraysRank;
  level: number;
  minPoints: number;
  nextRankName: MoonraysRank | null;
  nextRankGoal: number | null;
  color: string;
  glowColor: string;
  perks: string[];
}

export const MOONRAYS_RANKS: Record<MoonraysRank, RankInfo> = {
  'Bronze Voyager': {
    name: 'Bronze Voyager',
    level: 1,
    minPoints: 0,
    nextRankName: 'Silver Pulse',
    nextRankGoal: 5000,
    color: 'from-orange-400 to-amber-700',
    glowColor: 'rgba(251, 146, 60, 0.4)',
    perks: ['Basic Profile Customization', 'Referral Access']
  },
  'Silver Pulse': {
    name: 'Silver Pulse',
    level: 2,
    minPoints: 5000,
    nextRankName: 'Gold Eclipse',
    nextRankGoal: 25000,
    color: 'from-slate-300 to-slate-500',
    glowColor: 'rgba(148, 163, 184, 0.4)',
    perks: ['Silver Profile Badge', 'Priority Support']
  },
  'Gold Eclipse': {
    name: 'Gold Eclipse',
    level: 3,
    minPoints: 25000,
    nextRankName: 'Platinum Aura',
    nextRankGoal: 100000,
    color: 'from-yellow-300 to-amber-500',
    glowColor: 'rgba(253, 224, 71, 0.4)',
    perks: ['Gold "Verified" Badge', 'Priority Guestlist Requests']
  },
  'Platinum Aura': {
    name: 'Platinum Aura',
    level: 4,
    minPoints: 100000,
    nextRankName: 'Diamond Night-Owl',
    nextRankGoal: 300000,
    color: 'from-cyan-300 to-blue-500',
    glowColor: 'rgba(103, 232, 249, 0.4)',
    perks: ['Platinum Glow Effect', 'Early Event Access']
  },
  'Diamond Night-Owl': {
    name: 'Diamond Night-Owl',
    level: 5,
    minPoints: 300000,
    nextRankName: 'MASTERY',
    nextRankGoal: null,
    color: 'from-indigo-400 to-purple-600',
    glowColor: 'rgba(129, 140, 248, 0.4)',
    perks: ['Diamond "Founder" Badge', 'Exclusive VIP Invites']
  },
  'MASTERY': {
    name: 'MASTERY',
    level: 6,
    minPoints: 1000000,
    nextRankName: null,
    nextRankGoal: null,
    color: 'from-violet-600 to-fuchsia-600',
    glowColor: 'rgba(139, 92, 246, 0.6)',
    perks: ['God Tier Status', 'Platform Governance']
  }
};

export interface MoonraysWallet {
  id: string;
  user_id: string;
  balance: number;
  net_earned: number;
  net_burned: number;
  status: 'active' | 'locked' | 'suspended';
}

export interface MoonraysAsset {
  id: string;
  name: string;
  asset_code: string;
  type: 'profile_background' | 'story_frame' | 'post_effect';
  cost: number;
  metadata: any;
  duration_days: number | null;
}

export interface ProfileAsset {
  id: string;
  user_id: string;
  asset_id: string;
  status: 'active' | 'expired' | 'revoked';
  expires_at: string | null;
  is_equipped: boolean;
}
