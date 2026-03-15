'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { NoctEvent, Venue } from '@/lib/types';

interface EventFormProps {
  venues: Venue[];
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: Partial<NoctEvent>;
}

export default function EventForm({ venues, onSuccess, onCancel, initialData }: EventFormProps) {
  const [formData, setFormData] = useState<Partial<NoctEvent>>({
    title: '',
    venue: venues[0]?.name || '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    image_url: '',
    event_url: '',
    source: 'manual' as any,
    city: 'Bucharest',
    ...initialData
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from('events')
      .upsert({
        ...formData,
        id: initialData?.id || undefined,
        updated_at: new Date().toISOString()
      }, { onConflict: 'title, venue, date, source' } as any);

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
    <form onSubmit={handleSubmit} className="space-y-8 p-10 bg-white/5 border border-white/10 rounded-[32px] frosted-noise shadow-2xl relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-noctvm-violet/5 to-transparent pointer-events-none"></div>
      
      <div className="flex items-center justify-between border-b border-white/5 pb-6 relative z-10">
        <div>
          <h3 className="text-2xl font-heading font-black tracking-tighter italic uppercase text-white">
            {initialData?.id ? 'Adjust Frequency' : 'Initialize New Broadcast'}
          </h3>
          <p className="text-[10px] font-mono text-noctvm-silver/40 uppercase tracking-[0.2em] mt-1">Event Parameter Configuration</p>
        </div>
        {initialData?.featured && (
          <div className="px-3 py-1 rounded-xl bg-noctvm-gold/10 text-noctvm-gold text-[10px] font-black border border-noctvm-gold/20 shadow-[0_0_15px_rgba(251,191,36,0.15)] uppercase tracking-widest animate-pulse">
            FEATURED_SIGNAL
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
        <div className="space-y-2">
          <label className="text-[10px] text-noctvm-silver/60 font-mono uppercase tracking-[0.2em] ml-1">Signal Identity</label>
          <input
            required
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 focus:border-noctvm-violet/50 outline-none transition-all font-bold tracking-tight text-white placeholder:text-white/10 frosted-noise"
            placeholder="EVENT_NAME"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] text-noctvm-silver/60 font-mono uppercase tracking-[0.2em] ml-1">Transmission Location</label>
          <div className="relative">
            <select
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 focus:border-noctvm-violet/50 outline-none transition-all font-bold tracking-tight text-noctvm-violet appearance-none frosted-noise cursor-pointer"
              value={formData.venue}
              onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
              title="Select Venue"
            >
              {venues.map((v) => (
                <option key={v.id} value={v.name} className="bg-noctvm-black text-white">{v.name.toUpperCase()}</option>
              ))}
            </select>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-noctvm-violet/40">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
        <div className="space-y-2">
          <label className="text-[10px] text-noctvm-silver/60 font-mono uppercase tracking-[0.2em] ml-1">Temporal Alignment</label>
          <input
            type="date"
            required
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 focus:border-noctvm-violet/50 outline-none transition-all font-bold text-white uppercase tracking-tighter frosted-noise"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            title="Set Date"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] text-noctvm-silver/60 font-mono uppercase tracking-[0.2em] ml-1">Visual Asset Link</label>
          <input
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 focus:border-noctvm-violet/50 outline-none transition-all font-mono text-[10px] text-noctvm-emerald uppercase tracking-widest placeholder:text-white/10 frosted-noise"
            placeholder="HTTPS://SIGNAL_STORAGE.IO/IMG.JPG"
            value={formData.image_url}
            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
        <div className="space-y-2">
          <label className="text-[10px] text-noctvm-silver/60 font-mono uppercase tracking-[0.2em] ml-1">Target Frequency / Tickets</label>
          <input
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 focus:border-noctvm-violet/50 outline-none transition-all font-mono text-[10px] text-noctvm-emerald uppercase tracking-widest placeholder:text-white/10 frosted-noise"
            placeholder="HTTPS://TICKET_PORTAL.EXE"
            value={formData.event_url}
            onChange={(e) => setFormData({ ...formData, event_url: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] text-noctvm-silver/60 font-mono uppercase tracking-[0.2em] ml-1">Access Credit Value</label>
          <input
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 focus:border-noctvm-violet/50 outline-none transition-all font-black text-lg text-white placeholder:text-white/10 frosted-noise tracking-tighter italic"
            placeholder="50 RON"
            value={formData.price || ''}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-4 relative z-10">
        <label className="text-[10px] text-noctvm-silver/60 font-mono uppercase tracking-[0.2em] ml-1">Sub-Frequency Genres</label>
        <div className="flex flex-wrap gap-3 pt-1">
          {['Techno', 'House', 'Melodic', 'Underground', 'Live Music', 'Art', 'Rooftop'].map((genre) => (
            <button
              key={genre}
              type="button"
              onClick={() => handleGenreChange(genre)}
              className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all duration-300 ${
                formData.genres?.includes(genre)
                  ? 'bg-noctvm-violet text-white border-noctvm-violet shadow-[0_0_15px_rgba(139,92,246,0.3)]'
                  : 'bg-white/5 text-noctvm-silver border-white/10 hover:border-white/30 hover:text-white'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2 relative z-10">
        <label className="text-[10px] text-noctvm-silver/60 font-mono uppercase tracking-[0.2em] ml-1">Transmission Metadata</label>
        <textarea
          rows={4}
          className="w-full bg-white/5 border border-white/10 rounded-[24px] px-6 py-4 focus:border-noctvm-violet/50 outline-none transition-all resize-none font-medium text-sm text-white/80 placeholder:text-white/10 frosted-noise leading-relaxed"
          placeholder="ENTER_SIGNAL_DESCRIPTION_HERE..."
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
          className="px-10 py-4 bg-noctvm-emerald text-white rounded-[20px] font-black text-xs uppercase tracking-[0.4em] hover:bg-noctvm-emerald/80 hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all disabled:opacity-50 flex items-center gap-3 active:scale-95"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>UPLOADING...</span>
            </>
          ) : 'Execute_Save'}
        </button>
      </div>
    </form>
  );
}
