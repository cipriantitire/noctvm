'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { GENRE_FILTERS } from './FilterBar';
import { 
  BellIcon, 
  EditIcon, 
  GlobeIcon, 
  InstagramIcon, 
  MapPinIcon, 
  MusicIcon, 
  ShieldIcon, 
  StarIcon, 
  TwitterIcon,
  TikTokIcon,
  FacebookIcon,
  SnapchatIcon,
  CogIcon,
  UserIcon,
  LayoutListIcon,
  ChevronRightIcon,
  GridIcon
} from '@/components/icons';

// ==================== SHARED COMPONENTS ====================

function BackButton({ onBack, label }: { onBack: () => void, label: string }) {
  return (
    <button
      onClick={onBack}
      className="flex items-center gap-2 text-noctvm-silver hover:text-white transition-colors mb-6 group"
    >
      <div className="w-8 h-8 rounded-lg bg-noctvm-midnight border border-noctvm-border flex items-center justify-center group-hover:bg-noctvm-surface transition-colors">
        <svg className="w-4 h-4 rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
      <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
    </button>
  );
}

function FormInput({ label, value, onChange, placeholder = '', type = 'text', title }: { label: string, value: string, onChange: (v: string) => void, placeholder?: string, type?: string, title?: string }) {
  return (
    <div className="space-y-1.5 text-left">
      <label className="text-[10px] font-bold text-noctvm-silver uppercase tracking-wider ml-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        title={title || label}
        className="w-full px-4 py-2.5 rounded-xl bg-noctvm-midnight border border-noctvm-border focus:border-noctvm-violet/40 transition-all outline-none text-sm text-white placeholder:text-noctvm-silver/30"
      />
    </div>
  );
}

function FormTextarea({ label, value, onChange, rows = 3 }: { label: string, value: string, onChange: (v: string) => void, rows?: number }) {
  return (
    <div className="space-y-1.5 text-left">
      <label className="text-[10px] font-bold text-noctvm-silver uppercase tracking-wider ml-1">{label}</label>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        title={label}
        className="w-full px-4 py-2.5 rounded-xl bg-noctvm-midnight border border-noctvm-border focus:border-noctvm-violet/40 transition-all outline-none text-sm text-white placeholder:text-noctvm-silver/30 resize-none"
      />
    </div>
  );
}

