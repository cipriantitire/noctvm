'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import VerifiedBadge from '@/components/VerifiedBadge';
import { UserIcon, SearchIcon, TrashIcon, CheckIcon, XIcon, ShieldCheckIcon } from '@/components/icons';
import Image from 'next/image';

export default function UserTable() {
  const { profile: adminProfile } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setUsers(data);
    setLoading(false);
  }

  const handleUpdateRole = async (userId: string, role: string) => {
    setUpdatingId(userId);
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId);
    
    if (!error) {
      setUsers(users.map(u => u.id === userId ? { ...u, role } : u));
    }
    setUpdatingId(null);
  };

  const handleToggleVerified = async (userId: string, currentStatus: boolean) => {
    setUpdatingId(userId);
    const { error } = await supabase
      .from('profiles')
      .update({ is_verified: !currentStatus })
      .eq('id', userId);
    
    if (!error) {
      setUsers(users.map(u => u.id === userId ? { ...u, is_verified: !currentStatus } : u));
    }
    setUpdatingId(null);
  };

  const handleUpdateBadge = async (userId: string, badge: string) => {
    setUpdatingId(userId);
    const { error } = await supabase
      .from('profiles')
      .update({ badge })
      .eq('id', userId);
    
    if (!error) {
      setUsers(users.map(u => u.id === userId ? { ...u, badge } : u));
    }
    setUpdatingId(null);
  };

  const filteredUsers = users.filter(u => 
    u.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="p-12 text-center text-noctvm-silver font-mono animate-pulse">SYNCHRONIZING USER DATABASE...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div>
          <h2 className="text-3xl font-heading font-black tracking-tighter italic uppercase text-white">Identity Control</h2>
          <p className="text-noctvm-silver text-xs font-mono uppercase tracking-[0.2em] mt-1 opacity-60">Manage authorized access and credentials</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative flex-1 min-w-[300px] group">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-noctvm-silver group-focus-within:text-noctvm-violet transition-colors z-10" />
            <input 
              type="text"
              placeholder="Filter by Name, Email, or Signal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-noctvm-violet/50 focus:bg-white/10 transition-all font-mono text-[10px] uppercase tracking-widest text-white frosted-noise"
            />
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-noctvm-silver uppercase tracking-widest bg-white/5 px-4 py-3 rounded-2xl border border-white/10 frosted-noise">
            <span className="opacity-40">Records:</span>
            <span className="text-white font-black">{users.length}</span>
          </div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-[32px] overflow-hidden frosted-noise shadow-2xl">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] text-white font-black font-mono">User Identity</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] text-white font-black font-mono">Access Level</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] text-white font-black font-mono">Certification</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] text-white font-black font-mono">Deployed At</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] text-white font-black font-mono text-right">System Override</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="group hover:bg-noctvm-violet/5 transition-all duration-300">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-noctvm-violet/30 group-hover:scale-110 shadow-xl transition-all duration-500 overflow-hidden">
                          {user.avatar_url ? (
                            <Image 
                              src={user.avatar_url} 
                              alt={user.display_name || 'User'} 
                              width={56} 
                              height={56} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <UserIcon className="w-6 h-6 text-noctvm-violet" />
                          )}
                        </div>
                        {user.is_verified && (
                          <div className="absolute -bottom-1 -right-1 z-10 animate-bounce-subtle">
                            <VerifiedBadge type={user.badge} size="sm" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-white tracking-tight text-lg group-hover:text-noctvm-violet transition-colors truncate">
                            {user.display_name || user.username || 'Anonymous'}
                          </span>
                          {user.role === 'admin' && (
                            <span className="text-[8px] px-1.5 py-0.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-md uppercase font-black tracking-[0.2em]">Root</span>
                          )}
                        </div>
                        <p className="text-[10px] font-mono text-noctvm-silver/40 uppercase tracking-widest truncate">{user.email || 'no-signal@noctvm.io'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <select 
                      value={user.role}
                      onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                      disabled={updatingId === user.id}
                      title="Update User Role"
                      className="bg-white/5 text-[9px] font-black py-2 px-4 rounded-xl border border-white/10 focus:outline-none focus:border-noctvm-violet/40 cursor-pointer uppercase font-mono tracking-widest text-noctvm-violet hover:bg-white/10 transition-all appearance-none"
                    >
                      <option value="user" className="bg-noctvm-black">STANDARD_USER</option>
                      <option value="owner" className="bg-noctvm-black">VENUE_OWNER</option>
                      <option value="admin" className="bg-noctvm-black">SYSTEM_ADMIN</option>
                    </select>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => handleToggleVerified(user.id, user.is_verified)}
                        disabled={updatingId === user.id}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                          user.is_verified 
                            ? 'bg-noctvm-emerald/10 text-noctvm-emerald border-noctvm-emerald/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
                            : 'bg-white/5 text-noctvm-silver border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${user.is_verified ? 'bg-noctvm-emerald shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse' : 'bg-noctvm-silver/20'}`}></div>
                        <span className="text-[9px] font-black uppercase font-mono tracking-widest">
                          {user.is_verified ? 'Certified' : 'Unverified'}
                        </span>
                      </button>

                      {user.is_verified && (
                        <select 
                          value={user.badge}
                          onChange={(e) => handleUpdateBadge(user.id, e.target.value)}
                          disabled={updatingId === user.id}
                          title="Update User Badge"
                          className="bg-transparent text-[9px] font-black py-1 px-1 rounded-lg hover:bg-white/5 focus:outline-none cursor-pointer uppercase font-mono tracking-widest text-noctvm-gold"
                        >
                          <option value="none" className="bg-noctvm-black">BASIC_BADGE</option>
                          <option value="blue" className="bg-noctvm-black">BLUE_BADGE</option>
                          <option value="gold" className="bg-noctvm-black">GOLD_BADGE</option>
                        </select>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-white/80 font-mono tracking-tighter">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString('en-GB') : 'UNKNOWN'}
                      </span>
                      <span className="text-[8px] font-mono text-noctvm-silver/30 uppercase tracking-[0.2em]">Origin Timestamp</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                      <button 
                        className="p-3 rounded-2xl bg-white/5 text-noctvm-silver border border-white/5 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all shadow-inner"
                        title="Extended Diagnostics"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h.01M12 12h.01M15 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                      <button 
                        className="p-3 rounded-2xl bg-white/5 text-noctvm-silver border border-white/5 hover:text-noctvm-rose hover:bg-noctvm-rose/5 hover:border-noctvm-rose/20 transition-all shadow-inner"
                        title="Purge Asset"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && (
          <div className="py-32 text-center">
            <div className="text-5xl mb-6 grayscale opacity-20 filter drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">🕵️‍♂️</div>
            <p className="text-noctvm-silver font-mono uppercase tracking-[0.4em] text-xs">NO_IDENTITY_MATCHES_DETECTED</p>
          </div>
        )}
      </div>
    </div>
  );
}
