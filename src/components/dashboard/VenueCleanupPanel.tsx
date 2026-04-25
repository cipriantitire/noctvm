'use client';

import React, { useCallback, useEffect, useState } from 'react';
import type { VenueCleanupCandidate, VenueCleanupPreview } from '@/lib/venues/cleanup';
import { CheckIcon, RefreshIcon, XIcon } from '@/components/icons';

interface VenueCleanupPanelProps {
  accessToken?: string;
}

export default function VenueCleanupPanel({ accessToken }: VenueCleanupPanelProps) {
  const [preview, setPreview] = useState<VenueCleanupPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [mergingKey, setMergingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const loadPreview = useCallback(async () => {
    if (!accessToken) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/venues/cleanup', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load venue cleanup preview');
      }
      setPreview(data);
    } catch (loadError: any) {
      setError(loadError.message || 'Failed to load venue cleanup preview');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void loadPreview();
  }, [loadPreview]);

  const mergeCandidate = async (candidate: VenueCleanupCandidate) => {
    if (!accessToken) return;

    const duplicateNames = candidate.duplicates.map((entry) => entry.name).join(', ');
    const confirmed = window.confirm(
      `Merge ${duplicateNames} into ${candidate.canonical.name}? This rewrites venue references across the database.`,
    );
    if (!confirmed) return;

    setMergingKey(candidate.key);
    setError(null);
    setStatus(null);

    try {
      const response = await fetch('/api/admin/venues/cleanup', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          canonicalVenueId: candidate.canonical.id,
          duplicateVenueIds: candidate.duplicates.map((entry) => entry.id),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Merge failed');
      }

      setPreview(data.preview || null);
      setStatus(
        `Merged ${data.result.mergedVenueNames.join(', ')} into ${data.result.canonicalVenueName}.`,
      );
    } catch (mergeError: any) {
      setError(mergeError.message || 'Merge failed');
    } finally {
      setMergingKey(null);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden frosted-noise shadow-xl">
      <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-noctvm-caption font-bold uppercase tracking-widest text-noctvm-silver font-mono">
            Venue Cleanup
          </h3>
          <p className="text-noctvm-caption text-noctvm-silver/50 font-mono mt-1">
            Preview duplicate venue names and merge them safely.
          </p>
        </div>
        <button
          onClick={() => void loadPreview()}
          disabled={loading || !accessToken}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-noctvm-silver hover:text-foreground hover:bg-white/10 transition-all disabled:opacity-40"
          title="Refresh venue cleanup preview"
        >
          <RefreshIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span className="text-noctvm-caption font-bold uppercase tracking-widest">Refresh</span>
        </button>
      </div>

      <div className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <p className="text-noctvm-micro text-noctvm-silver/40 uppercase font-mono tracking-widest mb-1">
              Duplicate Groups
            </p>
            <p className="text-2xl font-black text-foreground">
              {preview?.candidateCount ?? (loading ? '...' : '0')}
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <p className="text-noctvm-micro text-noctvm-silver/40 uppercase font-mono tracking-widest mb-1">
              Status
            </p>
            <p className="text-sm font-bold text-foreground uppercase tracking-widest">
              {loading ? 'Scanning' : preview?.candidateCount ? 'Needs cleanup' : 'Clean'}
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <p className="text-noctvm-micro text-noctvm-silver/40 uppercase font-mono tracking-widest mb-1">
              Generated
            </p>
            <p className="text-sm font-bold text-foreground uppercase tracking-widest">
              {preview?.generatedAt ? new Date(preview.generatedAt).toLocaleString() : 'No data'}
            </p>
          </div>
        </div>

        {status && (
          <div className="flex items-start gap-3 rounded-2xl border border-noctvm-emerald/20 bg-noctvm-emerald/10 px-4 py-3 text-noctvm-emerald">
            <CheckIcon className="w-4 h-4 mt-0.5" />
            <p className="text-noctvm-caption font-bold uppercase tracking-wider">{status}</p>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-noctvm-rose/20 bg-noctvm-rose/10 px-4 py-3 text-noctvm-rose">
            <XIcon className="w-4 h-4 mt-0.5" />
            <p className="text-noctvm-caption font-bold uppercase tracking-wider">{error}</p>
          </div>
        )}

        {!loading && preview && preview.candidateCount === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-6 text-center">
            <p className="text-sm font-bold text-foreground uppercase tracking-widest">
              No duplicate venue groups found
            </p>
            <p className="text-noctvm-caption text-noctvm-silver/50 font-mono mt-2">
              This check is conservative. It only flags near-exact name collisions.
            </p>
          </div>
        )}

        {preview?.candidates.map((candidate) => (
          <div key={candidate.key} className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <p className="text-noctvm-micro text-noctvm-silver/40 uppercase font-mono tracking-widest mb-1">
                  {candidate.city}
                </p>
                <h4 className="text-sm font-black text-foreground uppercase tracking-wider">
                  Suggested Canonical: {candidate.canonical.name}
                </h4>
                <p className="text-noctvm-caption text-noctvm-silver/50 font-mono mt-1">
                  {candidate.duplicates.length} duplicate {candidate.duplicates.length === 1 ? 'record' : 'records'}
                </p>
              </div>

              <button
                onClick={() => void mergeCandidate(candidate)}
                disabled={Boolean(mergingKey) || !accessToken}
                className="px-4 py-2 rounded-xl bg-noctvm-violet text-foreground text-noctvm-caption font-bold uppercase tracking-widest hover:bg-noctvm-violet/80 transition-all disabled:opacity-40"
              >
                {mergingKey === candidate.key ? 'Merging...' : `Merge Into ${candidate.canonical.name}`}
              </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-noctvm-emerald/20 bg-noctvm-emerald/5 p-4">
                <p className="text-noctvm-micro text-noctvm-emerald uppercase font-mono tracking-widest mb-2">
                  Keep
                </p>
                <p className="text-sm font-black text-foreground uppercase tracking-wider">
                  {candidate.canonical.name}
                </p>
                <p className="text-noctvm-caption text-noctvm-silver/60 font-mono mt-2">
                  refs {candidate.canonical.references.total} | events {candidate.canonical.references.events} | follows {candidate.canonical.references.follows}
                </p>
              </div>

              <div className="space-y-3">
                {candidate.duplicates.map((duplicate) => (
                  <div key={duplicate.id} className="rounded-2xl border border-white/10 bg-noctvm-black/20 p-4">
                    <p className="text-noctvm-micro text-noctvm-silver/40 uppercase font-mono tracking-widest mb-2">
                      Merge
                    </p>
                    <p className="text-sm font-black text-foreground uppercase tracking-wider">
                      {duplicate.name}
                    </p>
                    <p className="text-noctvm-caption text-noctvm-silver/60 font-mono mt-2">
                      refs {duplicate.references.total} | events {duplicate.references.events} | follows {duplicate.references.follows}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
