import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { UserIcon, ShieldCheckIcon, SearchIcon, EditIcon, TrashIcon, CheckIcon, XIcon } from '@/components/icons';
import Image from 'next/image';
import VerifiedBadge from '@/components/VerifiedBadge';
import { logActivity } from '@/lib/activity';

import UserEditModal from './UserEditModal';

import { useDashboard } from '@/contexts/DashboardContext';

export default function UserTable() {
  const { profile: adminProfile, refreshProfile } = useAuth();
  const { headerHidden } = useDashboard();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<any | null>(null);

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
      await logActivity({
        type: 'user_edit',
        message: `Updated role for ${userId} to ${role}`,
        entity_id: userId,
        user_name: 'Admin'
      });
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
      await logActivity({
        type: !currentStatus ? 'user_verify' : 'user_unverify',
        message: `${!currentStatus ? 'Verified' : 'Unverified'} user ${userId}`,
        entity_id: userId,
        user_name: 'Admin'
      });
      setUsers(users.map(u => u.id === userId ? { ...u, is_verified: !currentStatus } : u));
      if (userId === adminProfile?.id) refreshProfile();
    }
    setUpdatingId(null);
  };

  const handleUpdateBadge = async (userId: string, badge: string) => {
    setUpdatingId(userId);
    
    // Link badge to role
    let role = 'user';
    if (badge === 'admin') role = 'admin';
    else if (badge === 'owner') role = 'owner';

    const { error } = await supabase
      .from('profiles')
      .update({ badge, role })
      .eq('id', userId);
    
    if (error) {
      console.error('Error updating badge:', error);
      alert('Failed to update badge');
    } else {
      setUsers(users.map(u => u.id === userId ? { ...u, badge, role } : u));
      if (userId === adminProfile?.id) refreshProfile();
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
      {/* Title removed per request */}


      <div className={`sticky top-0 lg:top-0 z-30 lg:mt-0 mt-4 transition-transform duration-300 ease-in-out frosted-noise bg-noctvm-black/70 backdrop-blur-3xl rounded-2xl border border-noctvm-violet/15 p-3 shadow-xl flex flex-col sm:flex-row items-center gap-3 mx-2 ${headerHidden ? '-translate-y-[210%]' : 'translate-y-0'}`}>
        <div className="relative flex-1 w-full">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-noctvm-silver/40" />
          <input 
            type="text"
            placeholder="Search by name, email, or username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:border-noctvm-violet/50 outline-none transition-all w-full font-mono uppercase tracking-widest"
          />
        </div>
        <div className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-mono text-noctvm-silver uppercase tracking-widest flex items-center justify-center gap-2">
          User Count: <span className="text-white font-bold">{users.length}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20 px-2 mt-12">
        {filteredUsers.map((user) => (
          <div 
            key={user.id} 
            className="group relative bg-white/5 border border-white/10 rounded-[2rem] p-5 frosted-noise hover:bg-white/[0.08] hover:border-white/20 transition-all duration-500 shadow-xl overflow-hidden flex flex-col"
          >
            {/* Glossy Overlay */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-noctvm-violet/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-noctvm-violet/10 transition-colors duration-700"></div>

            <div className="relative z-10 mb-6">
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-2xl overflow-hidden border border-white/10 shadow-2xl group-hover:scale-105 transition-transform duration-500">
                  {user.avatar_url ? (
                    <Image 
                      src={user.avatar_url} 
                      alt={user.display_name || 'User'} 
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  ) : (
                    <div className="w-full h-full bg-white/5 flex items-center justify-center">
                      <UserIcon className="w-8 h-8 text-noctvm-violet/40" />
                    </div>
                  )}
                  {/* Status Indicator */}
                  <div className={`absolute bottom-1 right-1 w-3 h-3 rounded-full border-2 border-noctvm-black shadow-lg transition-colors ${
                    user.is_verified ? 'bg-noctvm-emerald' : 'bg-noctvm-gold animate-pulse'
                  }`}></div>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-white tracking-tight text-base truncate group-hover:text-noctvm-violet transition-colors">
                      {user.display_name || user.username || 'Anonymous'}
                    </h3>
                    <VerifiedBadge type={user.badge} size="xs" />
                  </div>
                  <p className="text-[10px] font-mono text-noctvm-silver/40 uppercase tracking-widest truncate">{user.email || 'NO_EMAIL'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 relative z-10 flex-1">
              {/* Account Status Toggle */}
              <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[9px] text-noctvm-silver/40 uppercase font-mono tracking-widest">Account Status</p>
                  <span className={`text-[7px] px-1.5 py-0.5 rounded font-black tracking-widest uppercase ${
                    user.is_verified 
                      ? 'bg-noctvm-emerald/10 text-noctvm-emerald border border-noctvm-emerald/20' 
                      : 'bg-noctvm-gold/10 text-noctvm-gold border border-noctvm-gold/20'
                  }`}>
                    {user.is_verified ? 'Verified' : 'Pending'}
                  </span>
                </div>
                <button
                  onClick={() => handleToggleVerified(user.id, user.is_verified)}
                  disabled={updatingId === user.id}
                  className={`w-full py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                    user.is_verified 
                      ? 'bg-noctvm-emerald text-white shadow-lg shadow-noctvm-emerald/20' 
                      : 'bg-white/5 text-noctvm-silver hover:text-white hover:bg-white/10 border border-white/10'
                  }`}
                  title={user.is_verified ? "Unverify User" : "Verify User"}
                >
                  {user.is_verified ? (
                    <><CheckIcon className="w-3 h-3" /> VERIFIED</>
                  ) : (
                    <><XIcon className="w-3 h-3" /> UNVERIFIED</>
                  )}
                </button>
              </div>



              {/* Access Level Management */}
              <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                <p className="text-[9px] text-noctvm-silver/40 uppercase font-mono tracking-widest mb-3">Access Level</p>
                <div className="flex items-center gap-3">
                   <select 
                    value={user.badge || 'none'}
                    onChange={(e) => handleUpdateBadge(user.id, e.target.value)}
                    disabled={updatingId === user.id}
                    title="Update Access Level"
                    className="flex-1 bg-noctvm-black/40 text-[10px] font-bold py-2 px-3 rounded-xl border border-white/5 hover:border-noctvm-violet/30 focus:outline-none cursor-pointer uppercase font-mono tracking-widest text-white transition-all appearance-none"
                  >
                    <option value="none">Regular</option>
                    <option value="owner">Owner</option>
                    <option value="admin">Admin</option>
                  </select>
                  <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                    <VerifiedBadge type={user.badge} size="sm" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between px-1">
                <div className="flex flex-col">
                  <p className="text-[8px] text-noctvm-silver/30 uppercase font-mono tracking-tighter">Joined Date</p>
                  <p className="text-[10px] font-mono text-noctvm-silver/60">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString('en-GB') : '---'}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => setEditingUser(user)}
                    title="Edit User"
                    className="p-2.5 rounded-xl text-noctvm-silver/40 hover:text-white hover:bg-white/10 border border-white/5 transition-all"
                  >
                    <EditIcon className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={async () => {
                      if (window.confirm('Are you absolutely sure you want to delete this user? This cannot be undone.')) {
                        setUpdatingId(user.id);
                        const { error } = await supabase.from('profiles').delete().eq('id', user.id);
                        if (!error) {
                          await logActivity({
                            type: 'user_delete',
                            message: `Deleted user: ${user.display_name || user.username}`,
                            entity_id: user.id,
                            user_name: 'Admin'
                          });
                          fetchUsers();
                        } else {
                          alert(error.message);
                        }
                        setUpdatingId(null);
                      }
                    }}
                    title="Delete User"
                    disabled={updatingId === user.id}
                    className="p-2.5 rounded-xl text-noctvm-silver/40 hover:text-noctvm-rose hover:bg-noctvm-rose/5 border border-white/5 transition-all disabled:opacity-30"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {filteredUsers.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
            <p className="text-noctvm-silver/40 italic font-mono uppercase tracking-widest text-xs">No users found</p>
          </div>
        )}
      </div>

      {editingUser && (
        <UserEditModal 
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSuccess={() => {
            fetchUsers();
          }}
        />
      )}
    </div>
  );
}
