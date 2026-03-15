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
    <form onSubmit={handleSubmit} className="space-y-8 p-10 bg-white/5 border border-white/10 rounded-[40px] frosted-noise shadow-2xl relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-noctvm-emerald/5 to-transparent pointer-events-none"></div>

      <div className="flex items-center justify-between border-b border-white/5 pb-6 relative z-10">
        <div>
          <h3 className="text-2xl font-heading font-black tracking-tighter italic uppercase text-white">
            {initialData?.id ? 'Reconfigure Station' : 'Initialize New Terminal'}
          </h3>
          <p className="text-[10px] font-mono text-noctvm-silver/40 uppercase tracking-[0.2em] mt-1">Venue Resource Database Entry</p>
        </div>
        <div className="flex gap-2">
          {initialData?.id && (
            <div className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border shadow-inner transition-all ${
                formData.is_verified 
                  ? 'bg-noctvm-gold/10 text-noctvm-gold border-noctvm-gold/20 shadow-[0_0_15px_rgba(251,191,36,0.15)] animate-pulse' 
                  : 'bg-white/5 text-noctvm-silver/40 border-white/10'
            }`}>
              {formData.is_verified ? 'CERTIFIED_STATION' : 'INITIALIZING_SIGNAL'}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
        <div className="space-y-2">
          <label className="text-[10px] text-noctvm-silver/60 font-mono uppercase tracking-[0.2em] ml-1">Location Alias</label>
          <input
            required
            className="w-full bg-white/5 border border-white/10 rounded-[20px] px-6 py-4 focus:border-noctvm-emerald/50 outline-none transition-all font-bold tracking-tight text-white placeholder:text-white/10 frosted-noise"
            placeholder="VENUE_ID"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] text-noctvm-silver/60 font-mono uppercase tracking-[0.2em] ml-1">Regional Sector</label>
          <div className="relative">
            <select
              className="w-full bg-white/5 border border-white/10 rounded-[20px] px-6 py-4 focus:border-noctvm-emerald/50 outline-none transition-all font-bold tracking-tight text-noctvm-emerald appearance-none frosted-noise cursor-pointer uppercase"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value as any })}
              title="Select City"
            >
              <option value="Bucharest" className="bg-noctvm-black">BUCHAREST_CENTRAL</option>
              <option value="Constanta" className="bg-noctvm-black">CONSTANTA_PORT</option>
            </select>
            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-noctvm-emerald/40">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
        <div className="space-y-2">
          <label className="text-[10px] text-noctvm-silver/60 font-mono uppercase tracking-[0.2em] ml-1">Physical Coordinates</label>
          <input
            required
            className="w-full bg-white/5 border border-white/10 rounded-[20px] px-6 py-4 focus:border-noctvm-emerald/50 outline-none transition-all font-medium text-white/90 placeholder:text-white/10 frosted-noise text-sm"
            placeholder="STREET_ADDRESS_SIGNAL"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] text-noctvm-silver/60 font-mono uppercase tracking-[0.2em] ml-1">Density Capacity</label>
          <input
            type="number"
            className="w-full bg-white/5 border border-white/10 rounded-[20px] px-6 py-4 focus:border-noctvm-emerald/50 outline-none transition-all font-mono font-bold text-lg text-white frosted-noise"
            placeholder="MAX_UNITS"
            value={formData.capacity || ''}
            onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
          />
        </div>
      </div>

      <div className="space-y-4 relative z-10">
        <label className="text-[10px] text-noctvm-silver/60 font-mono uppercase tracking-[0.2em] ml-1">Aesthetic Vibetrackers</label>
        <div className="flex flex-wrap gap-3 pt-1">
          {['Techno', 'House', 'Experimental', 'Electronic', 'Rock', 'Jazz', 'Live Music', 'Art'].map((genre) => (
            <button
              key={genre}
              type="button"
              onClick={() => handleGenreChange(genre)}
              className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all duration-300 ${
                formData.genres?.includes(genre)
                  ? 'bg-noctvm-emerald text-white border-noctvm-emerald shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                  : 'bg-white/5 text-noctvm-silver border-white/10 hover:border-white/30 hover:text-white'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2 relative z-10">
        <label className="text-[10px] text-noctvm-silver/60 font-mono uppercase tracking-[0.2em] ml-1">Visual Archive Links (CSV)</label>
        <textarea
          rows={2}
          className="w-full bg-white/5 border border-white/10 rounded-[20px] px-6 py-4 focus:border-noctvm-emerald/50 outline-none transition-all resize-none font-mono text-[9px] text-noctvm-emerald uppercase tracking-[0.2em] placeholder:text-white/10 frosted-noise leading-relaxed"
          placeholder="HTTPS://ARCHIVE.IO/IMG1.JPG, HTTPS://ARCHIVE.IO/IMG2.JPG..."
          value={(formData as any).gallery?.join(', ') || ''}
          onChange={(e) => setFormData({ ...formData, [ 'gallery' as any ]: e.target.value.split(',').map(s => s.trim()) })}
        />
        <p className="text-[8px] text-noctvm-silver/30 font-mono uppercase tracking-widest px-2 mt-1">Multi-signal visual registration for station showcase</p>
      </div>

      <div className="space-y-2 relative z-10">
        <label className="text-[10px] text-noctvm-silver/60 font-mono uppercase tracking-[0.2em] ml-1">Station Intelligence Report</label>
        <textarea
          rows={4}
          className="w-full bg-white/5 border border-white/10 rounded-[24px] px-6 py-4 focus:border-noctvm-emerald/50 outline-none transition-all resize-none font-medium text-sm text-white/80 placeholder:text-white/10 frosted-noise leading-relaxed"
          placeholder="REPORTING_ATMOSPHERE_AND_SPECS..."
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div className="flex justify-end gap-5 pt-8 border-t border-white/5 relative z-10">
        <button
          type="button"
          onClick={onCancel}
          className="px-8 py-3 text-noctvm-silver hover:text-white transition-all font-black text-[10px] uppercase tracking-[0.3em]"
        >
          Cancel_Abort
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-10 py-4 bg-noctvm-violet text-white rounded-[20px] font-black text-xs uppercase tracking-[0.4em] hover:bg-noctvm-violet/80 hover:shadow-[0_0_30px_rgba(139,92,246,0.3)] transition-all disabled:opacity-50 flex items-center gap-3 active:scale-95"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>TRANSMITTING...</span>
            </>
          ) : 'Execute_Save'}
        </button>
      </div>
    </form>
  );
}
