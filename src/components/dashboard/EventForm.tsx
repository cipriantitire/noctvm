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
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-noctvm-black border border-white/10 rounded-3xl frosted-noise shadow-2xl relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-noctvm-violet/5 to-transparent pointer-events-none"></div>
      
      <div className="flex items-center justify-between border-b border-white/5 pb-4 relative z-10">
        <div>
          <h3 className="text-lg font-bold tracking-tight text-white uppercase">
            {initialData?.id ? 'Edit Event' : 'Create New Event'}
          </h3>
          <p className="text-[9px] font-mono text-noctvm-silver/40 uppercase tracking-widest mt-0.5">Event Management</p>
        </div>
        {initialData?.featured && (
          <div className="px-2 py-0.5 rounded-lg bg-noctvm-violet/10 text-noctvm-violet text-[8px] font-bold border border-noctvm-violet/20 uppercase tracking-widest">
            Featured
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
        <div className="space-y-1.5">
          <label className="text-[9px] text-noctvm-silver/60 font-mono uppercase tracking-widest ml-1">Event Title</label>
          <input
            required
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:border-noctvm-violet/50 outline-none transition-all font-bold tracking-tight text-white placeholder:text-white/10 frosted-noise text-sm"
            placeholder="Title..."
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[9px] text-noctvm-silver/60 font-mono uppercase tracking-widest ml-1">Venue</label>
          <div className="relative">
            <select
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:border-noctvm-violet/50 outline-none transition-all font-bold tracking-tight text-white appearance-none frosted-noise cursor-pointer text-sm"
              value={formData.venue}
              onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
              title="Select Venue"
            >
              {venues.map((v) => (
                <option key={v.id} value={v.name} className="bg-noctvm-black text-white">{v.name}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
        <div className="space-y-1.5">
          <label className="text-[9px] text-noctvm-silver/60 font-mono uppercase tracking-widest ml-1">Date</label>
          <input
            type="date"
            required
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:border-noctvm-violet/50 outline-none transition-all font-bold text-white uppercase tracking-tighter frosted-noise text-sm"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            title="Set Date"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[9px] text-noctvm-silver/60 font-mono uppercase tracking-widest ml-1">Poster URL</label>
          <input
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:border-noctvm-violet/50 outline-none transition-all font-mono text-[9px] text-white/60 uppercase tracking-widest placeholder:text-white/10 frosted-noise"
            placeholder="https://..."
            value={formData.image_url}
            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
        <div className="space-y-1.5">
          <label className="text-[9px] text-noctvm-silver/60 font-mono uppercase tracking-widest ml-1">Ticket URL</label>
          <input
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:border-noctvm-violet/50 outline-none transition-all font-mono text-[9px] text-white/60 uppercase tracking-widest placeholder:text-white/10 frosted-noise"
            placeholder="https://..."
            value={formData.event_url}
            onChange={(e) => setFormData({ ...formData, event_url: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[9px] text-noctvm-silver/60 font-mono uppercase tracking-widest ml-1">Price</label>
          <input
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:border-noctvm-violet/50 outline-none transition-all font-bold text-base text-white placeholder:text-white/10 frosted-noise tracking-tighter italic"
            placeholder="e.g. 50 RON"
            value={formData.price || ''}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-3 relative z-10">
        <label className="text-[9px] text-noctvm-silver/60 font-mono uppercase tracking-widest ml-1">Genres</label>
        <div className="flex flex-wrap gap-1.5">
          {['Techno', 'House', 'Melodic', 'Underground', 'Live Music', 'Art', 'Rooftop'].map((genre) => (
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
        <label className="text-[9px] text-noctvm-silver/60 font-mono uppercase tracking-widest ml-1">Description</label>
        <textarea
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:border-noctvm-violet/50 outline-none transition-all resize-none font-medium text-xs text-white/80 placeholder:text-white/10 frosted-noise leading-relaxed"
          placeholder="Lineup, special info..."
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
          {loading ? <span>Saving...</span> : (initialData?.id ? 'Save Event' : 'Create Event')}
        </button>
      </div>
    </form>
  );
}
