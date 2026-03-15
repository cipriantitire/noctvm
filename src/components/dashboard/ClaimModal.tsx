'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Venue } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';

interface ClaimModalProps {
  venue: Venue;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ClaimModal({ venue, onSuccess, onCancel }: ClaimModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<string[]>(['']);
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const { error } = await supabase
      .from('venue_claims')
      .insert({
        venue_id: venue.id,
        user_id: user.id,
        documents: documents.filter(d => d.trim() !== ''),
        notes: notes
      });

    if (!error) {
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl transition-all animate-fade-in">
      <div className="w-full max-w-lg bg-noctvm-surface border border-white/10 rounded-2xl p-8 frosted-noise shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
          <h3 className="text-xl font-bold bg-gradient-to-r from-white to-noctvm-silver bg-clip-text text-transparent">
            Claim {venue.name}
          </h3>
          <button onClick={onCancel} className="text-noctvm-silver hover:text-white transition-colors">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs text-noctvm-silver font-mono uppercase tracking-widest">Supporting Documents (Links)</label>
            <div className="space-y-3">
              {documents.map((doc, i) => (
                <input
                  key={i}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:border-noctvm-violet outline-none transition-all placeholder:text-white/20 text-sm"
                  placeholder="https://link-to-proof.pdf"
                  value={doc}
                  onChange={(e) => updateDocument(i, e.target.value)}
                />
              ))}
            </div>
            <button 
              type="button" 
              onClick={addDocumentField}
              className="text-[10px] text-noctvm-violet hover:text-noctvm-violet/80 font-bold uppercase tracking-tighter"
            >
              + Add Another Link
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-noctvm-silver font-mono uppercase tracking-widest">Additional Notes</label>
            <textarea
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:border-noctvm-violet outline-none transition-all resize-none placeholder:text-white/20 text-sm"
              placeholder="Why should we approve your claim?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="bg-noctvm-violet/5 border border-noctvm-violet/20 rounded-xl p-4">
            <p className="text-[11px] text-noctvm-silver leading-relaxed">
              <span className="text-noctvm-violet font-bold">INFO:</span> Your request will be reviewed by our team. You will be notified once the claim is approved or if we need more information.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
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
                  SUBMITTING...
                </>
              ) : 'SUBMIT CLAIM'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
