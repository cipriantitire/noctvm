'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useScrollFade } from '@/hooks/useScrollFade';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Venue } from '@/lib/types';
import VerifiedBadge from '@/components/VerifiedBadge';
import { 
  XIcon, 
  MapPinIcon, 
  UsersIcon, 
  CalendarIcon, 
  StarIcon, 
  EditIcon, 
  ChatIcon,
  LinkIcon,
  ChevronRightIcon
} from './icons';
import Image from 'next/image';
import { getVenueLogo } from '@/lib/venue-logos';

interface ManageVenueModalProps {
  isOpen: boolean;
  onClose: () => void;
  venueId: string;
}

interface VenueStats {
  followers: number;
  upcoming_events: number;
  rating: number;
  review_count: number;
}

export default function ManageVenueModal({ isOpen, onClose, venueId }: ManageVenueModalProps) {
  const { user, profile } = useAuth();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [stats, setStats] = useState<VenueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'reviews' | 'settings'>('overview');
  const { ref: tabsRef, maskStyle: tabsMaskStyle } = useScrollFade('x');
  const { ref: contentRef, maskStyle: contentMaskStyle } = useScrollFade('y');

  const fetchVenueData = useCallback(async () => {
    if (!venueId) return;
    setLoading(true);

    try {
      // Fetch venue details
      const { data: venueData, error: venueError } = await supabase
        .from('venues')
        .select('*')
        .eq('id', venueId)
        .single();

      if (venueError) throw venueError;
      setVenue(venueData as Venue);

      // Fetch stats
      const [followsRes, eventsRes, reviewsRes] = await Promise.all([
        supabase.from('follows').select('id', { count: 'exact' }).eq('target_id', venueId).eq('target_type', 'venue'),
        supabase.from('events').select('id', { count: 'exact' }).eq('venue', venueData.name).gte('date', new Date().toISOString().split('T')[0]),
        supabase.from('venue_reviews').select('rating', { count: 'exact' }).eq('venue_name', venueData.name)
      ]);

      const reviewData = reviewsRes.data || [];
      const rating = reviewData.length > 0 
        ? reviewData.reduce((acc, r) => acc + r.rating, 0) / reviewData.length 
        : (venueData.rating || 0);

      setStats({
        followers: followsRes.count || 0,
        upcoming_events: eventsRes.count || 0,
        rating: rating,
        review_count: reviewsRes.count || 0
      });
    } catch (err) {
      console.error('Error fetching venue data:', err);
    } finally {
      setLoading(false);
    }
  }, [venueId]);

  useEffect(() => {
    if (isOpen) {
      fetchVenueData();
    }
  }, [isOpen, fetchVenueData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-overlay flex items-center justify-center p-0 sm:p-4 lg:p-8">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-xl animate-fade-in" 
        onClick={onClose} 
      />

      {/* Modal Content */}
      <div className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-2xl bg-noctvm-black sm:rounded-[2.5rem] border-0 sm:border border-white/10 overflow-hidden shadow-2xl flex flex-col animate-scale-in frosted-noise">
        {/* Header */}
        <div className="p-6 pb-4 flex items-center justify-between border-b border-white/5 bg-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-noctvm-midnight border border-white/10 overflow-hidden relative shadow-lg">
              {venue && (
                <Image 
                  src={getVenueLogo(venue.name, venue.logo_url)} 
                  alt={venue.name} 
                  fill 
                  className="object-cover"
                />
              )}
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-white flex items-center gap-2">
                Manage {venue?.name || 'Venue'}
                {venue?.is_verified && <VerifiedBadge type={venue.badge} size="xs" />}
              </h2>
              <p className="text-noctvm-caption text-noctvm-silver/50 font-mono uppercase tracking-widest">Ownership Verified</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-noctvm-silver hover:text-white transition-all hover:bg-white/10"
            title="Close"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div ref={tabsRef} style={tabsMaskStyle} className="flex px-4 py-2 border-b border-white/5 bg-white/2 gap-1 overflow-x-auto no-scrollbar">
          {(['overview', 'events', 'reviews', 'settings'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-noctvm-caption font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
                activeTab === tab 
                  ? 'bg-noctvm-violet text-white shadow-lg shadow-noctvm-violet/20' 
                  : 'text-noctvm-silver/40 hover:text-noctvm-silver hover:bg-white/5'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div ref={contentRef} style={contentMaskStyle} className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-8 h-8 border-2 border-noctvm-violet/20 border-t-noctvm-violet rounded-full animate-spin" />
              <p className="text-noctvm-caption text-noctvm-silver font-mono uppercase tracking-widest animate-pulse">Syncing Data...</p>
            </div>
          ) : venue ? (
            <div className="space-y-6 animate-fade-in">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-4 rounded-3xl bg-white/5 border border-white/5 flex flex-col items-center text-center group hover:border-noctvm-violet/30 transition-colors">
                      <span className="text-xl font-black text-white group-hover:text-noctvm-violet transition-colors">{stats?.followers}</span>
                      <span className="text-noctvm-xs uppercase font-mono tracking-widest text-noctvm-silver/50 mt-1">Followers</span>
                    </div>
                    <div className="p-4 rounded-3xl bg-white/5 border border-white/5 flex flex-col items-center text-center group hover:border-noctvm-emerald/30 transition-colors">
                      <span className="text-xl font-black text-white group-hover:text-noctvm-emerald transition-colors">{stats?.upcoming_events}</span>
                      <span className="text-noctvm-xs uppercase font-mono tracking-widest text-noctvm-silver/50 mt-1">Events</span>
                    </div>
                    <div className="p-4 rounded-3xl bg-white/5 border border-white/5 flex flex-col items-center text-center group hover:border-noctvm-gold/30 transition-colors">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xl font-black text-white group-hover:text-noctvm-gold transition-colors">{stats?.rating.toFixed(1)}</span>
                        <StarIcon className="w-4 h-4 text-noctvm-gold mb-1" />
                      </div>
                      <span className="text-noctvm-xs uppercase font-mono tracking-widest text-noctvm-silver/50 mt-1">{stats?.review_count} Reviews</span>
                    </div>
                    <div className="p-4 rounded-3xl bg-white/5 border border-white/5 flex flex-col items-center text-center group hover:border-purple-400/30 transition-colors">
                      <span className="text-xl font-black text-white group-hover:text-purple-400 transition-colors">1.2k</span>
                      <span className="text-noctvm-xs uppercase font-mono tracking-widest text-noctvm-silver/50 mt-1">Check-ins</span>
                    </div>
                  </div>

                  {/* Actions Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button className="flex items-center gap-4 p-4 rounded-[2rem] bg-gradient-to-br from-noctvm-violet/20 to-purple-900/10 border border-noctvm-violet/30 hover:scale-[1.02] active:scale-[0.98] transition-all group text-left">
                      <div className="w-12 h-12 rounded-2xl bg-noctvm-violet flex items-center justify-center text-white shadow-lg shadow-noctvm-violet/20 group-hover:rotate-6 transition-transform">
                        <EditIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white uppercase tracking-tight">Edit Venue Profile</p>
                        <p className="text-noctvm-caption text-noctvm-silver/60">Update info, images, & contact</p>
                      </div>
                    </button>

                    <button className="flex items-center gap-4 p-4 rounded-[2rem] bg-white/5 border border-white/10 hover:border-noctvm-emerald/30 hover:scale-[1.02] active:scale-[0.98] transition-all group text-left">
                      <div className="w-12 h-12 rounded-2xl bg-noctvm-emerald/20 flex items-center justify-center text-noctvm-emerald border border-noctvm-emerald/30 group-hover:-rotate-6 transition-transform">
                        <CalendarIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white uppercase tracking-tight">Create Event</p>
                        <p className="text-noctvm-caption text-noctvm-silver/60">Schedule a new social or party</p>
                      </div>
                    </button>

                    <button className="flex items-center gap-4 p-4 rounded-[2rem] bg-white/5 border border-white/10 hover:border-noctvm-gold/30 hover:scale-[1.02] active:scale-[0.98] transition-all group text-left">
                      <div className="w-12 h-12 rounded-2xl bg-noctvm-gold/20 flex items-center justify-center text-noctvm-gold border border-noctvm-gold/30 group-hover:scale-110 transition-transform">
                        <ChatIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white uppercase tracking-tight">View Reviews</p>
                        <p className="text-noctvm-caption text-noctvm-silver/60">Manage & reply to feedback</p>
                      </div>
                    </button>

                    <button className="flex items-center gap-4 p-4 rounded-[2rem] bg-white/5 border border-white/10 hover:border-purple-400/30 hover:scale-[1.02] active:scale-[0.98] transition-all group text-left">
                      <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400 border border-purple-500/30 group-hover:translate-x-1 transition-transform">
                        <UsersIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white uppercase tracking-tight">Manage Team</p>
                        <p className="text-noctvm-caption text-noctvm-silver/60">Add admins or staff roles</p>
                      </div>
                    </button>
                  </div>

                  {/* Quick Info Box */}
                  <div className="p-6 rounded-[2.5rem] bg-noctvm-midnight/50 border border-white/5 space-y-4">
                    <h3 className="text-noctvm-caption font-black uppercase tracking-widest text-noctvm-silver/40 px-1">Venue Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       <div className="flex items-center gap-3">
                         <MapPinIcon className="w-4 h-4 text-noctvm-violet" />
                         <span className="text-xs text-noctvm-silver truncate">{venue.address}</span>
                       </div>
                       <div className="flex items-center gap-3">
                         <UsersIcon className="w-4 h-4 text-noctvm-emerald" />
                         <span className="text-xs text-noctvm-silver">Capacity: {venue.capacity || 'Unknown'}</span>
                       </div>
                       <div className="flex items-center gap-3">
                         <LinkIcon className="w-4 h-4 text-noctvm-gold" />
                         <span className="text-xs text-noctvm-silver truncate">{venue.website || 'No website'}</span>
                       </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'events' && (
                <div className="py-10 text-center space-y-4">
                  <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-noctvm-silver/20">
                    <CalendarIcon className="w-10 h-10" />
                  </div>
                  <h4 className="text-sm font-bold text-white uppercase tracking-tight">Event Management Coming Soon</h4>
                  <p className="text-xs text-noctvm-silver/60 max-w-xs mx-auto">Soon you&apos;ll be able to schedule, edit and promote your events directly from here.</p>
                  <button className="px-6 py-2.5 rounded-xl bg-noctvm-violet text-white text-noctvm-caption font-bold uppercase tracking-widest hover:scale-105 active:scale-[0.96] transition-all">
                    Go to Dashboard
                  </button>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="py-10 text-center space-y-4">
                  <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-noctvm-silver/20">
                    <ChatIcon className="w-10 h-10" />
                  </div>
                  <h4 className="text-sm font-bold text-white uppercase tracking-tight">Review Center Coming Soon</h4>
                  <p className="text-xs text-noctvm-silver/60 max-w-xs mx-auto">Reply to your fans and manage your venue&apos;s reputation with advanced insights.</p>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-4">
                  <h3 className="text-noctvm-caption font-black uppercase tracking-widest text-noctvm-silver/40 px-1">Venue Settings</h3>
                  <div className="space-y-2">
                    <button className="w-full flex items-center justify-between p-4 rounded-3xl bg-white/5 border border-white/5 hover:border-noctvm-violet/30 transition-all text-left group">
                      <div>
                        <p className="text-sm font-bold text-white uppercase tracking-tight">Visibility</p>
                        <p className="text-noctvm-caption text-noctvm-silver/60">Public · Searchable on Map</p>
                      </div>
                      <ChevronRightIcon className="w-4 h-4 text-noctvm-silver/30 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button className="w-full flex items-center justify-between p-4 rounded-3xl bg-white/5 border border-white/5 hover:border-noctvm-violet/30 transition-all text-left group">
                      <div>
                        <p className="text-sm font-bold text-white uppercase tracking-tight">Verification</p>
                        <p className="text-noctvm-caption text-noctvm-emerald/80 font-bold">✓ Active · Gold Badge</p>
                      </div>
                      <ChevronRightIcon className="w-4 h-4 text-noctvm-silver/30 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button className="w-full flex items-center justify-between p-4 rounded-3xl bg-white/5 border border-white/5 hover:border-red-500/30 transition-all text-left group">
                      <div>
                        <p className="text-sm font-bold var(--noctvm-rose) uppercase tracking-tight text-red-400">Transfer Ownership</p>
                        <p className="text-noctvm-caption text-noctvm-silver/60">Transfer to another verified user</p>
                      </div>
                      <ChevronRightIcon className="w-4 h-4 text-noctvm-silver/30 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-20 text-noctvm-silver/40 italic text-sm">
              Venue not found or access denied.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 bg-white/5 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-noctvm-silver text-noctvm-caption font-bold uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
