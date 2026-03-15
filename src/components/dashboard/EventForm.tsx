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
    <form onSubmit={handleSubmit} className="space-y-6 p-8 bg-noctvm-surface rounded-2xl border border-white/10 frosted-noise shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <h3 className="text-xl font-bold bg-gradient-to-r from-white to-noctvm-silver bg-clip-text text-transparent">
          {initialData?.id ? 'Edit Event' : 'Create New Event'}
        </h3>
        {initialData?.featured && (
          <span className="px-2 py-0.5 rounded-full bg-noctvm-gold/10 text-noctvm-gold text-[10px] font-bold border border-noctvm-gold/20">
            FEATURED
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1">
          <label className="text-xs text-noctvm-silver font-mono uppercase tracking-wider">Title</label>
          <input
            required
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:border-noctvm-violet outline-none transition-all placeholder:text-white/20"
            placeholder="Event Name"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-noctvm-silver font-mono uppercase tracking-wider">Venue</label>
          <select
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:border-noctvm-violet outline-none transition-all"
            value={formData.venue}
            onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
          >
            {venues.map((v) => (
              <option key={v.id} value={v.name}>{v.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1">
          <label className="text-xs text-noctvm-silver font-mono uppercase tracking-wider">Date</label>
          <input
            type="date"
            required
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:border-noctvm-violet outline-none transition-all"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-noctvm-silver font-mono uppercase tracking-wider">Image URL</label>
          <input
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:border-noctvm-violet outline-none transition-all placeholder:text-white/20"
            placeholder="https://..."
            value={formData.image_url}
            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1">
          <label className="text-xs text-noctvm-silver font-mono uppercase tracking-wider">Event URL / Tickets</label>
          <input
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:border-noctvm-violet outline-none transition-all placeholder:text-white/20"
            placeholder="https://..."
            value={formData.event_url}
            onChange={(e) => setFormData({ ...formData, event_url: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-noctvm-silver font-mono uppercase tracking-wider">Price Tag</label>
          <input
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:border-noctvm-violet outline-none transition-all placeholder:text-white/20"
            placeholder="e.g. 50 RON"
            value={formData.price || ''}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-noctvm-silver font-mono uppercase tracking-wider">Genres</label>
        <div className="flex flex-wrap gap-2 pt-1">
          {['Techno', 'House', 'Melodic', 'Underground', 'Live Music', 'Art', 'Rooftop'].map((genre) => (
            <button
              key={genre}
              type="button"
              onClick={() => handleGenreChange(genre)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                formData.genres?.includes(genre)
                  ? 'bg-noctvm-violet text-white border-noctvm-violet'
                  : 'bg-white/5 text-noctvm-silver border-white/10 hover:border-white/20'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-noctvm-silver font-mono uppercase tracking-wider">Description</label>
        <textarea
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:border-noctvm-violet outline-none transition-all resize-none placeholder:text-white/20"
          placeholder="Details about the line-up, special rules..."
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 text-noctvm-silver hover:text-white transition-all font-medium"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-8 py-2.5 bg-noctvm-violet rounded-xl font-bold hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Processing...
            </>
          ) : 'Save Event'}
        </button>
      </div>
    </form>
  );
}
