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
    <form onSubmit={handleSubmit} className="space-y-6 p-8 bg-noctvm-surface rounded-2xl border border-white/10 frosted-noise shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <h3 className="text-xl font-bold bg-gradient-to-r from-white to-noctvm-silver bg-clip-text text-transparent">
          {initialData?.id ? 'Edit Venue' : 'Create New Venue'}
        </h3>
        <div className="flex gap-2">
          {initialData?.id && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                formData.is_verified 
                  ? 'bg-noctvm-gold/10 text-noctvm-gold border-noctvm-gold/20' 
                  : 'bg-white/10 text-noctvm-silver border-white/20'
            }`}>
              {formData.is_verified ? 'VERIFIED' : 'PENDING'}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1">
          <label className="text-xs text-noctvm-silver font-mono uppercase tracking-wider">Venue Name</label>
          <input
            required
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:border-noctvm-violet outline-none transition-all placeholder:text-white/20"
            placeholder="e.g. Control Club"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-noctvm-silver font-mono uppercase tracking-wider">City</label>
          <select
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:border-noctvm-violet outline-none transition-all"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value as any })}
          >
            <option value="Bucharest">Bucharest</option>
            <option value="Constanta">Constanta</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1">
          <label className="text-xs text-noctvm-silver font-mono uppercase tracking-wider">Address</label>
          <input
            required
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:border-noctvm-violet outline-none transition-all placeholder:text-white/20"
            placeholder="Street name and number"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-noctvm-silver font-mono uppercase tracking-wider">Capacity</label>
          <input
            type="number"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:border-noctvm-violet outline-none transition-all"
            placeholder="Max occupancy"
            value={formData.capacity || ''}
            onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-noctvm-silver font-mono uppercase tracking-wider">Genres / Vibes</label>
        <div className="flex flex-wrap gap-2 pt-1">
          {['Techno', 'House', 'Experimental', 'Electronic', 'Rock', 'Jazz', 'Live Music', 'Art'].map((genre) => (
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
        <label className="text-xs text-noctvm-silver font-mono uppercase tracking-wider">Gallery Image URLs (CSV)</label>
        <textarea
          rows={2}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:border-noctvm-violet outline-none transition-all resize-none placeholder:text-white/20 text-xs"
          placeholder="https://image1.jpg, https://image2.jpg..."
          value={(formData as any).gallery?.join(', ') || ''}
          onChange={(e) => setFormData({ ...formData, [ 'gallery' as any ]: e.target.value.split(',').map(s => s.trim()) })}
        />
        <p className="text-[10px] text-noctvm-silver/50">Add comma-separated image links for the venue showcase.</p>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-noctvm-silver font-mono uppercase tracking-wider">Description</label>
        <textarea
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:border-noctvm-violet outline-none transition-all resize-none placeholder:text-white/20"
          placeholder="Describe the atmosphere, history, equipment..."
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
          ) : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
