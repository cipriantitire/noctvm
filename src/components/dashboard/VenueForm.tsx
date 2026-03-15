'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Venue } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';

interface VenueFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: Partial<Venue>;
}

export default function VenueForm({ onSuccess, onCancel, initialData }: VenueFormProps) {
  const { profile } = useAuth();
  const [formData, setFormData] = useState<Partial<Venue>>({
    name: '',
    address: '',
    city: 'Bucharest',
    description: '',
    genres: [],
    ...initialData
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from('venues')
      .upsert({
        ...formData,
        id: initialData?.id || undefined,
        owner_id: initialData?.owner_id || (initialData?.id ? undefined : profile?.id)
      });

    if (!error) onSuccess();
    else alert(error.message);
    setLoading(false);
  };

  const handleGenreChange = (genre: string) => {
    const currentGenres = formData.genres || [];
    if (currentGenres.includes(genre)) {
      setFormData({ ...formData, genres: currentGenres.filter(g => g !== genre) });
    } else {
      setFormData({ ...formData, genres: [...currentGenres, genre] });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-noctvm-black border border-white/10 rounded-3xl frosted-noise shadow-2xl relative overflow-hidden group">
      {/* Removed green tint gradient */}
      
      <div className="flex items-center justify-between border-b border-white/5 pb-4 relative z-10">
        <div>
          <h3 className="text-lg font-bold tracking-tight text-white uppercase">
            {initialData?.id ? 'Edit Venue' : 'Add New Venue'}
          </h3>
          <p className="text-[9px] font-mono text-noctvm-silver/40 uppercase tracking-widest mt-0.5">Venue Management</p>
        </div>
        <div className="flex gap-2">
          {initialData?.id && (
            <div className={`px-3 py-1 rounded-lg text-[8px] font-bold uppercase tracking-widest border transition-all ${
                formData.is_verified 
                  ? 'bg-noctvm-emerald/10 text-noctvm-emerald border-noctvm-emerald/20' 
                  : 'bg-white/5 text-noctvm-silver/40 border-white/10'
            }`}>
              {formData.is_verified ? 'Verified' : 'Pending'}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
        <div className="space-y-1.5">
          <label className="text-[9px] text-noctvm-silver/60 font-mono uppercase tracking-widest ml-1">Venue Name</label>
          <input
            required
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:border-noctvm-violet/50 outline-none transition-all font-bold tracking-tight text-white placeholder:text-white/10 frosted-noise text-sm"
            placeholder="Name..."
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[9px] text-noctvm-silver/60 font-mono uppercase tracking-widest ml-1">City</label>
          <div className="relative">
            <select
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:border-noctvm-violet/50 outline-none transition-all font-bold tracking-tight text-white appearance-none frosted-noise cursor-pointer uppercase text-sm"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value as any })}
              title="Select City"
            >
              <option value="Bucharest" className="bg-noctvm-black">Bucharest</option>
              <option value="Constanta" className="bg-noctvm-black">Constanta</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
        <div className="space-y-1.5">
          <label className="text-[9px] text-noctvm-silver/60 font-mono uppercase tracking-widest ml-1">Address</label>
          <input
            required
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:border-noctvm-violet/50 outline-none transition-all font-medium text-white/90 placeholder:text-white/10 frosted-noise text-xs"
            placeholder="Street address..."
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[9px] text-noctvm-silver/60 font-mono uppercase tracking-widest ml-1">Capacity</label>
          <input
            type="number"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:border-noctvm-violet/50 outline-none transition-all font-mono font-bold text-sm text-white frosted-noise"
            placeholder="Capacity"
            value={formData.capacity || ''}
            onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
          />
        </div>
      </div>

      <div className="space-y-3 relative z-10">
        <label className="text-[9px] text-noctvm-silver/60 font-mono uppercase tracking-widest ml-1">Genres</label>
        <div className="flex flex-wrap gap-1.5">
          {['Techno', 'House', 'Experimental', 'Electronic', 'Rock', 'Jazz', 'Live Music', 'Art'].map((genre) => (
            <button
              key={genre}
              type="button"
              onClick={() => handleGenreChange(genre)}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest border transition-all duration-300 ${
                formData.genres?.includes(genre)
                  ? 'bg-noctvm-violet text-white border-noctvm-violet shadow-lg shadow-noctvm-violet/20'
                  : 'bg-white/5 text-noctvm-silver border-white/10 hover:border-white/30 hover:text-white'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5 relative z-10">
        <label className="text-[9px] text-noctvm-silver/60 font-mono uppercase tracking-widest ml-1">Gallery (URLs)</label>
        <textarea
          rows={1}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:border-noctvm-violet/50 outline-none transition-all resize-none font-mono text-[9px] text-white/60 uppercase tracking-widest placeholder:text-white/10 frosted-noise"
          placeholder="https://..."
          value={(formData as any).gallery?.join(', ') || ''}
          onChange={(e) => setFormData({ ...formData, [ 'gallery' as any ]: e.target.value.split(',').map(s => s.trim()) })}
        />
      </div>

      <div className="space-y-1.5 relative z-10">
        <label className="text-[9px] text-noctvm-silver/60 font-mono uppercase tracking-widest ml-1">Description</label>
        <textarea
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:border-noctvm-violet/50 outline-none transition-all resize-none font-medium text-xs text-white/80 placeholder:text-white/10 frosted-noise leading-relaxed"
          placeholder="Atmosphere, sound, style..."
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-white/5 relative z-10">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2 text-noctvm-silver hover:text-white transition-all font-bold text-[9px] uppercase tracking-widest"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-8 py-2.5 bg-noctvm-violet text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-noctvm-violet/80 transition-all disabled:opacity-50 flex items-center gap-2 active:scale-95 shadow-lg shadow-noctvm-violet/20"
        >
          {loading ? <span>Saving...</span> : (initialData?.id ? 'Save Changes' : 'Create Venue')}
        </button>
      </div>
    </form>
  );
}
