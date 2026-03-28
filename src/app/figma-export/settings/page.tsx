'use client';

/**
 * /figma-export/settings
 * Static Settings screen design comp — mobile + desktop.
 */

import React, { useState } from 'react';
import { Avatar, Badge, Button, GlassPanel, Switch, Field, Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Divider } from '@/components/ui';
import { EventsIcon, FeedIcon, VenuesIcon, PocketIcon, UserIcon, BellIcon, CogIcon, ShieldIcon, GlobeIcon, MusicIcon } from '@/components/icons';
import { ChevronRight, LogOut } from 'lucide-react';

const SETTINGS_SECTIONS = [
  {
    title: 'Account',
    icon: <UserIcon className="w-4 h-4" />,
    items: ['Edit Profile', 'Change Password', 'Connected Accounts', 'Manage Location'],
  },
  {
    title: 'Notifications',
    icon: <BellIcon className="w-4 h-4" />,
    items: ['Push Notifications', 'Email Notifications', 'Event Reminders', 'Follow Alerts'],
  },
  {
    title: 'Privacy',
    icon: <ShieldIcon className="w-4 h-4" />,
    items: ['Profile Visibility', 'Activity Status', 'Blocked Users', 'Data & Privacy'],
  },
  {
    title: 'App',
    icon: <CogIcon className="w-4 h-4" />,
    items: ['Language', 'City Preference', 'Theme', 'Clear Cache'],
  },
];

const TOGGLE_SETTINGS = [
  { label: 'Push Notifications', description: 'Receive alerts for events and activity', on: true },
  { label: 'Event Reminders', description: '1 hour before events you saved', on: true },
  { label: 'Follow Alerts', description: 'When someone follows you', on: false },
  { label: 'Story Views', description: 'Notify when someone views your story', on: true },
  { label: 'Show Activity Status', description: 'Let others see when you were last active', on: false },
];

function SettingRow({ label, description, chevron = true, danger = false }: {
  label: string; description?: string; chevron?: boolean; danger?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between py-3 border-b border-white/5 last:border-0 cursor-pointer hover:bg-white/[0.02] transition-colors px-1 rounded-lg ${danger ? 'text-red-400' : ''}`}>
      <div>
        <p className={`text-sm font-medium ${danger ? 'text-red-400' : 'text-white'}`}>{label}</p>
        {description && <p className="text-[#8A8A8A] text-xs mt-0.5">{description}</p>}
      </div>
      {chevron && <ChevronRight className="w-4 h-4 text-[#8A8A8A] shrink-0" />}
    </div>
  );
}

function MobileView() {
  const [notifications, setNotifications] = useState(true);
  return (
    <div className="w-[390px] bg-[#050505] min-h-screen flex flex-col border border-white/5 rounded-3xl overflow-hidden">
      {/* Top */}
      <div className="flex items-center gap-2 px-4 pt-12 pb-3">
        <CogIcon className="w-5 h-5 text-noctvm-violet" />
        <span className="text-white font-bold text-lg font-[Syne]">Settings</span>
      </div>

      {/* Profile preview */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5">
          <Avatar size="xl" src="https://i.pravatar.cc/150?u=djnoctvm" alt="Profile" />
          <div className="flex-1">
            <p className="text-white font-semibold">NOCTVM DJ</p>
            <p className="text-[#8A8A8A] text-sm">@djnoctvm</p>
            <Badge variant="featured" className="mt-1">Silver</Badge>
          </div>
          <ChevronRight className="w-5 h-5 text-[#8A8A8A]" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-24 space-y-4">
        {/* Account section */}
        <GlassPanel variant="subtle" className="rounded-2xl p-4">
          <p className="text-xs font-mono text-[#8A8A8A] uppercase tracking-widest mb-3 flex items-center gap-2">
            <UserIcon className="w-3.5 h-3.5" />Account
          </p>
          {['Edit Profile', 'Change Password', 'Connected Accounts', 'Manage Location'].map(item => (
            <SettingRow key={item} label={item} />
          ))}
        </GlassPanel>

        {/* Notifications toggles */}
        <GlassPanel variant="subtle" className="rounded-2xl p-4">
          <p className="text-xs font-mono text-[#8A8A8A] uppercase tracking-widest mb-3 flex items-center gap-2">
            <BellIcon className="w-3.5 h-3.5" />Notifications
          </p>
          {TOGGLE_SETTINGS.slice(0, 3).map(s => (
            <div key={s.label} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
              <div>
                <p className="text-white text-sm">{s.label}</p>
                <p className="text-[#8A8A8A] text-xs mt-0.5">{s.description}</p>
              </div>
              <Switch checked={s.on} onCheckedChange={() => {}} />
            </div>
          ))}
        </GlassPanel>

        {/* Privacy */}
        <GlassPanel variant="subtle" className="rounded-2xl p-4">
          <p className="text-xs font-mono text-[#8A8A8A] uppercase tracking-widest mb-3 flex items-center gap-2">
            <ShieldIcon className="w-3.5 h-3.5" />Privacy
          </p>
          {['Profile Visibility', 'Activity Status', 'Blocked Users'].map(item => (
            <SettingRow key={item} label={item} />
          ))}
        </GlassPanel>

        {/* Sign out */}
        <GlassPanel variant="subtle" className="rounded-2xl p-4">
          <SettingRow label="Sign Out" danger chevron={false} />
          <SettingRow label="Delete Account" danger chevron={false} />
        </GlassPanel>
      </div>

      {/* Bottom nav */}
      <div className="h-[72px] border-t border-white/5 frosted-glass-header flex items-center justify-around px-4 shrink-0">
        {['Events', 'Feed', 'Venues', 'Pocket', 'Profile'].map(t => (
          <div key={t} className={`flex flex-col items-center gap-1 text-[10px] text-[#8A8A8A]`}>
            <div className="w-1 h-1 rounded-full bg-transparent" />
            {t}
          </div>
        ))}
      </div>
    </div>
  );
}

