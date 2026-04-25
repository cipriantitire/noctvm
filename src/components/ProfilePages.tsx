'use client';
import { useState, useEffect, useCallback, useLayoutEffect, useRef } from 'react';
import { useScrollFade } from '@/hooks/useScrollFade';

// ── Social link URL helpers ──────────────────────────────────────────────────

const PLATFORM_BASE: Record<string, string> = {
  instagram: 'https://instagram.com/',
  facebook:  'https://facebook.com/',
  twitter:   'https://twitter.com/',
  tiktok:    'https://tiktok.com/@',
  snapchat:  'https://snapchat.com/add/',
};

/** Given a raw input value (username or full URL), return a full https URL. */
function buildSocialUrl(platform: string, value: string): string {
  const v = value.trim();
  if (!v) return '';
  if (platform === 'website') {
    return v.startsWith('http') ? v : `https://${v}`;
  }
  if (v.startsWith('http')) return v;
  const base = PLATFORM_BASE[platform] ?? 'https://';
  return base + v.replace(/^@/, '');
}

/** Extract a displayable username from a stored full URL for use in the input field. */
function usernameFromUrl(platform: string, url: string): string {
  if (platform === 'website') return url;
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split('/').filter(Boolean);
    const last = parts[parts.length - 1] ?? '';
    return last.replace(/^@/, '');
  } catch {
    return url;
  }
}

const settingsScrollPositions = new Map<string, number>();

function useSettingsScrollMemory(storageKey: string) {
  const scrollRef = useRef<HTMLDivElement>(null) as React.MutableRefObject<HTMLDivElement | null>;

  useLayoutEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    element.scrollTop = settingsScrollPositions.get(storageKey) ?? 0;
  }, [storageKey]);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    const handleScroll = () => {
      settingsScrollPositions.set(storageKey, element.scrollTop);
    };

    handleScroll();
    element.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      settingsScrollPositions.set(storageKey, element.scrollTop);
      element.removeEventListener('scroll', handleScroll);
    };
  }, [storageKey]);

  return scrollRef;
}

// ────────────────────────────────────────────────────────────────────────────
import NextImage from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { uploadOptimizedImage } from '@/lib/image-optimization';
import { useSettings } from '@/hooks/useSettings';
import { GlassPanel } from '@/components/ui';
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

type SettingsMenuItem = {
  id: string;
  label: string;
  desc: string;
  icon: JSX.Element;
};

function SettingsGroup({
  title,
  description,
  items,
  onSelect,
}: {
  title: string;
  description: string;
  items: SettingsMenuItem[];
  onSelect: (id: string) => void;
}) {
  return (
    <GlassPanel variant="subtle" className="overflow-hidden rounded-[24px]">
      <div className="px-4 pt-4 pb-2.5">
        <p className="text-noctvm-caption font-mono text-noctvm-micro uppercase tracking-[0.28em] text-noctvm-silver/45">
          {title}
        </p>
        <p className="mt-1 text-xs text-noctvm-silver/60">{description}</p>
      </div>

      <div className="divide-y divide-white/5">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className="group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.04] active:bg-white/[0.06]"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/5 bg-noctvm-midnight/80 text-noctvm-violet transition-transform group-hover:scale-[1.03]">
              {item.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-heading text-sm font-semibold text-foreground">{item.label}</p>
              <p className="mt-0.5 text-xs leading-snug text-noctvm-silver/70">{item.desc}</p>
            </div>
            <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 text-noctvm-silver/40 transition-all group-hover:translate-x-1 group-hover:text-foreground" />
          </button>
        ))}
      </div>
    </GlassPanel>
  );
}

// ==================== SHARED COMPONENTS ====================

function BackButton({ onBack, label }: { onBack: () => void, label: string }) {
  return (
    <button
      onClick={onBack}
      className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-foreground/90 transition-colors hover:border-white/20 hover:bg-white/[0.06]"
      aria-label={label}
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
        <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span
        className="whitespace-nowrap text-noctvm-caption font-mono font-bold uppercase tracking-[0.16em] leading-none"
        style={{ color: 'rgb(229 231 235)', WebkitTextFillColor: 'rgb(229 231 235)', opacity: 1 }}
      >
        {label}
      </span>
    </button>
  );
}

function SettingsPageHeader({
  title,
  subtitle,
  onBack,
  backLabel,
  titleClassName = 'text-xl sm:text-2xl font-semibold tracking-tight text-foreground leading-tight',
  subtitleClassName = 'text-noctvm-caption font-mono text-[10px] uppercase tracking-[0.28em] text-noctvm-silver/45',
}: {
  title: string;
  subtitle?: string;
  onBack: () => void;
  backLabel: string;
  titleClassName?: string;
  subtitleClassName?: string;
}) {
  return (
    <div className="relative z-10 mb-4 sm:mb-5">
      <div className="flex w-full items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2
            className={`${titleClassName} w-full break-words`}
            style={{ color: 'rgb(255 255 255)', WebkitTextFillColor: 'rgb(255 255 255)', opacity: 1 }}
          >
            {title}
          </h2>
          {subtitle && <p className={`${subtitleClassName} mt-1 w-full break-words`}>{subtitle}</p>}
        </div>
        <BackButton onBack={onBack} label={backLabel} />
      </div>
    </div>
  );
}

function FormInput({ label, value, onChange, placeholder = '', type = 'text', title }: { label: string, value: string, onChange: (v: string) => void, placeholder?: string, type?: string, title?: string }) {
  return (
    <div className="space-y-1.5 text-left">
      <label className="ml-1 text-noctvm-caption font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-noctvm-silver/50">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        title={title || label}
        className="w-full rounded-[20px] border border-white/5 bg-noctvm-surface/25 px-4 py-3 text-sm text-foreground outline-none transition-all placeholder:text-noctvm-silver/30 focus:border-noctvm-violet/30 focus:bg-white/[0.05]"
      />
    </div>
  );
}

