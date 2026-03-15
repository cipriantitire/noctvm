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
        owner_id: initialData?.id ? undefined : profile?.id // Set owner only on creation
      });

    if (!error) onSuccess();
    else alert(error.message);
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-noctvm-surface rounded-2xl border border-white/10 frosted-noise">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs text-noctvm-silver font-mono uppercase">Venue Name</label>
          <input
            required
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:border-noctvm-violet outline-none transition-all"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-noctvm-silver font-mono uppercase">City</label>
          <select
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:border-noctvm-violet outline-none transition-all"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value as any })}
          >
            <option value="Bucharest">Bucharest</option>
            <option value="Constanta">Constanta</option>
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-noctvm-silver font-mono uppercase">Address</label>
        <input
          required
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:border-noctvm-violet outline-none transition-all"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        />
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
          className="px-6 py-2 bg-noctvm-emerald rounded-xl font-bold hover:bg-noctvm-emerald/80 transition-all disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Venue'}
        </button>
      </div>
    </form>
  );
}
