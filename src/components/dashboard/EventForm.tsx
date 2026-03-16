'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { NoctEvent, Venue } from '@/lib/types';
import { logActivity } from '@/lib/activity';
import { TicketIcon, LinkIcon } from '@/components/icons';

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
    ticket_url: '',
    ticket_provider: 'none',
    genres: [],
    source: 'manual' as any,
    city: 'Bucharest',
    ...initialData
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const isEdit = !!initialData?.id;
    const { data: savedData, error } = await supabase
      .from('events')
      .upsert({
        ...formData,
        id: initialData?.id || undefined,
        source: 'manual', 
        updated_at: new Date().toISOString()
      }, { 
        onConflict: initialData?.id ? 'id' : 'title, venue, date, source' 
      } as any)
      .select()
      .single();

    if (!error) {
      // Log Activity
      await logActivity({
        type: isEdit ? 'event_edit' : 'event_add',
        message: `${isEdit ? 'Updated' : 'Added'} event: ${formData.title}`,
        entity_id: savedData?.id,
        entity_name: formData.title,
        user_name: 'Admin'
      });
      onSuccess();
    }
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
          <label className="text-[9px] text-noctvm-silver/60 font-mono uppercase tracking-widest ml-1 flex items-center gap-1.5">
            <TicketIcon className="w-2.5 h-2.5" />
            Ticket Provider
          </label>
          <div className="relative">
            <select
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:border-noctvm-violet/50 outline-none transition-all font-bold tracking-tight text-white appearance-none frosted-noise cursor-pointer text-sm"
              value={formData.ticket_provider || 'none'}
              onChange={(e) => setFormData({ ...formData, ticket_provider: e.target.value as any })}
              title="Select Ticket Provider"
            >
              <option value="none" className="bg-noctvm-black text-white">None (Information Only)</option>
              <option value="livetickets" className="bg-noctvm-black text-white">LiveTickets</option>
              <option value="iabilet" className="bg-noctvm-black text-white">Iabilet</option>
              <option value="eventbook" className="bg-noctvm-black text-white">Eventbook</option>
              <option value="ambilet" className="bg-noctvm-black text-white">Ambilet</option>
              <option value="ra" className="bg-noctvm-black text-white">Resident Advisor</option>
              <option value="fever" className="bg-noctvm-black text-white">Fever</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[9px] text-noctvm-silver/60 font-mono uppercase tracking-widest ml-1 flex items-center gap-1.5">
            <LinkIcon className="w-2.5 h-2.5" />
            Direct Ticket Link
          </label>
          <input
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:border-noctvm-violet/50 outline-none transition-all font-mono text-[9px] text-white/60 uppercase tracking-widest placeholder:text-white/10 frosted-noise"
            placeholder="https://iabilet.ro/..."
            value={formData.ticket_url || ''}
            onChange={(e) => setFormData({ ...formData, ticket_url: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
        <div className="space-y-1.5">
          <label className="text-[9px] text-noctvm-silver/60 font-mono uppercase tracking-widest ml-1">Official Event URL</label>
          <input
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:border-noctvm-violet/50 outline-none transition-all font-mono text-[9px] text-white/60 uppercase tracking-widest placeholder:text-white/10 frosted-noise"
            placeholder="https://facebook.com/events/..."
            value={formData.event_url}
            onChange={(e) => setFormData({ ...formData, event_url: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[9px] text-noctvm-silver/60 font-mono uppercase tracking-widest ml-1">Price Label</label>
          <input
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:border-noctvm-violet/50 outline-none transition-all font-bold tracking-tight text-white placeholder:text-white/10 frosted-noise text-sm"
            placeholder="e.g. 50 RON or Free"
            value={formData.price || ''}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-3 relative z-10">
        <label className="text-[9px] text-noctvm-silver/60 font-mono uppercase tracking-widest ml-1">Genres</label>
        <div className="flex flex-wrap gap-1.5">
          {[
            'Techno', 'House', 'Melodic', 'Psytrance', 'Minimal', 'Tech House', 'Hard Techno',
            'Live Music', 'Jazz', 'Experimental', 'Ambient', 'Drum & Bass', 'Garage',
            'Art', 'Rooftop', 'Underground', 'Clubbing', 'Festival'
          ].sort().map((genre) => (
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