function FormTextarea({ label, value, onChange, rows = 3 }: { label: string, value: string, onChange: (v: string) => void, rows?: number }) {
  return (
    <div className="space-y-1.5 text-left">
      <label className="ml-1 text-noctvm-caption font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-noctvm-silver/50">{label}</label>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        title={label}
        className="w-full resize-none rounded-[20px] border border-white/5 bg-noctvm-surface/25 px-4 py-3 text-sm text-foreground outline-none transition-all placeholder:text-noctvm-silver/30 focus:border-noctvm-violet/30 focus:bg-white/[0.05]"
      />
    </div>
  );
}

function FormSelect({ label, value, onChange, options, title }: { label: string, value: string, onChange: (v: string) => void, options: { value: string, label: string }[], title?: string }) {
  return (
    <div className="space-y-1.5 flex-1 text-left">
      <label className="ml-1 text-noctvm-caption font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-noctvm-silver/50">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        title={title || label}
        className="w-full cursor-pointer appearance-none rounded-[20px] border border-white/5 bg-noctvm-surface/25 px-4 py-3 text-sm text-foreground outline-none transition-all focus:border-noctvm-violet/30 focus:bg-white/[0.05]"
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
      className="group flex w-full items-center justify-between rounded-[24px] border border-white/5 bg-noctvm-surface/25 px-4 py-4 text-left transition-all hover:border-white/10 hover:bg-white/[0.05]"
    >
      <div className="min-w-0 pr-4">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {desc && <p className="mt-1 text-noctvm-label leading-snug text-noctvm-silver">{desc}</p>}
      </div>
      <div className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors ${enabled ? 'border-noctvm-violet/30 bg-noctvm-violet/20' : 'border-white/5 bg-white/[0.03]'}`}>
        <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-lg transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </div>
    </button>
  );
}

// ==================== MAIN SETTINGS HUB ====================

type EditProfileOrigin = 'profile' | 'settings';

export function SettingsPage({
  onBack,
  initialView = 'hub',
  editProfileOrigin = 'settings',
  onEditProfileBack,
}: {
  onBack: () => void,
  initialView?: string,
  editProfileOrigin?: EditProfileOrigin,
  onEditProfileBack?: () => void,
}) {
  const { signOut } = useAuth();
  const [view, setView] = useState(initialView);
  const [activeEditProfileOrigin, setActiveEditProfileOrigin] = useState<EditProfileOrigin>(editProfileOrigin);
  const scrollRef = useSettingsScrollMemory('settings-hub');
  const { ref: fadeRef, maskStyle } = useScrollFade('y');
  const menuItems: SettingsMenuItem[] = [
    { id: 'edit',          label: 'Edit Profile',    desc: 'Avatar, bio, music, socials', icon: <EditIcon className="w-5 h-5 text-noctvm-violet" /> },
    { id: 'account',       label: 'Account',         desc: 'Email, password, security',   icon: <UserIcon className="w-5 h-5 text-noctvm-silver" /> },
    { id: 'privacy',       label: 'Privacy',         desc: 'Visibility & interactions',   icon: <ShieldIcon className="w-5 h-5 text-noctvm-emerald" /> },
    { id: 'notifications', label: 'Notifications',  desc: 'Alerts & preferences',        icon: <BellIcon className="w-5 h-5 text-noctvm-silver" /> },
    { id: 'appearance',    label: 'Appearance',     desc: 'Theme & visual preferences',  icon: <GlobeIcon className="w-5 h-5 text-noctvm-violet" /> },
    { id: 'blocked_muted', label: 'Blocked & Muted', desc: 'Restricted users',            icon: <ShieldIcon className="w-5 h-5 text-red-500" /> },
    { id: 'inventory',     label: 'Inventory',       desc: 'Premium profile effects',     icon: <StarIcon className="w-5 h-5 text-noctvm-emerald" /> },
    { id: 'activity',      label: 'Activity Log',    desc: 'Audit trail of events',       icon: <LayoutListIcon className="w-5 h-5 text-noctvm-violet" /> },
    { id: 'add_location',  label: 'Add Location',    desc: 'List a new venue or club',   icon: <MapPinIcon className="w-5 h-5 text-noctvm-silver" /> },
    { id: 'claim_location',label: 'Claim Location',  desc: 'Verify venue ownership',      icon: <ShieldIcon className="w-5 h-5 text-noctvm-silver" /> },
  ];

  const getItem = (id: string) => menuItems.find((item) => item.id === id)!;
  const menuGroups = [
    {
      title: 'Profile',
      description: 'Identity and account access',
      items: [getItem('edit'), getItem('account')],
    },
    {
      title: 'Preferences',
      description: 'Visibility, alerts, and appearance',
      items: [getItem('privacy'), getItem('notifications'), getItem('appearance')],
    },
    {
      title: 'Safety',
      description: 'Boundaries and activity history',
      items: [getItem('blocked_muted'), getItem('activity')],
    },
    {
      title: 'Tools',
      description: 'Inventory and venue workflows',
      items: [getItem('inventory'), getItem('add_location'), getItem('claim_location')],
    },
  ];

  useEffect(() => {
    setView(initialView);
  }, [initialView]);

  useEffect(() => {
    setActiveEditProfileOrigin(editProfileOrigin);
  }, [editProfileOrigin]);

  const editBackLabel = activeEditProfileOrigin === 'profile' ? 'Profile' : 'Settings';
  const editTitle = activeEditProfileOrigin === 'profile' ? 'Edit Your Profile' : 'Edit Profile';
  const editBackHandler = activeEditProfileOrigin === 'profile'
    ? (onEditProfileBack ?? onBack)
    : () => setView('hub');

  if (view === 'edit')           return <EditProfilePage onBack={editBackHandler} backLabel={editBackLabel} title={editTitle} />;
  if (view === 'inventory')      return <InventoryPage onBack={() => setView('hub')} />;
  if (view === 'privacy')        return <PrivacySettingsPage onBack={() => setView('hub')} />;
  if (view === 'account')        return <ManageAccountPage onBack={() => setView('hub')} />;
  if (view === 'notifications')  return <NotificationSettingsPage onBack={() => setView('hub')} />;
  if (view === 'appearance')     return <AppearanceSettingsPage onBack={() => setView('hub')} />;
  if (view === 'blocked_muted')  return <BlockedMutedSettingsPage onBack={() => setView('hub')} />;
  if (view === 'activity')       return <ActivityLogPage onBack={() => setView('hub')} />;
  if (view === 'add_location')   return <AddLocationPage onBack={() => setView('hub')} />;
  if (view === 'claim_location') return <ClaimLocationPage onBack={() => setView('hub')} />;

  return (
    <div className="mx-auto max-w-xl h-full flex flex-col overflow-hidden px-4">
      <div className="pt-2">
        <SettingsPageHeader
          title="Settings"
          onBack={onBack}
          backLabel="Back"
        />
      </div>

      <div ref={(node) => { scrollRef.current = node; fadeRef.current = node; }} style={maskStyle} className="flex-1 min-h-0 space-y-6 overflow-y-auto pb-12 scrollbar-hide overscroll-contain">
        <section className="space-y-3">
          {menuGroups.map((group) => (
            <SettingsGroup
              key={group.title}
              title={group.title}
              description={group.description}
              items={group.items}
              onSelect={(id) => {
                if (id === 'edit') setActiveEditProfileOrigin('settings');
                setView(id);
              }}
            />
          ))}
        </section>

        <GlassPanel variant="subtle" className="rounded-[28px] border border-red-500/10 bg-red-500/5 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-noctvm-caption font-mono text-[10px] uppercase tracking-[0.28em] text-red-300/70">
                Danger zone
              </p>
              <p className="text-sm text-red-100/80">
                Sign out from this device.
              </p>
            </div>

            <button
              onClick={() => { signOut(); onBack(); }}
              className="inline-flex items-center justify-center rounded-full border border-red-500/20 bg-red-500/10 px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-red-200 transition-colors hover:border-red-500/30 hover:bg-red-500/15"
              title="Log out of your account"
            >
              Log Out
            </button>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}

// ==================== SUB-PAGES ====================

export function EditProfilePage({
  onBack,
  backLabel = 'Settings',
  title = 'Edit Profile',
}: {
  onBack: () => void,
  backLabel?: string,
  title?: string,
}) {
  const scrollRef = useSettingsScrollMemory('edit-profile');
  const { ref: fadeRef, maskStyle } = useScrollFade('y');
  const { profile, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bio, setBio] = useState(profile?.bio || '');
  const [city, setCity] = useState(profile?.city || '');
  const [genres, setGenres] = useState<string[]>(Array.isArray(profile?.genres) ? profile.genres : []);
  const [genreSearch, setGenreSearch] = useState('');
  const [socialLinks, setSocialLinks] = useState<any[]>(Array.isArray(profile?.social_links) ? profile.social_links : []);
  const [musicType, setMusicType] = useState(profile?.music_link?.type || 'spotify');
  const [musicUrl, setMusicUrl] = useState(profile?.music_link?.url || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showPlatformDropdown, setShowPlatformDropdown] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const GENRE_OPTIONS = GENRE_FILTERS.filter(g => g !== 'All');
  const PLATFORMS = ['instagram', 'facebook', 'twitter', 'tiktok', 'snapchat'];
  const avatarInitial = (displayName || username || profile?.username || 'N')[0].toUpperCase();

  useEffect(() => {
    setAvatarUrl(profile?.avatar_url || '');
  }, [profile?.avatar_url]);

  useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const handleAvatarFileChange = (file: File | null) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setSaveError('Please select an image file for your profile picture.');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setSaveError('Profile picture must be smaller than 8MB.');
      return;
    }

    if (avatarPreview && avatarPreview.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview);
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setSaveError(null);
  };

  const handleRemoveAvatar = () => {
    if (avatarPreview && avatarPreview.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarPreview(null);
    setAvatarFile(null);
    setAvatarUrl('');
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);

    let nextAvatarUrl: string | null = avatarUrl || null;

    if (avatarFile) {
      const extension = avatarFile.name.split('.').pop() || 'jpg';
      const uploadPath = `profile-avatars/${profile.id}/avatar-${Date.now()}.${extension}`;
      const uploadedUrl = await uploadOptimizedImage(avatarFile, 'app-assets', uploadPath);

      if (!uploadedUrl) {
        setSaveError('Failed to upload profile picture. Please try again.');
        setSaving(false);
        return;
      }

      nextAvatarUrl = `${uploadedUrl}?t=${Date.now()}`;
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: displayName,
        username,
        avatar_url: nextAvatarUrl,
        bio,
        city,
        genres,
        music_link: musicUrl ? { type: musicType, url: musicUrl } : null,
        social_links: socialLinks
          .filter((l: any) => l.url && l.url.trim())
          .map((l: any) => ({ ...l, url: buildSocialUrl(l.platform, l.url) })),
      })
      .eq('id', profile.id);
    
    if (!error) {
      await refreshProfile();
      setAvatarUrl(nextAvatarUrl || '');
      if (avatarPreview && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
      setAvatarPreview(null);
      setAvatarFile(null);
      setSaved(true);
      setSaveError(null);
      setTimeout(() => setSaved(false), 2000);
    } else {
      setSaveError(error.message);
    }
    setSaving(false);
  };

  const updateSocial = (platform: string, url: string) => {
    setSocialLinks((prev: any[]) => {
      if (!url) return prev.filter((l: any) => l.platform !== platform);
      const existing = prev.find((l: any) => l.platform === platform);
      if (existing) {
        return prev.map((l: any) => l.platform === platform ? { ...l, url } : l);
      }
      return [...prev, { platform, url }];
    });
  };

  const filteredGenreOptions = GENRE_OPTIONS.filter(g => 
    g.toLowerCase().includes(genreSearch.toLowerCase())
  );
  
  const unusedPlatforms = PLATFORMS.filter(p => !socialLinks.some(l => l.platform === p));

  return (
    <div className="max-w-xl mx-auto h-full flex flex-col overflow-hidden">
      <div className="px-4 pt-2">
        <SettingsPageHeader
          title={title}
          subtitle="Avatar, bio, music, socials"
          onBack={onBack}
          backLabel={backLabel}
        />
      </div>

      <div ref={(node) => { scrollRef.current = node; fadeRef.current = node; }} style={maskStyle} className="flex-1 min-h-0 overflow-y-auto px-4 pb-12 space-y-4 scrollbar-hide overscroll-contain">
        <GlassPanel variant="subtle" className="rounded-[28px] p-5 space-y-5">
          <p className="text-noctvm-caption font-mono text-[10px] uppercase tracking-[0.28em] text-noctvm-silver/45">Core Info</p>
          <div className="space-y-5">
            <div className="rounded-[20px] border border-white/5 bg-noctvm-surface/25 p-3.5">
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 overflow-hidden rounded-full border border-white/10 bg-noctvm-surface">
                  {avatarPreview || avatarUrl ? (
                    <NextImage
                      src={avatarPreview || avatarUrl}
                      alt="Profile picture preview"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="text-2xl font-bold text-foreground/90">{avatarInitial}</span>
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">Profile picture</p>
                  <p className="mt-1 text-xs text-noctvm-silver/60">Shown on your profile, stories, and comments.</p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-noctvm-silver transition-all hover:bg-white/10 hover:text-foreground"
                    >
                      {avatarPreview || avatarUrl ? 'Edit profile picture' : 'Add profile picture'}
                    </button>

                    {(avatarPreview || avatarUrl) && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-noctvm-silver transition-all hover:bg-white/10 hover:text-foreground"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    title="Upload profile picture"
                    onChange={(event) => {
                      handleAvatarFileChange(event.target.files?.[0] ?? null);
                      event.currentTarget.value = '';
                    }}
                  />
                </div>
              </div>
            </div>

            <FormInput label="Display Name" value={displayName} onChange={setDisplayName} />
            <FormInput label="Username" value={username} onChange={setUsername} />
            <FormTextarea label="Bio" value={bio} onChange={setBio} rows={3} />
            <FormInput label="City" value={city} onChange={setCity} />
          </div>
        </GlassPanel>

        <GlassPanel variant="subtle" className="rounded-[28px] p-5 space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-noctvm-caption font-mono text-[10px] uppercase tracking-[0.28em] text-noctvm-silver/45">Music Presence</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormSelect label="Platform" value={musicType} onChange={setMusicType} options={[
              { value: 'spotify', label: 'Spotify' },
              { value: 'soundcloud', label: 'SoundCloud' },
              { value: 'youtube', label: 'YouTube' },
              { value: 'ytmusic', label: 'YT Music' },
            ]} />
            <FormInput label="Link URL" value={musicUrl} onChange={setMusicUrl} placeholder="https://..." />
          </div>
        </GlassPanel>

        <GlassPanel variant="subtle" className="rounded-[28px] p-5 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-noctvm-caption font-mono text-[10px] uppercase tracking-[0.28em] text-noctvm-silver/45">Favorite Genres</p>
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="w-24 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-noctvm-caption text-foreground outline-none transition-all focus:w-32 focus:border-noctvm-violet/40"
                value={genreSearch}
                onChange={(e) => setGenreSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto p-1 scrollbar-hide">
            {filteredGenreOptions.length > 0 ? (
              filteredGenreOptions.map((g) => (
                <button
                  key={g}
                  onClick={() => setGenres((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g])}
                  className={`rounded-full border px-3 py-1.5 text-noctvm-caption font-bold transition-all active:scale-[0.96] ${
                    genres.includes(g)
                      ? 'border-noctvm-violet bg-noctvm-violet text-foreground shadow-glow'
                      : 'border-white/10 bg-white/5 text-noctvm-silver hover:border-white/20'
                  }`}
                  title={`Toggle ${g} genre`}
                >
                  {g}
                </button>
              ))
            ) : (
              <p className="text-noctvm-caption text-noctvm-silver/40">No genres found...</p>
            )}
          </div>
        </GlassPanel>

        <GlassPanel variant="subtle" className="rounded-[28px] p-5 space-y-4">
          <p className="text-noctvm-caption font-mono text-[10px] uppercase tracking-[0.28em] text-noctvm-silver/45">Website / Portfolio</p>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-noctvm-silver/40 group-focus-within:text-noctvm-violet transition-colors">
              <GlobeIcon className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="yoursite.com"
              value={usernameFromUrl('website', socialLinks.find(l => l.platform === 'website')?.url ?? '')}
              onChange={(e) => updateSocial('website', buildSocialUrl('website', e.target.value))}
              className="w-full rounded-xl border border-white/5 bg-noctvm-midnight/50 py-3 pl-12 pr-4 text-sm text-foreground outline-none transition-all placeholder:text-noctvm-silver/20 focus:border-noctvm-violet/30"
            />
          </div>
        </GlassPanel>

        <GlassPanel variant="subtle" className="rounded-[28px] p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-noctvm-caption font-mono text-[10px] uppercase tracking-[0.28em] text-noctvm-silver/45">Social Connections</p>
            {unusedPlatforms.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowPlatformDropdown(!showPlatformDropdown)}
                  className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-noctvm-caption text-noctvm-silver transition-all active:scale-[0.96] hover:bg-white/10 hover:text-foreground"
                  title="Add a social media link"
                >
                  <span>Add Social</span>
                  <svg className={`w-3 h-3 transition-transform ${showPlatformDropdown ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 9l-7 7-7-7" /></svg>
                </button>
                {showPlatformDropdown && (
                  <div className="absolute right-0 top-full z-50 mt-1 min-w-[120px] rounded-xl border border-white/10 bg-[#0A0A0A] py-1 shadow-2xl animate-in fade-in slide-in-from-top-1">
                    {unusedPlatforms.map(p => (
                      <button
                        key={p}
                        onClick={() => {
                          updateSocial(p, ' ');
                          setShowPlatformDropdown(false);
                        }}
                        className="w-full px-3 py-2 text-left capitalize text-noctvm-caption text-noctvm-silver transition-all active:scale-[0.96] hover:bg-white/5 hover:text-foreground"
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
            {socialLinks.filter((l: any) => l.platform !== 'website').length > 0 ? (
              socialLinks.filter((l: any) => l.platform !== 'website').map(link => {
                const p = link.platform;
                const Icon = p === 'instagram' ? InstagramIcon : p === 'twitter' ? TwitterIcon : p === 'tiktok' ? TikTokIcon : p === 'facebook' ? FacebookIcon : p === 'snapchat' ? SnapchatIcon : GlobeIcon;
                return (
                  <div key={p} className="relative group animate-in fade-in slide-in-from-left-2">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-noctvm-silver/40 group-focus-within:text-noctvm-violet transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      placeholder={p === 'website' ? 'yoursite.com' : 'username'}
                      value={link.url === ' ' ? '' : usernameFromUrl(p, link.url)}
                      onChange={(e) => updateSocial(p, buildSocialUrl(p, e.target.value))}
                      className="w-full rounded-xl border border-white/5 bg-noctvm-midnight/50 py-3 pl-12 pr-10 text-sm text-foreground outline-none transition-all placeholder:text-noctvm-silver/20 focus:border-noctvm-violet/30"
                    />
                    <button
                      onClick={() => updateSocial(p, '')}
                      title={`Remove ${p} link`}
                      aria-label={`Remove ${p} link`}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-foreground/20 opacity-0 transition-all active:scale-[0.96] group-hover:opacity-100 hover:text-red-500"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="rounded-xl border border-dashed border-white/5 bg-white/[0.02] py-8 text-center">
                <p className="text-noctvm-caption text-noctvm-silver/30">No social links added yet</p>
              </div>
            )}
          </div>
        </GlassPanel>

        <GlassPanel variant="subtle" className="rounded-[28px] p-5 space-y-3">
          {saveError && (
            <p className="px-2 text-center text-xs text-red-400">{saveError}</p>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-xl bg-noctvm-violet px-4 py-4 text-sm font-bold text-foreground shadow-lg shadow-noctvm-violet/20 transition-all hover:scale-[1.02] active:scale-[0.96] disabled:opacity-50"
          >
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save All Changes'}
          </button>
        </GlassPanel>

        {/* Integrated Inventory Section */}
        <div className="mt-4 pt-4 border-t border-white/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-yellow-500/10 rounded-xl">
              <StarIcon className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground font-heading">Premium Profile Effects</h3>
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
  const scrollRef = useSettingsScrollMemory('privacy');
  const { ref: fadeRef, maskStyle } = useScrollFade('y');
  const { settings, updateSettings, loading } = useSettings();

  if (loading) return (
    <div className="max-w-xl mx-auto px-4 h-full flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 border-noctvm-violet border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="max-w-xl mx-auto px-4 h-full flex flex-col overflow-hidden">
      <div className="pt-2">
        <SettingsPageHeader
          title="Privacy & Safety"
          subtitle="Your nights, your connections"
          onBack={onBack}
          backLabel="Settings"
        />
      </div>
      
      <div ref={(node) => { scrollRef.current = node; fadeRef.current = node; }} style={maskStyle} className="flex-1 min-h-0 overflow-y-auto pb-12 space-y-8 scrollbar-hide overscroll-contain">
        <GlassPanel variant="subtle" className="rounded-[28px] p-5 space-y-4">
          <p className="text-noctvm-caption font-mono text-[10px] uppercase tracking-[0.28em] text-noctvm-silver/45">Profile Visibility</p>
          <ToggleSwitch 
            enabled={settings?.is_profile_private || false} 
            onToggle={() => updateSettings({ is_profile_private: !settings?.is_profile_private })} 
            label="Private Profile" 
            desc="Only followers can see your posts and highlights" 
          />
          <ToggleSwitch 
            enabled={settings?.show_moonray_level || false} 
            onToggle={() => updateSettings({ show_moonray_level: !settings?.show_moonray_level })} 
            label="Show Moonray Rank" 
            desc="Display your pocket rank publically on your profile" 
          />
        </GlassPanel>

        <GlassPanel variant="subtle" className="rounded-[28px] p-5 space-y-4">
          <p className="text-noctvm-caption font-mono text-[10px] uppercase tracking-[0.28em] text-noctvm-silver/45">Interactions</p>
          <FormSelect 
            label="Who can see your likes?" 
            value={settings?.likes_visibility || 'public'} 
            onChange={(v) => updateSettings({ likes_visibility: v as any })} 
            options={[
              { value: 'public', label: 'Everyone' },
              { value: 'followers', label: 'People You Follow' },
              { value: 'none', label: 'No One' },
            ]} 
          />
          <FormSelect 
            label="Who can comment on posts?" 
            value={settings?.comment_restrictions || 'everyone'} 
            onChange={(v) => updateSettings({ comment_restrictions: v as any })} 
            options={[
              { value: 'everyone', label: 'Everyone' },
              { value: 'following', label: 'People You Follow' },
              { value: 'none', label: 'No One' },
            ]} 
          />
          <FormSelect 
            label="Who can tag you?" 
            value={settings?.tag_restrictions || 'everyone'} 
            onChange={(v) => updateSettings({ tag_restrictions: v as any })} 
            options={[
              { value: 'everyone', label: 'Everyone' },
              { value: 'following', label: 'People You Follow' },
              { value: 'none', label: 'No One' },
            ]} 
          />
        </GlassPanel>

        <GlassPanel variant="subtle" className="rounded-[28px] p-5 space-y-4">
          <p className="text-noctvm-caption font-mono text-[10px] uppercase tracking-[0.28em] text-noctvm-silver/45">Permissions</p>
          <ToggleSwitch 
            enabled={settings?.location_access || false} 
            onToggle={() => updateSettings({ location_access: !settings?.location_access })} 
            label="Location Services" 
            desc="Used for map discovery and distance calculation" 
          />
          <ToggleSwitch 
            enabled={settings?.notif_access || false} 
            onToggle={() => updateSettings({ notif_access: !settings?.notif_access })} 
            label="Push Notifications" 
            desc="Allow device notifications for social alerts" 
          />
        </GlassPanel>
      </div>
    </div>
  );
}

export function ActivityLogPage({ onBack }: { onBack: () => void }) {
  const scrollRef = useSettingsScrollMemory('activity');
  const { ref: fadeRef, maskStyle } = useScrollFade('y');
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
    <div className="max-w-xl mx-auto px-4 h-full flex flex-col overflow-hidden">
      <div className="pt-2">
        <SettingsPageHeader
          title="Activity Journal"
          subtitle="Audit trail"
          onBack={onBack}
          backLabel="Settings"
        />
      </div>
      
      <div ref={(node) => { scrollRef.current = node; fadeRef.current = node; }} style={maskStyle} className="flex-1 min-h-0 overflow-y-auto pb-12 space-y-4 scrollbar-hide overscroll-contain">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 opacity-40">
            <div className="w-10 h-10 rounded-full border-2 border-noctvm-violet border-t-transparent animate-spin" />
            <p className="text-noctvm-caption font-bold uppercase tracking-[0.2em] text-noctvm-violet">Retrieving Timeline...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-24 text-noctvm-silver/30">
            <LayoutListIcon className="w-12 h-12 mx-auto mb-4 opacity-10" />
            <p className="text-xs font-medium">Your nightlife journey starts here.</p>
          </div>
        ) : (
          <div className="space-y-6 relative">
            <div className="absolute left-6 top-2 bottom-2 w-px bg-white/5" />
            {activities.map((a: any, i: number) => (
              <div key={a.id + i} className="flex gap-6 group">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all z-10 ${
                  a.type === 'post' ? 'bg-noctvm-violet/20 text-noctvm-violet border border-noctvm-violet/30' : 'bg-noctvm-midnight/50 text-noctvm-silver border border-white/5'
                }`}>
                  {a.type === 'post' ? <GridIcon className="w-5 h-5" /> : <ShieldIcon className="w-5 h-5" />}
                </div>
                <div className="flex-1 pt-1 border-b border-white/[0.03] pb-6 last:border-0">
                  <p className="text-xs text-foreground/90 leading-relaxed font-medium">{a.message}</p>
                  <p className="text-noctvm-caption text-noctvm-silver/40 mt-1.5 font-bold uppercase tracking-wider">{new Date(a.created_at).toLocaleDateString()} • {new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
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
  const scrollRef = useSettingsScrollMemory('notifications');
  const { ref: fadeRef, maskStyle } = useScrollFade('y');
  const { settings, updateSettings, loading } = useSettings();

  if (loading) return (
    <div className="max-w-xl mx-auto px-4 h-full flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 border-noctvm-violet border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="max-w-xl mx-auto px-4 h-full flex flex-col overflow-hidden">
      <div className="pt-2">
        <SettingsPageHeader
          title="Notifications"
          subtitle="Alerts & preferences"
          onBack={onBack}
          backLabel="Settings"
        />
      </div>
      
      <div ref={(node) => { scrollRef.current = node; fadeRef.current = node; }} style={maskStyle} className="flex-1 min-h-0 overflow-y-auto pb-12 space-y-6 scrollbar-hide overscroll-contain">
        <GlassPanel variant="subtle" className="rounded-[28px] p-5 space-y-4">
          <p className="text-noctvm-caption font-mono text-[10px] uppercase tracking-[0.28em] text-noctvm-silver/45">Alerts</p>
          <div className="space-y-2">
             <ToggleSwitch 
               enabled={settings?.notify_likes || false} 
               onToggle={() => updateSettings({ notify_likes: !settings?.notify_likes })} 
               label="Likes" 
               desc="Notify when someone likes your posts or stories" 
             />
             <ToggleSwitch 
               enabled={settings?.notify_comments || false} 
               onToggle={() => updateSettings({ notify_comments: !settings?.notify_comments })} 
               label="Comments" 
               desc="Notify when someone comments on your post" 
             />
             <ToggleSwitch 
               enabled={settings?.notify_followers || false} 
               onToggle={() => updateSettings({ notify_followers: !settings?.notify_followers })} 
               label="New Followers" 
               desc="Notify when someone follows your channel" 
             />
             <ToggleSwitch 
               enabled={settings?.notify_events || false} 
               onToggle={() => updateSettings({ notify_events: !settings?.notify_events })} 
               label="Event Reminders" 
               desc="Notifications for events you have saved" 
             />
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}

export function InventoryPage({ onBack, hideHeader = false }: { onBack: () => void, hideHeader?: boolean }) {
  const scrollRef = useSettingsScrollMemory('inventory');
  const { ref: fadeRef, maskStyle } = useScrollFade('y');
  const premiumEffects = [
    { id: 'neon_ring', name: 'Neon Avatar Ring', price: '500 MR', locked: true },
    { id: 'emerald_badge', name: 'Emerald VIP Badge', price: '1000 MR', locked: true },
    { id: 'animated_bio', name: 'Animated Bio Text', price: '250 MR', locked: true },
  ];

  return (
    <div className={`max-w-xl mx-auto px-4 ${hideHeader ? '' : 'h-full flex flex-col overflow-hidden'}`}>
      {!hideHeader && (
        <div className="pt-2">
          <SettingsPageHeader
            title="Vanity Inventory"
            subtitle="Premium profile effects"
            onBack={onBack}
            backLabel="Settings"
          />
        </div>
      )}

      <div ref={(node) => { scrollRef.current = node; fadeRef.current = node; }} style={maskStyle} className="flex-1 min-h-0 overflow-y-auto pb-12 space-y-4 scrollbar-hide overscroll-contain">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-noctvm-violet/20 to-noctvm-midnight border border-noctvm-violet/30 mb-6">
          <p className="text-xs font-bold text-noctvm-violet uppercase tracking-widest mb-1">Your Stash</p>
          <p className="text-noctvm-label text-noctvm-silver leading-relaxed">Customize your presence with premium gear unlocked from the Boutique.</p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {premiumEffects.map(effect => (
            <div key={effect.id} className="p-4 rounded-xl bg-noctvm-surface border border-white/5 opacity-50 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-foreground">{effect.name}</p>
                <p className="text-noctvm-caption text-noctvm-silver font-bold uppercase tracking-widest mt-0.5">{effect.price}</p>
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
  const scrollRef = useSettingsScrollMemory('manage-account');
  const { ref: fadeRef, maskStyle } = useScrollFade('y');
  const { profile } = useAuth();
  const [email, setEmail] = useState(profile?.email || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleUpdateEmail = async () => {
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.updateUser({ email });
    if (error) {
      setMessage({ text: error.message, type: 'error' });
    } else {
      setMessage({ text: 'Check your email for confirmation link.', type: 'success' });
    }
    setLoading(false);
  };

  const handleUpdatePassword = async () => {
    if (!password) return;
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setMessage({ text: error.message, type: 'error' });
    } else {
      setMessage({ text: 'Password updated successfully.', type: 'success' });
      setPassword('');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto px-4 h-full flex flex-col overflow-hidden">
      <div className="pt-2">
        <SettingsPageHeader
          title="Account Portal"
          subtitle="Identity and security"
          onBack={onBack}
          backLabel="Settings"
        />
      </div>

      <div ref={(node) => { scrollRef.current = node; fadeRef.current = node; }} style={maskStyle} className="flex-1 min-h-0 overflow-y-auto space-y-8 scrollbar-hide overscroll-contain pb-12">
        {message && (
          <div className={`rounded-2xl border px-4 py-3 text-xs font-bold uppercase tracking-wider ${message.type === 'success' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500' : 'border-red-500/20 bg-red-500/10 text-red-500'}`}>
            {message.text}
          </div>
        )}

        <GlassPanel variant="subtle" className="rounded-[28px] p-6 space-y-6">
          <p className="text-noctvm-caption font-mono uppercase tracking-[0.28em] text-noctvm-silver/45">Identity</p>
          <div className="space-y-4">
            <FormInput label="Email Address" value={email} onChange={setEmail} />
            <button
              onClick={handleUpdateEmail}
              disabled={loading || email === profile?.email}
              className="inline-flex items-center justify-center rounded-2xl border border-white/5 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-foreground transition-all hover:border-noctvm-violet/30 hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Update Email
            </button>
          </div>
        </GlassPanel>

        <GlassPanel variant="subtle" className="rounded-[28px] p-6 space-y-6">
          <p className="text-noctvm-caption font-mono uppercase tracking-[0.28em] text-noctvm-silver/45">Security</p>
          <div className="space-y-4">
            <FormInput label="New Password" type="password" value={password} onChange={setPassword} placeholder="Min 6 characters" />
            <button
              onClick={handleUpdatePassword}
              disabled={loading || !password}
              className="inline-flex items-center justify-center rounded-2xl border border-white/5 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-foreground transition-all hover:border-noctvm-violet/30 hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Update Password
            </button>
          </div>
        </GlassPanel>

        <div className="pt-8 border-t border-white/5 flex flex-col gap-3">
          <button className="group flex w-full items-center justify-between rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-4 text-left text-noctvm-silver transition-all hover:border-white/10 hover:text-foreground">
            <span>Request Data Export</span>
            <ChevronRightIcon className="h-4 w-4 opacity-50 transition-all group-hover:translate-x-1" />
          </button>

          <button className="group flex w-full items-center justify-between rounded-2xl border border-red-500/10 bg-red-500/5 px-4 py-4 text-left text-red-500 transition-all hover:bg-red-500/10">
            <span>Delete Account</span>
            <ChevronRightIcon className="h-4 w-4 opacity-50 transition-all group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function AppearanceSettingsPage({ onBack }: { onBack: () => void }) {
  const scrollRef = useSettingsScrollMemory('appearance');
  const { ref: fadeRef, maskStyle } = useScrollFade('y');
  const { settings, updateSettings, loading } = useSettings();

  const themes = [
    { id: 'dark', label: 'Dark Mode', desc: 'Midnight aesthetic, easy on eyes', color: 'bg-[#050505]' },
    { id: 'light', label: 'Light Mode', desc: 'Solarized print aesthetic', color: 'bg-white' },
    { id: 'system', label: 'System Default', desc: 'Sync with device settings', color: 'bg-gradient-to-br from-[#050505] to-white' },
  ];

  if (loading) return null;

  return (
    <div className="max-w-xl mx-auto px-4 h-full flex flex-col overflow-hidden">
      <div className="pt-2">
        <SettingsPageHeader
          title="Appearance"
          subtitle="Theme preference"
          onBack={onBack}
          backLabel="Settings"
        />
      </div>

      <div ref={(node) => { scrollRef.current = node; fadeRef.current = node; }} style={maskStyle} className="flex-1 min-h-0 overflow-y-auto pb-12 space-y-6 scrollbar-hide overscroll-contain">
        <div className="space-y-3">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => updateSettings({ theme: t.id as any })}
              className={`group flex w-full items-center gap-4 rounded-[28px] border px-4 py-4 text-left transition-all duration-300 active:scale-[0.99] ${
                settings?.theme === t.id
                  ? 'border-noctvm-violet/30 bg-noctvm-violet/10'
                  : 'border-white/5 bg-white/[0.03] hover:border-noctvm-violet/20 hover:bg-white/[0.05]'
              }`}
            >
              <div className={`h-12 w-12 rounded-2xl border border-white/5 ${t.color}`} />
              <div className="flex-1">
                <p className={`text-sm font-bold ${settings?.theme === t.id ? 'text-foreground' : 'text-noctvm-silver'}`}>{t.label}</p>
                <p className="mt-0.5 text-noctvm-label text-noctvm-silver/50">{t.desc}</p>
              </div>
              {settings?.theme === t.id && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-noctvm-violet animate-in zoom-in duration-300">
                  <svg className="h-4 w-4 text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
                </div>
              )}
            </button>
          ))}
      </div>
    </div>
    </div>
  );
}

export function BlockedMutedSettingsPage({ onBack }: { onBack: () => void }) {
  const scrollRef = useSettingsScrollMemory('blocked-muted');
  const { ref: fadeRef, maskStyle } = useScrollFade('y');
  const [tab, setTab] = useState<'blocked' | 'muted'>('blocked');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (tab === 'blocked') {
      const { data } = await supabase
        .from('user_blocks')
        .select('id, blocked:profiles!user_blocks_blocked_id_fkey(id, display_name, username, avatar_url)')
        .eq('blocker_id', user.id);
      setUsers(data?.map(d => d.blocked) || []);
    } else {
      const { data } = await supabase
        .from('user_mutes')
        .select('id, muted:profiles!user_mutes_muted_id_fkey(id, display_name, username, avatar_url)')
        .eq('muter_id', user.id);
      setUsers(data?.map(d => d.muted) || []);
    }
    setLoading(false);
  }, [tab]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleUnrestrict = async (targetId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (tab === 'blocked') {
      await supabase.from('user_blocks').delete().eq('blocker_id', user.id).eq('blocked_id', targetId);
    } else {
      await supabase.from('user_mutes').delete().eq('muter_id', user.id).eq('muted_id', targetId);
    }
    fetchUsers();
  };

  return (
    <div className="max-w-xl mx-auto px-4 h-full flex flex-col overflow-hidden">
      <div className="pt-2">
        <SettingsPageHeader
          title="Safety Controls"
          subtitle="Restricted users"
          onBack={onBack}
          backLabel="Settings"
        />
      </div>

      <div className="mb-6 flex rounded-2xl border border-white/5 bg-white/[0.03] p-1">
        <button
          onClick={() => setTab('blocked')}
          className={`flex-1 rounded-xl px-3 py-2 text-xs font-bold transition-all ${tab === 'blocked' ? 'bg-noctvm-violet text-foreground shadow-lg shadow-noctvm-violet/20' : 'text-noctvm-silver'}`}
        >
          Blocked Users
        </button>
        <button
          onClick={() => setTab('muted')}
          className={`flex-1 rounded-xl px-3 py-2 text-xs font-bold transition-all ${tab === 'muted' ? 'bg-noctvm-violet text-foreground shadow-lg shadow-noctvm-violet/20' : 'text-noctvm-silver'}`}
        >
          Muted Users
        </button>
      </div>

      <div ref={(node) => { scrollRef.current = node; fadeRef.current = node; }} style={maskStyle} className="flex-1 min-h-0 overflow-y-auto pb-12 space-y-4 scrollbar-hide overscroll-contain">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 rounded-full border-2 border-noctvm-violet border-t-transparent animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-white/5 bg-white/[0.02] py-24 text-center text-noctvm-silver/30">
            <ShieldIcon className="mx-auto mb-4 h-12 w-12 opacity-10" />
            <p className="text-xs font-medium">No one {tab === 'blocked' ? 'blocked' : 'muted'} yet.</p>
          </div>
        ) : (
          <GlassPanel variant="subtle" className="rounded-[28px] p-5 space-y-3">
            {users.map((u: any) => (
              <div key={u.id} className="flex items-center gap-4 rounded-[24px] border border-white/5 bg-white/[0.03] p-4">
                <div className="relative h-10 w-10 overflow-hidden rounded-full bg-noctvm-midnight">
                  <NextImage
                    src={u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`}
                    alt={u.display_name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold leading-tight text-foreground">{u.display_name}</p>
                  <p className="mt-0.5 text-xs text-noctvm-silver">@{u.username}</p>
                </div>
                <button
                  onClick={() => handleUnrestrict(u.id)}
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-bold text-noctvm-silver transition-all hover:border-white/20 hover:text-foreground"
                >
                  Un{tab === 'blocked' ? 'block' : 'mute'}
                </button>
              </div>
            ))}
          </GlassPanel>
        )}
      </div>
    </div>
  );
}

export function AddLocationPage({ onBack }: { onBack: () => void }) {
  const { ref: fadeRef, maskStyle } = useScrollFade('y');
  return (
    <div className="max-w-xl mx-auto px-4 h-full flex flex-col overflow-hidden">
      <div className="pt-2">
        <SettingsPageHeader
          title="Add Location"
          subtitle="Venue tools"
          onBack={onBack}
          backLabel="Profile"
        />
      </div>
      <div ref={fadeRef} style={maskStyle} className="flex-1 min-h-0 overflow-y-auto pb-12 scrollbar-hide overscroll-contain">
        <GlassPanel variant="subtle" className="rounded-[28px] p-8 text-center text-sm text-noctvm-silver">
          Search for your business or location to add it.
        </GlassPanel>
      </div>
    </div>
  );
}

export function ClaimLocationPage({ onBack }: { onBack: () => void }) {
  const { ref: fadeRef, maskStyle } = useScrollFade('y');
  return (
    <div className="max-w-xl mx-auto px-4 h-full flex flex-col overflow-hidden">
      <div className="pt-2">
        <SettingsPageHeader
          title="Claim Your Venue"
          subtitle="Venue tools"
          onBack={onBack}
          backLabel="Profile"
        />
      </div>
      <div ref={fadeRef} style={maskStyle} className="flex-1 min-h-0 overflow-y-auto pb-12 scrollbar-hide overscroll-contain">
        <GlassPanel variant="subtle" className="rounded-[28px] p-8 text-center text-sm text-noctvm-silver">
          Verify ownership to manage your venue profile and events.
        </GlassPanel>
      </div>
    </div>
  );
}
