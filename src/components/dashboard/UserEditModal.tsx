import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { XIcon, SearchIcon, CheckIcon } from '@/components/icons';
import Image from 'next/image';
import { useCallback } from 'react';

interface UserEditModalProps {
  user: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UserEditModal({ user, onClose, onSuccess }: UserEditModalProps) {
  const [allVenues, setAllVenues] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [assignedVenueIds, setAssignedVenueIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    // Fetch all venues
    const { data: venues } = await supabase.from('venues').select('id, name, city');
    if (venues) setAllVenues(venues);

    // Fetch venues currently owned by this user
    const { data: owned } = await supabase.from('venues').select('id').eq('owner_id', user.id);
    if (owned) setAssignedVenueIds(owned.map(v => v.id));
    
    setLoading(false);
  }, [user.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggleVenue = async (venueId: string) => {
    if (assignedVenueIds.includes(venueId)) {
      setAssignedVenueIds(prev => prev.filter(id => id !== venueId));
    } else {
      setAssignedVenueIds(prev => [...prev, venueId]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    
    // First, remove ownership from venues that were unselected (if they were owned by this user)
    // Actually, simple way: reset all venues where owner_id = user.id, then set for current IDs
    // But that might hit venues not in our current fetch if pagination was used.
    // For now, simple update:
    
    // Reset venues that were unselected
    const { data: currentOwned } = await supabase.from('venues').select('id').eq('owner_id', user.id);
    const currentlyOwnedIds = currentOwned?.map(v => v.id) || [];
    const idsToRemove = currentlyOwnedIds.filter(id => !assignedVenueIds.includes(id));
    
    if (idsToRemove.length > 0) {
      await supabase.from('venues').update({ owner_id: null }).in('id', idsToRemove);
    }
    
    // Assign new ones
    if (assignedVenueIds.length > 0) {
      await supabase.from('venues').update({ owner_id: user.id }).in('id', assignedVenueIds);
    }

    setSaving(false);
    onSuccess();
    onClose();
  };

  const filteredVenues = allVenues.filter(v => 
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-noctvm-black/90 border border-white/10 rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden frosted-noise">
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-xl bg-noctvm-violet/10 border border-noctvm-violet/20 flex items-center justify-center overflow-hidden">
                {user.avatar_url ? (
                  <Image src={user.avatar_url} alt="" width={40} height={40} className="object-cover" />
                ) : <span className="text-xl">👤</span>}
             </div>
             <div>
                <h3 className="text-lg font-bold text-white tracking-tight">{user.display_name || 'Edit User'}</h3>
                <p className="text-[10px] text-noctvm-silver/40 uppercase font-mono tracking-widest">{user.email}</p>
             </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-noctvm-silver"
            title="Close"
          >
             <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 bg-white/[0.02]">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-noctvm-silver/40" />
            <input 
              type="text"
              placeholder="Filter venues..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs focus:border-noctvm-violet/50 outline-none transition-all font-mono uppercase tracking-widest"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 no-scrollbar">
          {loading ? (
            <div className="p-12 text-center text-[10px] font-mono text-noctvm-silver/40 uppercase tracking-widest animate-pulse">Loading venues...</div>
          ) : filteredVenues.map(venue => (
            <button
              key={venue.id}
              onClick={() => handleToggleVenue(venue.id)}
              className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all group ${
                assignedVenueIds.includes(venue.id) 
                  ? 'bg-noctvm-violet/10 border border-noctvm-violet/20' 
                  : 'bg-transparent border border-transparent hover:bg-white/5'
              }`}
            >
              <div className="text-left">
                <p className={`text-sm font-bold transition-colors ${assignedVenueIds.includes(venue.id) ? 'text-white' : 'text-noctvm-silver'}`}>
                  {venue.name}
                </p>
                <p className="text-[9px] font-mono text-noctvm-silver/30 uppercase tracking-widest">{venue.city}</p>
              </div>
              <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                assignedVenueIds.includes(venue.id)
                  ? 'bg-noctvm-violet border-noctvm-violet text-white'
                  : 'border-white/10 text-transparent'
              }`}>
                <CheckIcon className="w-3.5 h-3.5" />
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 bg-white/[0.02] flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-xs font-bold uppercase tracking-widest text-noctvm-silver hover:bg-white/5 transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex-[2] px-4 py-2.5 rounded-xl bg-noctvm-violet text-white text-xs font-bold uppercase tracking-widest hover:bg-noctvm-violet/80 transition-all shadow-lg shadow-noctvm-violet/20 disabled:opacity-50"
          >
            {saving ? 'Syncing...' : 'Save Assignments'}
          </button>
        </div>
      </div>
    </div>
  );
}
