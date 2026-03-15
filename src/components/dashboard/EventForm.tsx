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

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-noctvm-surface rounded-2xl border border-white/10 frosted-noise">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs text-noctvm-silver font-mono uppercase">Title</label>
          <input
            required
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:border-noctvm-violet outline-none transition-all"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-noctvm-silver font-mono uppercase">Venue</label>
          <select
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:border-noctvm-violet outline-none transition-all"
            value={formData.venue}
            onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
          >
            {venues.map((v) => (
              <option key={v.id} value={v.name}>{v.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-noctvm-silver font-mono uppercase">Date</label>
          <input
            type="date"
            required
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:border-noctvm-violet outline-none transition-all"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-noctvm-silver font-mono uppercase">Image URL</label>
          <input
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:border-noctvm-violet outline-none transition-all"
            placeholder="https://..."
            value={formData.image_url}
            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-noctvm-silver font-mono uppercase">Description</label>
        <textarea
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:border-noctvm-violet outline-none transition-all resize-none"
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-noctvm-silver hover:text-white transition-all"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-noctvm-violet rounded-xl font-bold hover:bg-noctvm-violet/80 transition-all disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Event'}
        </button>
      </div>
    </form>
  );
}
