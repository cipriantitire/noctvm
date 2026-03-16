'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { logActivity } from '@/lib/activity';

// Shared back button
function BackButton({ onBack }: { onBack: () => void; label?: string }) {
  return (
    <button
      onClick={onBack}
      className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center text-noctvm-silver hover:text-white hover:bg-black/80 transition-all mb-6"
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </button>
  );
}

// Shared input component
function FormInput({ label, type = 'text', placeholder, value, onChange, disabled }: {
  label: string; type?: string; placeholder?: string; value: string; onChange: (v: string) => void; disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-noctvm-silver mb-1.5">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full bg-noctvm-midnight border border-noctvm-border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-noctvm-silver/40 focus:outline-none focus:border-noctvm-violet/50 transition-colors disabled:opacity-50"
      />
    </div>
  );
}

function FormTextarea({ label, placeholder, value, onChange, rows = 3 }: {
  label: string; placeholder?: string; value: string; onChange: (v: string) => void; rows?: number;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-noctvm-silver mb-1.5">{label}</label>
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full bg-noctvm-midnight border border-noctvm-border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-noctvm-silver/40 focus:outline-none focus:border-noctvm-violet/50 transition-colors resize-none"
      />
    </div>
  );
}

function FormSelect({ label, options, value, onChange }: {
  label: string; options: { value: string; label: string }[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-noctvm-silver mb-1.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-noctvm-midnight border border-noctvm-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-noctvm-violet/50 transition-colors appearance-none"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function ToggleSwitch({ enabled, onToggle, label, desc }: {
  enabled: boolean; onToggle: () => void; label: string; desc?: string;
}) {
  return (
    <button onClick={onToggle} className="w-full flex items-center justify-between p-3 rounded-lg bg-noctvm-midnight border border-noctvm-border hover:border-noctvm-violet/20 transition-colors">
      <div>
        <p className="text-sm font-medium text-white text-left">{label}</p>
        {desc && <p className="text-[10px] text-noctvm-silver mt-0.5 text-left">{desc}</p>}
      </div>
      <div className={`w-10 h-5 rounded-full transition-colors ${enabled ? 'bg-noctvm-violet' : 'bg-noctvm-surface'} relative`}>
        <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </div>
    </button>
  );
}

// ==================== MANAGE ACCOUNT ====================
export function ManageAccountPage({ onBack }: { onBack: () => void }) {
  const { profile, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [city, setCity] = useState(profile?.city || 'Bucharest');
  const [isPrivate, setIsPrivate] = useState(false);
  const [showSaved, setShowSaved] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setError('');
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        display_name: displayName,
        username,
        bio,
        city,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id);

    if (updateError) {
      setError(updateError.message);
    } else {
      await logActivity({
        type: 'user_edit',
        message: `Updated profile: @${username}`,
        entity_id: profile.id,
        user_name: displayName || username
      });
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  };

  return (
    <div className="max-w-lg mx-auto">
      <BackButton onBack={onBack} label="Back to Profile" />
      <h2 className="font-heading text-xl font-bold text-white mb-6">Manage Account</h2>

      {/* Avatar */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-20 h-20 rounded-full bg-noctvm-surface border-2 border-noctvm-violet/30 flex items-center justify-center overflow-hidden">
          {profile?.avatar_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-heading font-bold text-noctvm-violet">
              {(profile?.display_name || 'N')[0].toUpperCase()}
            </span>
          )}
        </div>
        <div>
          <button className="text-xs text-noctvm-violet font-medium hover:text-noctvm-violet/80 transition-colors">Change Avatar</button>
          <p className="text-[10px] text-noctvm-silver mt-0.5">JPG, PNG or GIF. Max 2MB.</p>
        </div>
      </div>

      <div className="space-y-4">
        <FormInput label="Display Name" value={displayName} onChange={setDisplayName} placeholder="Your display name" />
        <FormInput label="Username" value={username} onChange={setUsername} placeholder="@username" />
        <FormInput label="Email" type="email" value={profile?.email || ''} onChange={() => {}} placeholder="your@email.com" disabled />
        <p className="text-[10px] text-noctvm-silver/50 -mt-2">Email cannot be changed here</p>
        <FormTextarea label="Bio" value={bio} onChange={setBio} placeholder="Tell people about yourself..." rows={2} />
        <FormInput label="City" value={city} onChange={setCity} placeholder="Your city" />

        <div className="pt-2 border-t border-noctvm-border">
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Privacy</h3>
          <div className="space-y-2">
            <ToggleSwitch enabled={isPrivate} onToggle={() => setIsPrivate(!isPrivate)} label="Private Account" desc="Only approved followers can see your posts" />
            <ToggleSwitch enabled={showSaved} onToggle={() => setShowSaved(!showSaved)} label="Show Saved Events" desc="Let others see events you've saved" />
          </div>
        </div>

        {error && (
          <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        <div className="pt-4 flex gap-3">
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-lg bg-noctvm-violet text-white text-sm font-medium hover:bg-noctvm-violet/90 transition-colors disabled:opacity-50">
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
          </button>
          <button onClick={onBack} className="px-6 py-2.5 rounded-lg bg-noctvm-surface border border-noctvm-border text-sm text-noctvm-silver hover:text-white transition-colors">
            Cancel
          </button>
        </div>

        <div className="pt-4 border-t border-noctvm-border">
          <button className="text-xs text-red-400 hover:text-red-300 transition-colors">Delete Account</button>
        </div>
      </div>
    </div>
  );
}

// ==================== ADD LOCATION ====================
export function AddLocationPage({ onBack }: { onBack: () => void }) {
  const { profile } = useAuth();
  const [venueName, setVenueName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Bucharest');
  const [venueType, setVenueType] = useState('club');
  const [capacity, setCapacity] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [instagram, setInstagram] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto">
        <BackButton onBack={onBack} label="Back to Profile" />
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-noctvm-emerald/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-noctvm-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="font-heading text-xl font-bold text-white mb-2">Location Submitted!</h2>
          <p className="text-sm text-noctvm-silver">Your venue &quot;{venueName}&quot; has been submitted for review.</p>
          <p className="text-xs text-noctvm-silver/60 mt-2">We&apos;ll notify you once it&apos;s approved.</p>
          <button onClick={onBack} className="mt-6 px-6 py-2.5 rounded-lg bg-noctvm-violet text-white text-sm font-medium hover:bg-noctvm-violet/90 transition-colors">
            Back to Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <BackButton onBack={onBack} label="Back to Profile" />
      <h2 className="font-heading text-xl font-bold text-white mb-1">Add Location</h2>
      <p className="text-sm text-noctvm-silver mb-6">Register a new venue or event space on NOCTVM</p>

      <div className="space-y-4">
        <FormInput label="Venue Name" value={venueName} onChange={setVenueName} placeholder="e.g. Control Club" />
        <FormSelect label="Venue Type" value={venueType} onChange={setVenueType} options={[
          { value: 'club', label: 'Nightclub' },
          { value: 'bar', label: 'Bar / Lounge' },
          { value: 'festival', label: 'Festival Ground' },
          { value: 'concert', label: 'Concert Hall' },
          { value: 'rooftop', label: 'Rooftop' },
          { value: 'warehouse', label: 'Warehouse / Industrial' },
          { value: 'other', label: 'Other' },
        ]} />
        <FormInput label="Street Address" value={address} onChange={setAddress} placeholder="Str. Constantin Mille 4" />
        <FormInput label="City" value={city} onChange={setCity} placeholder="Bucharest" />
        <FormInput label="Capacity" type="number" value={capacity} onChange={setCapacity} placeholder="e.g. 400" />
        <FormTextarea label="Description" value={description} onChange={setDescription} placeholder="Tell people what makes this venue special..." />

        <div className="pt-2 border-t border-noctvm-border">
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Social & Contact</h3>
          <div className="space-y-3">
            <FormInput label="Website" value={website} onChange={setWebsite} placeholder="https://" />
            <FormInput label="Instagram" value={instagram} onChange={setInstagram} placeholder="@handle" />
          </div>
        </div>

        {/* Photo upload placeholder */}
        <div>
          <label className="block text-xs font-medium text-noctvm-silver mb-1.5">Photos</label>
          <div className="border-2 border-dashed border-noctvm-border rounded-lg p-6 text-center hover:border-noctvm-violet/30 transition-colors cursor-pointer">
            <svg className="w-8 h-8 text-noctvm-silver/30 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 21h18a1.5 1.5 0 001.5-1.5V4.5A1.5 1.5 0 0021 3H3a1.5 1.5 0 00-1.5 1.5v15A1.5 1.5 0 003 21z" /></svg>
            <p className="text-xs text-noctvm-silver/60">Click to upload venue photos</p>
            <p className="text-[10px] text-noctvm-silver/30 mt-1">JPG, PNG up to 5MB each</p>
          </div>
        </div>

        <button
          onClick={async () => {
            if (venueName && address) {
              await logActivity({
                type: 'venue_add',
                message: `Submitted new location: ${venueName}`,
                entity_name: venueName,
                user_name: profile?.display_name || 'User'
              });
              setSubmitted(true);
            }
          }}
          className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
            venueName && address
              ? 'bg-noctvm-violet text-white hover:bg-noctvm-violet/90'
              : 'bg-noctvm-surface text-noctvm-silver cursor-not-allowed'
          }`}
        >
          Submit Location
        </button>
      </div>
    </div>
  );
}

// ==================== CLAIM LOCATION ====================
export function ClaimLocationPage({ onBack }: { onBack: () => void }) {
  const [search, setSearch] = useState('');
  const [selectedVenue, setSelectedVenue] = useState<string | null>(null);
  const [role, setRole] = useState('owner');
  const [fullName, setFullName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [proof, setProof] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const VENUES = ['Control Club', 'Nook Club', 'Club Guesthouse', 'Expirat Halele Carol', 'Platforma Wolff', 'Beraria H', 'OXYA Club', 'Interbelic', 'Maison 64', 'Noar Hall', 'KAYO Club', 'Princess Club', 'Forge Bucharest'];
  const filtered = search ? VENUES.filter(v => v.toLowerCase().includes(search.toLowerCase())) : VENUES;

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto">
        <BackButton onBack={onBack} label="Back to Profile" />
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-noctvm-violet/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-noctvm-violet" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
          </div>
          <h2 className="font-heading text-xl font-bold text-white mb-2">Claim Submitted!</h2>
          <p className="text-sm text-noctvm-silver">Your claim for &quot;{selectedVenue}&quot; is being reviewed.</p>
          <p className="text-xs text-noctvm-silver/60 mt-2">Verification usually takes 2-3 business days.</p>
          <button onClick={onBack} className="mt-6 px-6 py-2.5 rounded-lg bg-noctvm-violet text-white text-sm font-medium hover:bg-noctvm-violet/90 transition-colors">
            Back to Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <BackButton onBack={onBack} label="Back to Profile" />
      <h2 className="font-heading text-xl font-bold text-white mb-1">Claim Location</h2>
      <p className="text-sm text-noctvm-silver mb-6">Claim ownership or management of an existing venue</p>

      {!selectedVenue ? (
        <div className="space-y-4">
          <FormInput label="Search Venue" value={search} onChange={setSearch} placeholder="Type venue name..." />
          <div className="space-y-1.5 max-h-80 overflow-y-auto">
            {filtered.map(v => (
              <button
                key={v}
                onClick={() => setSelectedVenue(v)}
                className="w-full flex items-center gap-3 p-3 rounded-lg bg-noctvm-midnight border border-noctvm-border hover:border-noctvm-violet/30 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-noctvm-violet to-purple-400 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-white">{v[0]}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{v}</p>
                  <p className="text-[10px] text-noctvm-silver">Bucharest, Romania</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Selected venue */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-noctvm-violet/10 border border-noctvm-violet/20">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-noctvm-violet to-purple-400 flex items-center justify-center">
              <span className="text-sm font-bold text-white">{selectedVenue[0]}</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">{selectedVenue}</p>
              <p className="text-[10px] text-noctvm-silver">Bucharest, Romania</p>
            </div>
            <button onClick={() => setSelectedVenue(null)} className="text-xs text-noctvm-silver hover:text-white transition-colors">Change</button>
          </div>

          <FormSelect label="Your Role" value={role} onChange={setRole} options={[
            { value: 'owner', label: 'Owner' },
            { value: 'manager', label: 'Manager' },
            { value: 'promoter', label: 'Event Promoter' },
            { value: 'representative', label: 'Authorized Representative' },
          ]} />
          <FormInput label="Full Name" value={fullName} onChange={setFullName} placeholder="Your full legal name" />
          <FormInput label="Contact Email" type="email" value={contactEmail} onChange={setContactEmail} placeholder="business@venue.com" />
          <FormTextarea label="Proof of Ownership" value={proof} onChange={setProof} placeholder="Describe how you can verify your connection to this venue (business registration, domain ownership, social media admin access, etc.)" rows={3} />

          {/* Document upload */}
          <div>
            <label className="block text-xs font-medium text-noctvm-silver mb-1.5">Supporting Documents</label>
            <div className="border-2 border-dashed border-noctvm-border rounded-lg p-4 text-center hover:border-noctvm-violet/30 transition-colors cursor-pointer">
              <svg className="w-6 h-6 text-noctvm-silver/30 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
              <p className="text-[10px] text-noctvm-silver/60">Upload business license, ID, or other proof</p>
            </div>
          </div>

          <button
            onClick={async () => {
              if (fullName && contactEmail) {
                await logActivity({
                  type: role === 'owner' ? 'owner_claim' : 'venue_claim',
                  message: `Claimed ${selectedVenue} as ${role}`,
                  entity_name: selectedVenue,
                  user_name: fullName
                });
                setSubmitted(true);
              }
            }}
            className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
              fullName && contactEmail
                ? 'bg-noctvm-violet text-white hover:bg-noctvm-violet/90'
                : 'bg-noctvm-surface text-noctvm-silver cursor-not-allowed'
            }`}
          >
            Submit Claim
          </button>
        </div>
      )}
    </div>
  );
}