function DesktopView() {
  const [activeSection, setActiveSection] = useState('Account');
  return (
    <div className="w-[1440px] bg-[#050505] min-h-screen border border-white/5 rounded-3xl overflow-hidden flex">
      {/* App sidebar */}
      <aside className="w-[240px] border-r border-white/5 bg-[#0A0A0A] flex flex-col pt-8 pb-4 shrink-0">
        <div className="px-6 mb-8">
          <p className="text-xs font-mono text-[#8A8A8A] uppercase tracking-widest mb-1">NOCTVM</p>
          <p className="text-white font-bold text-lg font-[Syne]">Platform</p>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {[
            { label: 'Events', Icon: EventsIcon },
            { label: 'Feed',   Icon: FeedIcon   },
            { label: 'Venues', Icon: VenuesIcon  },
            { label: 'Pocket', Icon: PocketIcon  },
            { label: 'Profile',Icon: UserIcon    },
          ].map(({ label, Icon }) => (
            <div key={label} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#8A8A8A] hover:bg-white/5 hover:text-white transition-all">
              <Icon className="w-4 h-4" />
              {label}
            </div>
          ))}
        </nav>
      </aside>

      {/* Settings nav */}
      <div className="w-[280px] border-r border-white/5 bg-[#070707] flex flex-col pt-8 shrink-0">
        <div className="px-6 mb-6">
          <h1 className="text-xl font-black text-white font-[Syne]">Settings</h1>
        </div>
        {/* Profile preview */}
        <div className="px-4 mb-6">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
            <Avatar size="md" src="https://i.pravatar.cc/150?u=djnoctvm" alt="Profile" />
            <div>
              <p className="text-white text-sm font-medium">NOCTVM DJ</p>
              <p className="text-[#8A8A8A] text-xs">@djnoctvm · Silver</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {SETTINGS_SECTIONS.map(s => (
            <button
              key={s.title}
              onClick={() => setActiveSection(s.title)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                activeSection === s.title
                  ? 'bg-noctvm-violet/15 text-noctvm-violet border border-noctvm-violet/20'
                  : 'text-[#8A8A8A] hover:bg-white/5 hover:text-white'
              }`}
            >
              {s.icon}
              {s.title}
            </button>
          ))}
          <Divider className="my-2" />
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all">
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </nav>
      </div>

      {/* Settings content */}
      <main className="flex-1 p-10 overflow-y-auto">
        {activeSection === 'Account' && (
          <div className="max-w-xl space-y-6">
            <h2 className="text-xl font-bold text-white font-[Syne]">Account Settings</h2>
            <GlassPanel variant="subtle" className="rounded-2xl p-6 space-y-4">
              <p className="text-xs font-mono text-[#8A8A8A] uppercase tracking-widest">Profile</p>
              <Field label="Display Name">
                <Input defaultValue="NOCTVM DJ" />
              </Field>
              <Field label="Username">
                <Input defaultValue="djnoctvm" />
              </Field>
              <Field label="Bio">
                <Input defaultValue="Underground music curator · București" />
              </Field>
              <Field label="City">
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="București" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bucuresti">București</SelectItem>
                    <SelectItem value="constanta">Constanța</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" size="sm">Cancel</Button>
                <Button variant="primary" size="sm">Save Changes</Button>
              </div>
            </GlassPanel>
          </div>
        )}
        {activeSection === 'Notifications' && (
          <div className="max-w-xl space-y-6">
            <h2 className="text-xl font-bold text-white font-[Syne]">Notifications</h2>
            <GlassPanel variant="subtle" className="rounded-2xl p-6 space-y-0">
              {TOGGLE_SETTINGS.map(s => (
                <div key={s.label} className="flex items-center justify-between py-4 border-b border-white/5 last:border-0">
                  <div>
                    <p className="text-white text-sm font-medium">{s.label}</p>
                    <p className="text-[#8A8A8A] text-xs mt-0.5">{s.description}</p>
                  </div>
                  <Switch checked={s.on} onCheckedChange={() => {}} />
                </div>
              ))}
            </GlassPanel>
          </div>
        )}
        {(activeSection === 'Privacy' || activeSection === 'App') && (
          <div className="max-w-xl">
            <h2 className="text-xl font-bold text-white font-[Syne] mb-6">{activeSection}</h2>
            <GlassPanel variant="subtle" className="rounded-2xl p-6">
              {SETTINGS_SECTIONS.find(s => s.title === activeSection)?.items.map(item => (
                <SettingRow key={item} label={item} />
              ))}
            </GlassPanel>
          </div>
        )}
      </main>
    </div>
  );
}

export default function SettingsExportPage() {
  return (
    <div className="p-8 space-y-8">
      <div className="text-xs text-[#8A8A8A] font-mono uppercase tracking-widest mb-4">
        figma-export / settings
      </div>
      <div>
        <p className="text-[10px] text-[#8A8A8A] font-mono uppercase tracking-widest mb-3">Mobile — 390px</p>
        <MobileView />
      </div>
      <div>
        <p className="text-[10px] text-[#8A8A8A] font-mono uppercase tracking-widest mb-3">Desktop — 1440px</p>
        <DesktopView />
      </div>
    </div>
  );
}
