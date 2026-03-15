import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { UserIcon, ShieldCheckIcon, SearchIcon, EditIcon, TrashIcon, CheckIcon, XIcon } from '@/components/icons';
import Image from 'next/image';
import VerifiedBadge from '@/components/VerifiedBadge';

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

  if (loading) return <div className="p-12 text-center text-noctvm-silver font-mono animate-pulse text-xs uppercase tracking-widest">Loading Users...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Users</h2>
          <p className="text-noctvm-silver text-[10px] font-mono uppercase tracking-widest mt-1 opacity-60">Manage authorized accounts</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-noctvm-silver/40" />
            <input 
              type="text"
              placeholder="Search by name, email, or username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs focus:border-noctvm-violet/50 outline-none transition-all w-80 font-mono uppercase tracking-widest"
            />
          </div>
          <div className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-mono text-noctvm-silver uppercase tracking-widest">
            Count: <span className="text-white font-bold">{users.length}</span>
          </div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden frosted-noise shadow-xl">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-noctvm-silver font-bold font-mono">User Details</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-noctvm-silver font-bold font-mono">Role</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-noctvm-silver font-bold font-mono">Verification</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-noctvm-silver font-bold font-mono">Created</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-noctvm-silver font-bold font-mono text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-white/10 shadow-lg">
                        {user.avatar_url ? (
                          <Image 
                            src={user.avatar_url} 
                            alt={user.display_name || 'User'} 
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        ) : (
                          <div className="w-full h-full bg-white/5 flex items-center justify-center">
                            <UserIcon className="w-5 h-5 text-noctvm-violet/40" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-bold text-white tracking-tight text-sm truncate">
                            {user.display_name || user.username || 'Anonymous'}
                          </span>
                          {user.role === 'admin' && (
                            <span className="text-[7px] px-1 py-0.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded uppercase font-black tracking-widest">Admin</span>
                          )}
                        </div>
                        <p className="text-[9px] font-mono text-noctvm-silver/40 uppercase tracking-widest truncate">{user.email || 'NO_EMAIL'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <select 
                      value={user.role}
                      onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                      disabled={updatingId === user.id}
                      title="Update User Role"
                      className="bg-transparent text-[9px] font-bold py-1 px-2 rounded-lg border border-white/5 hover:border-noctvm-violet/30 focus:outline-none cursor-pointer uppercase font-mono tracking-widest text-noctvm-violet transition-all"
                    >
                      <option value="user" className="bg-noctvm-black">User</option>
                      <option value="owner" className="bg-noctvm-black">Owner</option>
                      <option value="admin" className="bg-noctvm-black">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleToggleVerified(user.id, user.is_verified)}
                        disabled={updatingId === user.id}
                        className={`flex items-center gap-2 px-2 py-1 rounded-lg border transition-all ${
                          user.is_verified 
                            ? 'bg-noctvm-emerald/10 text-noctvm-emerald border-noctvm-emerald/20' 
                            : 'bg-white/5 text-noctvm-silver border-white/10 opacity-40 hover:opacity-100'
                        }`}
                      >
                        <span className="text-[9px] font-bold uppercase font-mono tracking-widest">
                          {user.is_verified ? 'Verified' : 'Verify'}
                        </span>
                      </button>

                      {user.is_verified && (
                        <select 
                          value={user.badge || 'none'}
                          onChange={(e) => handleUpdateBadge(user.id, e.target.value)}
                          disabled={updatingId === user.id}
                          title="Update User Badge"
                          className="bg-transparent text-[9px] font-bold py-1 px-1 rounded-lg hover:bg-white/5 focus:outline-none cursor-pointer uppercase font-mono tracking-widest text-noctvm-gold"
                        >
                          <option value="none" className="bg-noctvm-black">None</option>
                          <option value="blue" className="bg-noctvm-black">Blue</option>
                          <option value="gold" className="bg-noctvm-black">Gold</option>
                        </select>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-[10px] font-mono text-noctvm-silver/60">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString('en-GB') : '---'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <button 
                        className="p-2 rounded-xl text-noctvm-silver/30 hover:text-white hover:bg-white/5 transition-all"
                        title="Edit User"
                        onClick={() => {/* Show improved edit modal */}}
                      >
                        <EditIcon className="w-4 h-4" />
                      </button>
                      <button 
                        className="p-2 rounded-xl text-noctvm-silver/30 hover:text-noctvm-rose hover:bg-noctvm-rose/5 transition-all"
                        title="Delete User"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this user? This action is permanent.')) {
                            // handle delete
                          }
                        }}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-noctvm-silver/40 italic font-mono uppercase tracking-widest text-xs">
                    No users matching criteria found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