// ==================== SETTINGS ====================
export function SettingsPage({ onBack }: { onBack: () => void }) {
  const { signOut } = useAuth();
  const [pushNotifs, setPushNotifs] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [eventReminders, setEventReminders] = useState(true);
  const [friendActivity, setFriendActivity] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [language, setLanguage] = useState('en');
  const [distanceUnit, setDistanceUnit] = useState('km');

  return (
    <div className="max-w-lg mx-auto">
      <BackButton onBack={onBack} label="Back to Profile" />
      <h2 className="font-heading text-xl font-bold text-white mb-6">Settings</h2>

      <div className="space-y-6">
        {/* Notifications */}
        <div>
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Notifications</h3>
          <div className="space-y-2">
            <ToggleSwitch enabled={pushNotifs} onToggle={() => setPushNotifs(!pushNotifs)} label="Push Notifications" desc="Get alerts on your device" />
            <ToggleSwitch enabled={emailNotifs} onToggle={() => setEmailNotifs(!emailNotifs)} label="Email Notifications" desc="Receive updates via email" />
            <ToggleSwitch enabled={eventReminders} onToggle={() => setEventReminders(!eventReminders)} label="Event Reminders" desc="Remind me before saved events start" />
            <ToggleSwitch enabled={friendActivity} onToggle={() => setFriendActivity(!friendActivity)} label="Friend Activity" desc="When friends check in or post" />
          </div>
        </div>

        {/* Appearance */}
        <div className="pt-2 border-t border-noctvm-border">
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Appearance</h3>
          <div className="space-y-2">
            <ToggleSwitch enabled={darkMode} onToggle={() => setDarkMode(!darkMode)} label="Dark Mode" desc="Always on (it's a nightlife app)" />
          </div>
        </div>

        {/* Preferences */}
        <div className="pt-2 border-t border-noctvm-border">
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Preferences</h3>
          <div className="space-y-3">
            <FormSelect label="Language" value={language} onChange={setLanguage} options={[
              { value: 'en', label: 'English' },
              { value: 'ro', label: 'Romana' },
              { value: 'de', label: 'Deutsch' },
              { value: 'fr', label: 'Francais' },
              { value: 'es', label: 'Espanol' },
            ]} />
            <FormSelect label="Distance Unit" value={distanceUnit} onChange={setDistanceUnit} options={[
              { value: 'km', label: 'Kilometers' },
              { value: 'mi', label: 'Miles' },
            ]} />
          </div>
        </div>

        {/* About */}
        <div className="pt-2 border-t border-noctvm-border">
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">About</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-lg bg-noctvm-midnight border border-noctvm-border">
              <span className="text-sm text-white">Version</span>
              <span className="text-xs text-noctvm-silver font-mono">0.1.0-alpha</span>
            </div>
            <button className="w-full flex items-center justify-between p-3 rounded-lg bg-noctvm-midnight border border-noctvm-border hover:border-noctvm-violet/20 transition-colors">
              <span className="text-sm text-white">Terms of Service</span>
              <svg className="w-4 h-4 text-noctvm-silver" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            </button>
            <button className="w-full flex items-center justify-between p-3 rounded-lg bg-noctvm-midnight border border-noctvm-border hover:border-noctvm-violet/20 transition-colors">
              <span className="text-sm text-white">Privacy Policy</span>
              <svg className="w-4 h-4 text-noctvm-silver" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            </button>
            <button className="w-full flex items-center justify-between p-3 rounded-lg bg-noctvm-midnight border border-noctvm-border hover:border-noctvm-violet/20 transition-colors">
              <span className="text-sm text-white">Contact Support</span>
              <svg className="w-4 h-4 text-noctvm-silver" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            </button>
          </div>
        </div>

        {/* Danger zone */}
        <div className="pt-2 border-t border-red-500/20">
          <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3">Danger Zone</h3>
          <div className="space-y-2">
            <button onClick={() => { signOut(); onBack(); }} className="w-full p-3 rounded-lg bg-noctvm-midnight border border-noctvm-border hover:border-red-500/30 transition-colors text-left">
              <p className="text-sm font-medium text-white">Log Out</p>
              <p className="text-[10px] text-noctvm-silver mt-0.5">Sign out of your account</p>
            </button>
            <button className="w-full p-3 rounded-lg bg-noctvm-midnight border border-red-500/20 hover:border-red-500/50 transition-colors text-left">
              <p className="text-sm font-medium text-red-400">Delete Account</p>
              <p className="text-[10px] text-noctvm-silver mt-0.5">Permanently remove your account and all data</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