function FormSelect({ label, value, onChange, options, title }: { label: string, value: string, onChange: (v: string) => void, options: { value: string, label: string }[], title?: string }) {
  return (
    <div className="space-y-1.5 flex-1 text-left">
      <label className="text-[10px] font-bold text-noctvm-silver uppercase tracking-wider ml-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        title={title || label}
        className="w-full px-4 py-2.5 rounded-xl bg-noctvm-midnight border border-noctvm-border focus:border-noctvm-violet/40 transition-all outline-none text-sm text-white appearance-none cursor-pointer"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

function ToggleSwitch({ enabled, onToggle, label, desc }: { enabled: boolean, onToggle: () => void, label: string, desc?: string }) {
  return (
    <button
      onClick={onToggle}
      title={label}
      className="w-full flex items-center justify-between p-4 rounded-xl bg-noctvm-midnight/40 border border-noctvm-border hover:border-noctvm-violet/20 transition-all text-left"
    >
      <div>
        <p className="text-sm font-bold text-white">{label}</p>
        {desc && <p className="text-[11px] text-noctvm-silver mt-0.5">{desc}</p>}
      </div>
      <div className={`w-10 h-5 rounded-full transition-all relative ${enabled ? 'bg-noctvm-violet' : 'bg-noctvm-surface border border-noctvm-border'}`}>
        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${enabled ? 'left-6' : 'left-1'}`} />
      </div>
    </button>
  );
}

// ==================== MAIN SETTINGS HUB ====================

export function SettingsPage({ onBack }: { onBack: () => void }) {
  const { signOut } = useAuth();
  const [view, setView] = useState<'hub' | 'edit' | 'privacy' | 'account' | 'activity' | 'notifications' | 'inventory'>('hub');
  const menuItems = [
    { id: 'edit',     label: 'Edit Profile',   desc: 'Bio, music, genres, socials', icon: <EditIcon className="w-5 h-5 text-noctvm-violet" /> },
    { id: 'inventory',label: 'Inventory',      desc: 'Premium profile effects',      icon: <LayoutListIcon className="w-5 h-5 text-noctvm-emerald" /> },
    { id: 'privacy',  label: 'Privacy',        desc: 'Visibility & interactions',    icon: <ShieldIcon className="w-5 h-5 text-noctvm-emerald" /> },
    { id: 'account',  label: 'Account',        desc: 'Email, data, security',        icon: <UserIcon className="w-5 h-5 text-noctvm-silver" /> },
    { id: 'notifications', label: 'Notifications', desc: 'Alerts & preferences',      icon: <CogIcon className="w-5 h-5 text-noctvm-silver" /> },
    { id: 'activity', label: 'Activity Log',   desc: 'History of your actions',      icon: <EditIcon className="w-5 h-5 text-noctvm-violet" /> },
  ];

  if (view === 'edit')     return <EditProfilePage onBack={() => setView('hub')} />;
  if (view === 'inventory')return <InventoryPage onBack={() => setView('hub')} />;
  if (view === 'privacy')  return <PrivacySettingsPage onBack={() => setView('hub')} />;
  if (view === 'account')  return <ManageAccountPage onBack={() => setView('hub')} />;
  if (view === 'notifications') return <NotificationSettingsPage onBack={() => setView('hub')} />;
  if (view === 'activity') return <ActivityLogPage onBack={() => setView('hub')} />;

  return (
    <div className="max-w-lg mx-auto pb-24">
      <BackButton onBack={onBack} label="Back to Profile" />
      <h2 className="font-heading text-xl font-bold text-white mb-6">Settings</h2>

      <div className="space-y-2">
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => setView(item.id as any)}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] backdrop-blur-[40px] border border-white/5 hover:bg-white/[0.08] hover:border-noctvm-violet/30 transition-all duration-300 transform active:scale-[0.98] text-left group relative overflow-hidden"
            style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.2, 0.64, 1)' }}
          >
            {/* Specular Highlight */}
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
            
            <div className="w-10 h-10 rounded-xl bg-noctvm-surface border border-noctvm-border flex items-center justify-center group-hover:scale-105 transition-transform text-noctvm-violet shadow-lg shadow-noctvm-violet/10">
              {item.icon}
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-white leading-tight">{item.label}</p>
              <p className="text-[11px] text-noctvm-silver mt-0.5">{item.desc}</p>
            </div>
            <ChevronRightIcon className="w-4 h-4 text-noctvm-silver opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
          </button>
        ))}
      </div>

      <div className="mt-12 pt-6 border-t border-noctvm-border">
        <button
          onClick={() => { signOut(); onBack(); }}
          className="w-full p-4 rounded-xl bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 hover:border-red-500/20 transition-all text-left group active:scale-[0.98]"
          title="Log out of your account"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-red-500">Log Out</p>
              <p className="text-[11px] text-noctvm-silver mt-0.5">Sign out of your account</p>
            </div>
            <svg className="w-5 h-5 text-red-500 opacity-50 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
          </div>
        </button>
      </div>
    </div>
  );
}

// ==================== SUB-PAGES ====================

export function EditProfilePage({ onBack }: { onBack: () => void }) {
  const { profile, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [city, setCity] = useState(profile?.city || '');
  const [genres, setGenres] = useState<string[]>(Array.isArray(profile?.genres) ? profile.genres : []);
  const [genreSearch, setGenreSearch] = useState('');
  const [socialLinks, setSocialLinks] = useState<any[]>(Array.isArray(profile?.social_links) ? profile.social_links : []);
  const [musicType, setMusicType] = useState(profile?.music_link?.type || 'spotify');
  const [musicUrl, setMusicUrl] = useState(profile?.music_link?.url || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showPlatformDropdown, setShowPlatformDropdown] = useState(false);

  const GENRE_OPTIONS = GENRE_FILTERS.filter(g => g !== 'All');
  const PLATFORMS = ['instagram', 'facebook', 'twitter', 'tiktok', 'snapchat', 'website'];

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: displayName,
        username,
        bio,
        city,
        genres,
        music_link: musicUrl ? { type: musicType, url: musicUrl } : null,
        social_links: socialLinks.filter(l => l.url),
      })
      .eq('id', profile.id);
    
    if (!error) {
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  };

  const updateSocial = (platform: string, url: string) => {
    setSocialLinks(prev => {
      if (!url) return prev.filter(l => l.platform !== platform);
      const existing = prev.find(l => l.platform === platform);
      if (existing) {
        return prev.map(l => l.platform === platform ? { ...l, url } : l);
      }
      return [...prev, { platform, url }];
    });
  };

  const filteredGenreOptions = GENRE_OPTIONS.filter(g => 
    g.toLowerCase().includes(genreSearch.toLowerCase())
  );
  
  const unusedPlatforms = PLATFORMS.filter(p => !socialLinks.some(l => l.platform === p));

  return (
    <div className="max-w-xl mx-auto h-[75vh] flex flex-col">
      <div className="px-4 pt-2">
        <BackButton onBack={onBack} label="Settings" />
        <h3 className="font-heading text-xl font-bold text-white mb-6 text-left">Edit Profile</h3>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-12 scrollbar-hide space-y-8">
        {/* Core Info */}
        <div className="space-y-5">
          <FormInput label="Display Name" value={displayName} onChange={setDisplayName} />
          <FormInput label="Username" value={username} onChange={setUsername} />
          <FormTextarea label="Bio" value={bio} onChange={setBio} rows={3} />
          <FormInput label="City" value={city} onChange={setCity} />
        </div>

        {/* Music */}
        <div className="pt-6 border-t border-white/5">
          <p className="text-[10px] font-bold text-noctvm-violet uppercase tracking-widest mb-4 text-left">Music Presence</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <FormSelect label="Platform" value={musicType} onChange={setMusicType} options={[
               { value: 'spotify', label: 'Spotify' },
               { value: 'soundcloud', label: 'SoundCloud' },
               { value: 'youtube', label: 'YouTube' },
               { value: 'ytmusic', label: 'YT Music' },
             ]} />
             <FormInput label="Link URL" value={musicUrl} onChange={setMusicUrl} placeholder="https://..." />
          </div>
        </div>

        {/* Genres */}
        <div className="pt-6 border-t border-white/5 text-left">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-bold text-noctvm-violet uppercase tracking-widest">Favorite Genres</p>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white outline-none w-24 focus:w-32 focus:border-noctvm-violet/40 transition-all"
                value={genreSearch}
                onChange={(e) => setGenreSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto scrollbar-hide p-1">
            {filteredGenreOptions.length > 0 ? (
              filteredGenreOptions.map(g => (
                <button
                  key={g}
                  onClick={() => setGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${
                    genres.includes(g) 
                      ? 'bg-noctvm-violet border-noctvm-violet text-white shadow-glow' 
                      : 'bg-white/5 border-white/10 text-noctvm-silver hover:border-white/20'
                  } active:scale-95`}
                  title={`Toggle ${g} genre`}
                >
                  {g}
                </button>
              ))
            ) : (
              <p className="text-[10px] text-noctvm-silver/40">No genres found...</p>
            )}
          </div>
        </div>

        {/* Socials */}
        <div className="pt-6 border-t border-white/5 text-left">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-bold text-noctvm-violet uppercase tracking-widest">Social Connections</p>
            {unusedPlatforms.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowPlatformDropdown(!showPlatformDropdown)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] text-noctvm-silver hover:text-white hover:bg-white/10 transition-all active:scale-95"
                  title="Add a social media link"
                >
                  <span>Add Social</span>
                  <svg className={`w-3 h-3 transition-transform ${showPlatformDropdown ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 9l-7 7-7-7" /></svg>
                </button>
                {showPlatformDropdown && (
                  <div className="absolute right-0 top-full mt-1 z-50 bg-[#0A0A0A] border border-white/10 rounded-xl shadow-2xl py-1 min-w-[120px] animate-in fade-in slide-in-from-top-1">
                    {unusedPlatforms.map(p => (
                      <button
                        key={p}
                        onClick={() => {
                          updateSocial(p, ' '); // Temporary space to show it
                          setShowPlatformDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 text-[10px] text-noctvm-silver hover:text-white hover:bg-white/5 capitalize active:scale-95"
                        title={`Add ${p} link`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="space-y-3">
            {socialLinks.length > 0 ? (
              socialLinks.map(link => {
                const p = link.platform;
                const Icon = p === 'instagram' ? InstagramIcon :
                            p === 'twitter' ? TwitterIcon :
                            p === 'tiktok' ? TikTokIcon : 
                            p === 'facebook' ? FacebookIcon :
                            p === 'snapchat' ? SnapchatIcon : GlobeIcon;
                return (
                  <div key={p} className="relative group animate-in fade-in slide-in-from-left-2">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-noctvm-silver/40 group-focus-within:text-noctvm-violet transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      placeholder={`${p.charAt(0).toUpperCase() + p.slice(1)} URL`}
                      value={link.url === ' ' ? '' : link.url}
                      onChange={(e) => updateSocial(p, e.target.value)}
                      className="w-full pl-12 pr-10 py-3 rounded-xl bg-noctvm-midnight/50 border border-white/5 focus:border-noctvm-violet/30 transition-all outline-none text-sm text-white placeholder:text-noctvm-silver/20"
                    />
                    <button 
                      onClick={() => updateSocial(p, '')}
                      title={`Remove ${p} link`}
                      aria-label={`Remove ${p} link`}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/20 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all active:scale-95"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                );
              })
            ) : (
                <div className="py-8 text-center bg-white/[0.02] border border-dashed border-white/5 rounded-xl">
                    <p className="text-[10px] text-noctvm-silver/30">No social links added yet</p>
                </div>
            )}
          </div>
        </div>

        <div className="pt-4 pb-8">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-4 rounded-xl bg-noctvm-violet text-white text-sm font-bold shadow-lg shadow-noctvm-violet/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
          >
            {saving ? 'Saving...' : saved ? 'Success!' : 'Save All Changes'}
          </button>
        </div>

        {/* Integrated Inventory Section */}
        <div className="mt-8 pt-8 border-t border-white/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-yellow-500/10 rounded-xl">
              <StarIcon className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-heading">Premium Profile Effects</h3>
              <p className="text-xs text-noctvm-silver/50">Purchase and select visual enhancers</p>
            </div>
          </div>
          <InventoryPage onBack={() => {}} hideHeader={true} />
        </div>
      </div>
    </div>
  );
}

export function PrivacySettingsPage({ onBack }: { onBack: () => void }) {
  const [mentions, setMentions] = useState('everyone');
  const [isPrivate, setIsPrivate] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [canComment, setCanComment] = useState('everyone');
  const [canRemix, setCanRemix] = useState('everyone');

  return (
    <div className="max-w-xl mx-auto px-4 h-[75vh] flex flex-col">
      <div className="pt-2">
        <BackButton onBack={onBack} label="Settings" />
        <h3 className="font-heading text-xl font-bold text-white mb-6 text-left">Privacy & Safety</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto pb-12 space-y-8 scrollbar-hide">
        {/* Profile Visibility */}
        <div className="space-y-4">
          <p className="text-[10px] font-bold text-noctvm-emerald uppercase tracking-widest text-left">Discovery</p>
          <ToggleSwitch 
            enabled={isPrivate} 
            onToggle={() => setIsPrivate(!isPrivate)} 
            label="Private Profile" 
            desc="Only followers can see your posts and highlights" 
          />
          <ToggleSwitch 
            enabled={showStats} 
            onToggle={() => setShowStats(!showStats)} 
            label="Show Stats" 
            desc="Display your Posts, Network, and Activity counts publically" 
          />
        </div>

        {/* Interactions */}
        <div className="pt-6 border-t border-white/5 space-y-4">
          <p className="text-[10px] font-bold text-noctvm-violet uppercase tracking-widest text-left">Interactions</p>
          <FormSelect 
            label="Who can mention you?" 
            value={mentions} 
            onChange={setMentions} 
            options={[
              { value: 'everyone', label: 'Everyone' },
              { value: 'following', label: 'People You Follow' },
              { value: 'none', label: 'No One' },
            ]} 
          />
          <FormSelect 
            label="Who can comment on posts?" 
            value={canComment} 
            onChange={setCanComment} 
            options={[
              { value: 'everyone', label: 'Everyone' },
              { value: 'following', label: 'People You Follow' },
              { value: 'none', label: 'No One' },
            ]} 
          />
          <FormSelect 
            label="Who can share/repost your content?" 
            value={canRemix} 
            onChange={setCanRemix} 
            options={[
              { value: 'everyone', label: 'Everyone' },
              { value: 'following', label: 'People You Follow' },
              { value: 'none', label: 'No One' },
            ]} 
          />
        </div>

        {/* Blocked Users */}
        <div className="pt-6 border-t border-white/5 text-left">
          <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-4">Safety</p>
          <button className="w-full flex items-center justify-between p-4 rounded-xl bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 transition-all text-left group">
            <div>
              <p className="text-sm font-bold text-red-500">Blocked Users</p>
              <p className="text-[11px] text-noctvm-silver mt-0.5">Manage accounts you have restricted</p>
            </div>
            <ChevronRightIcon className="w-4 h-4 text-red-500/50 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ActivityLogPage({ onBack }: { onBack: () => void }) {
  const { profile } = useAuth();
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    // Mocking combined activity for now: including posts + log entries
    const fetchActivities = async () => {
      const { data: logs } = await supabase
        .from('user_activity')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(30);
      
      const { data: posts } = await supabase
        .from('posts')
        .select('id, caption, created_at')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(20);

      const combined = [
        ...(logs || []).map(l => ({ ...l, type: 'action' })),
        ...(posts || []).map(p => ({ 
          id: p.id, 
          message: `Shared a post: "${p.caption.slice(0, 30)}..."`, 
          created_at: p.created_at, 
          type: 'post' 
        }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setActivities(combined);
      setLoading(false);
    };

    fetchActivities();
  }, [profile]);

  return (
    <div className="max-w-xl mx-auto px-4 h-[75vh] flex flex-col">
      <div className="pt-2">
        <BackButton onBack={onBack} label="Settings" />
        <h3 className="font-heading text-xl font-bold text-white mb-6 text-left text-glow-emerald">Activity Journal</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto pb-12 space-y-4 scrollbar-hide">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 opacity-40">
            <div className="w-10 h-10 rounded-full border-2 border-noctvm-violet border-t-transparent animate-spin" />
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-noctvm-violet">Retrieving Timeline...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-24 text-noctvm-silver/30">
            <LayoutListIcon className="w-12 h-12 mx-auto mb-4 opacity-10" />
            <p className="text-xs font-medium">Your nightlife journey starts here.</p>
          </div>
        ) : (
          <div className="space-y-6 relative">
            <div className="absolute left-6 top-2 bottom-2 w-px bg-white/5" />
            {activities.map((a, i) => (
              <div key={a.id + i} className="flex gap-6 group">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all z-10 ${
                  a.type === 'post' ? 'bg-noctvm-violet/20 text-noctvm-violet border border-noctvm-violet/30' : 'bg-noctvm-midnight/50 text-noctvm-silver border border-white/5'
                }`}>
                  {a.type === 'post' ? <GridIcon className="w-5 h-5" /> : <ShieldIcon className="w-5 h-5" />}
                </div>
                <div className="flex-1 pt-1 border-b border-white/[0.03] pb-6 last:border-0">
                  <p className="text-[13px] text-white/90 leading-relaxed font-medium">{a.message}</p>
                  <p className="text-[10px] text-noctvm-silver/40 mt-1.5 font-bold uppercase tracking-wider">{new Date(a.created_at).toLocaleDateString()} • {new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function NotificationSettingsPage({ onBack }: { onBack: () => void }) {
  const [pushNotifs, setPushNotifs] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(true);

  return (
    <div className="max-w-xl mx-auto px-4">
      <BackButton onBack={onBack} label="Settings" />
      <h3 className="font-heading text-xl font-bold text-white mb-6 text-left">Notifications</h3>
      
      <div className="space-y-6">
        <div className="space-y-2">
           <ToggleSwitch enabled={pushNotifs} onToggle={() => setPushNotifs(!pushNotifs)} label="Social Activity" desc="Follows, mentions, and shares" />
           <ToggleSwitch enabled={emailNotifs} onToggle={() => setEmailNotifs(!emailNotifs)} label="Marketing & Tips" desc="New features and venue discovery" />
        </div>
      </div>
    </div>
  );
}

export function InventoryPage({ onBack, hideHeader = false }: { onBack: () => void, hideHeader?: boolean }) {
  const premiumEffects = [
    { id: 'neon_ring', name: 'Neon Avatar Ring', price: '500 MR', locked: true },
    { id: 'emerald_badge', name: 'Emerald VIP Badge', price: '1000 MR', locked: true },
    { id: 'animated_bio', name: 'Animated Bio Text', price: '250 MR', locked: true },
  ];

  return (
    <div className={`max-w-xl mx-auto px-4 ${hideHeader ? '' : 'h-[75vh] flex flex-col'}`}>
      {!hideHeader && (
        <div className="pt-2">
          <BackButton onBack={onBack} label="Settings" />
          <h3 className="font-heading text-xl font-bold text-white mb-6 text-left text-glow-emerald">Vanity Inventory</h3>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pb-12 space-y-4 scrollbar-hide">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-noctvm-violet/20 to-noctvm-midnight border border-noctvm-violet/30 mb-6">
          <p className="text-xs font-bold text-noctvm-violet uppercase tracking-widest mb-1">Your Stash</p>
          <p className="text-[11px] text-noctvm-silver leading-relaxed">Customize your presence with premium gear unlocked from the Boutique.</p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {premiumEffects.map(effect => (
            <div key={effect.id} className="p-4 rounded-xl bg-noctvm-surface border border-white/5 opacity-50 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-white">{effect.name}</p>
                <p className="text-[10px] text-noctvm-silver font-bold uppercase tracking-widest mt-0.5">{effect.price}</p>
              </div>
              {effect.locked && <ShieldIcon className="w-4 h-4 text-noctvm-silver/30" />}
            </div>
          ))}
        </div>

        <button className="w-full py-4 rounded-xl bg-noctvm-surface border border-noctvm-border text-xs font-bold text-noctvm-silver mt-8 hover:bg-noctvm-midnight transition-all"> Visit Boutique for more </button>
      </div>
    </div>
  );
}

export function ManageAccountPage({ onBack }: { onBack: () => void }) {
  return (
    <div className="max-w-xl mx-auto px-4">
      <BackButton onBack={onBack} label="Settings" />
      <h3 className="font-heading text-xl font-bold text-white mb-6 text-left text-glow-emerald">Account Portal</h3>
      <div className="space-y-4">
        <div className="p-6 rounded-2xl bg-noctvm-surface/40 border border-noctvm-border">
          <p className="text-[10px] font-bold text-noctvm-silver uppercase tracking-widest mb-4">Identity</p>
          <div className="space-y-4">
            <FormInput label="Email Address" value="user@example.com" onChange={() => {}} title="Email is managed via Auth" />
            <button className="text-[11px] font-bold text-noctvm-violet hover:underline">Change Password</button>
          </div>
        </div>

        <button className="w-full p-4 rounded-xl bg-red-500/5 border border-red-500/10 text-red-500 text-xs font-bold hover:bg-red-500/10 transition-all text-left">
          Request Data Export
        </button>
      </div>
    </div>
  );
}

export function AddLocationPage({ onBack }: { onBack: () => void }) {
  return (
    <div className="max-w-lg mx-auto px-4">
      <BackButton onBack={onBack} label="Profile" />
      <h3 className="font-heading text-xl font-bold text-white mb-6 text-left">Add Location</h3>
      <div className="p-8 text-center text-noctvm-silver text-sm border-2 border-dashed border-noctvm-border rounded-2xl">
        Search for your business or location to add it.
      </div>
    </div>
  );
}

export function ClaimLocationPage({ onBack }: { onBack: () => void }) {
  return (
    <div className="max-w-lg mx-auto px-4">
      <BackButton onBack={onBack} label="Profile" />
      <h3 className="font-heading text-xl font-bold text-white mb-6 text-left">Claim Your Venue</h3>
      <div className="p-8 text-center text-noctvm-silver text-sm border-2 border-dashed border-noctvm-border rounded-2xl">
        Verify ownrship to manage your venue profile and events.
      </div>
    </div>
  );
}
