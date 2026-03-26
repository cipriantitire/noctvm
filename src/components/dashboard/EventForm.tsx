'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { NoctEvent, Venue } from '@/lib/types';
import { logActivity } from '@/lib/activity';
import { TicketIcon, LinkIcon, UploadIcon } from '@/components/icons';
import { uploadOptimizedImage } from '@/lib/image-optimization';
import { Badge, Button, Field, GlassPanel, Input, TextArea, inputBaseClassName } from '@/components/ui';
import { cn } from '@/lib/cn';

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
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const url = await uploadOptimizedImage(file, 'post-media');
    if (url) {
      setFormData(prev => ({ ...prev, image_url: url }));
    } else {
      alert('Upload failed. Please try again.');
    }
    setUploading(false);
  };

  const handleGenreChange = (genre: string) => {
    const currentGenres = formData.genres || [];
    if (currentGenres.includes(genre)) {
      setFormData({ ...formData, genres: currentGenres.filter(g => g !== genre) });
    } else {
      setFormData({ ...formData, genres: [...currentGenres, genre] });
    }
  };

  const selectClass = cn(
    inputBaseClassName,
    "appearance-none cursor-pointer font-bold tracking-tight"
  );

  return (
    <GlassPanel variant="noise" className="group">
      <form onSubmit={handleSubmit} className="space-y-6 p-6 relative overflow-hidden rounded-noctvm-xl">
      <div className="absolute inset-0 bg-gradient-to-br from-noctvm-violet/5 to-transparent pointer-events-none" />
      
      <div className="flex items-center justify-between border-b border-white/5 pb-4 relative z-10">
        <div>
          <h3 className="text-lg font-bold tracking-tight text-white uppercase">
            {initialData?.id ? 'Edit Event' : 'Create New Event'}
          </h3>
          <p className="text-noctvm-micro font-mono text-noctvm-silver/40 uppercase tracking-widest mt-0.5">Event Management</p>
        </div>
        {initialData?.featured && (
          <Badge variant="featured">Featured</Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
        <Field id="event-title" label="Event Title">
          <Input
            id="event-title"
            required
            placeholder="Title..."
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </Field>
        <Field label="Venue">
          <div className="relative">
            <select
              className={selectClass}
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
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
        <Field id="event-date" label="Date">
          <Input
            id="event-date"
            type="date"
            required
            className="uppercase tracking-tighter"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            title="Set Date"
          />
        </Field>
        <div className="space-y-1.5 relative">
          <label className="text-noctvm-micro text-noctvm-silver/60 font-mono uppercase tracking-widest ml-1">Poster (URL)</label>
          <div className="relative group/upload">
            <input
              title="Poster Image URL"
              className={cn(
                inputBaseClassName,
                "pl-4 pr-[35%] font-mono text-noctvm-micro text-white/60 uppercase tracking-widest"
              )}
              placeholder="https://..."
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="absolute right-1 top-1 bottom-1 w-[32%] bg-noctvm-violet/20 hover:bg-noctvm-violet/40 border border-noctvm-violet/30 rounded-lg text-noctvm-xs font-black uppercase tracking-widest text-noctvm-violet transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {uploading ? (
                <div className="w-2 h-2 border border-noctvm-violet/30 border-t-noctvm-violet rounded-full animate-spin" />
              ) : (
                <UploadIcon className="w-2.5 h-2.5" />
              )}
              {uploading ? '...' : 'Upload'}
            </button>
            <input 
              title="Upload Poster File"
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept="image/*" 
              className="hidden" 
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
        <Field
          label={
            <span className="flex items-center gap-1.5">
              <TicketIcon className="w-2.5 h-2.5" />
              Ticket Provider
            </span>
          }
        >
          <div className="relative">
            <select
              className={selectClass}
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
        </Field>
        <Field
          label={
            <span className="flex items-center gap-1.5">
              <LinkIcon className="w-2.5 h-2.5" />
              Direct Ticket Link
            </span>
          }
        >
          <Input
            className="font-mono text-noctvm-micro text-white/60 uppercase tracking-widest font-normal"
            placeholder="https://iabilet.ro/..."
            value={formData.ticket_url || ''}
            onChange={(e) => setFormData({ ...formData, ticket_url: e.target.value })}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
        <Field label="Official Event URL">
          <Input
            className="font-mono text-noctvm-micro text-white/60 uppercase tracking-widest font-normal"
            placeholder="https://facebook.com/events/..."
            value={formData.event_url}
            onChange={(e) => setFormData({ ...formData, event_url: e.target.value })}
          />
        </Field>
        <Field label="Price Label">
          <Input
            placeholder="e.g. 50 RON or Free"
            value={formData.price || ''}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          />
        </Field>
      </div>

      <div className="space-y-3 relative z-10">
        <label className="text-noctvm-micro text-noctvm-silver/60 font-mono uppercase tracking-widest ml-1">Genres</label>
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
              className={`px-3 py-1.5 rounded-lg text-noctvm-micro font-bold uppercase tracking-widest border transition-all duration-300 ${
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

      <Field id="event-description" label="Description" className="relative z-10">
        <TextArea
          id="event-description"
          rows={3}
          placeholder="Lineup, special info..."
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </Field>

      <div className="flex justify-end gap-3 pt-4 border-t border-white/5 relative z-10">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="submit" disabled={loading}>
          {loading ? <span>Saving...</span> : (initialData?.id ? 'Save Event' : 'Create Event')}
        </Button>
      </div>
    </form>
    </GlassPanel>
  );
}
