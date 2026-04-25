'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Venue } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { XIcon } from '@/components/icons';
import { logActivity } from '@/lib/activity';

interface ClaimModalProps {
  venue: Venue;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ClaimModal({ venue, onSuccess, onCancel }: ClaimModalProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<string[]>(['']);
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;
    setLoading(true);

    const { error } = await supabase
      .from('venue_claims')
      .insert({
        venue_id: venue.id,
        user_id: profile.id,
        documents: documents.filter(d => d.trim() !== ''),
        notes: notes
      });

    if (!error) {
      await logActivity({
        type: 'venue_edit', // or a new type if we want
        message: `New claim request for venue: ${venue.name}`,
        entity_name: venue.name,
        user_name: profile?.display_name || 'Anonymous'
      });
      onSuccess();
    } else {
      alert(error.message);
    }
    setLoading(false);
  };

  const addDocumentField = () => setDocuments([...documents, '']);
  const updateDocument = (index: number, value: string) => {
    const newDocs = [...documents];
    newDocs[index] = value;
    setDocuments(newDocs);
  };

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-noctvm-black/80 backdrop-blur-md transition-all animate-fade-in">
      <div className="w-full max-w-lg bg-[#0A0A0A]/90 border border-white/10 rounded-3xl p-8 frosted-noise shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-noctvm-violet/10 blur-3xl -z-10"></div>
        
        <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
          <div>
            <h3 className="text-xl font-bold text-foreground tracking-tight">Claim Venue</h3>
            <p className="text-noctvm-caption font-mono text-noctvm-silver/40 uppercase tracking-widest mt-0.5">Identity verification for {venue.name}</p>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-white/5 rounded-xl transition-colors" title="Close Modal">
            <XIcon className="w-4 h-4 text-noctvm-silver" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <label className="text-noctvm-caption text-noctvm-silver font-mono uppercase tracking-widest pl-1">Supporting Documents (Links)</label>
            <div className="space-y-3">
              {documents.map((doc, i) => (
                <input
                  key={i}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-noctvm-violet/50 outline-none transition-all placeholder:text-foreground/10 text-xs text-foreground"
                  placeholder="e.g. https://your-website.com/business-license.pdf"
                  value={doc}
                  onChange={(e) => updateDocument(i, e.target.value)}
                />
              ))}
            </div>
            <button 
              type="button" 
              onClick={addDocumentField}
              className="px-4 py-2 bg-white/5 border border-white/5 rounded-lg text-noctvm-micro text-noctvm-silver/60 hover:text-foreground hover:border-white/10 font-bold uppercase tracking-widest transition-all"
            >
              + Add Another Field
            </button>
          </div>

          <div className="space-y-3">
            <label className="text-noctvm-caption text-noctvm-silver font-mono uppercase tracking-widest pl-1">Verification Notes</label>
            <textarea
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-noctvm-violet/50 outline-none transition-all resize-none placeholder:text-foreground/10 text-xs text-foreground"
              placeholder="Tell us about your relationship to this venue..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="bg-noctvm-violet/5 border border-noctvm-violet/10 rounded-2xl p-4">
            <p className="text-noctvm-caption text-noctvm-silver/60 leading-relaxed font-mono">
              <span className="text-noctvm-violet font-bold">PROTOCOL:</span> Your claim request will be manually reviewed by our authentication team. You will be assigned as owner upon successful validation.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2.5 text-xs text-noctvm-silver font-bold uppercase tracking-widest hover:text-foreground transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-2.5 bg-noctvm-violet rounded-xl font-bold text-xs text-foreground uppercase tracking-widest hover:bg-noctvm-violet/80 transition-all shadow-lg active:scale-[0.96] disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Submitting
                </>
              ) : 'Submit Claim'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
