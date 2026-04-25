'use client';
import React, { useState } from 'react';
import { Switch } from '@/components/ui';

export default function SwitchPage() {
  const [notifications, setNotifications] = useState(true);
  const [location, setLocation] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  const items = [
    { label: 'Push Notifications', description: 'Receive alerts for new events', checked: notifications, onChange: setNotifications },
    { label: 'Location Access', description: 'Show nearby venues and events', checked: location, onChange: setLocation },
    { label: 'Dark Mode', description: 'Always on for NOCTVM', checked: darkMode, onChange: setDarkMode },
  ];

  return (
    <div className="space-y-12 animate-fade-in pb-24">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2 font-heading uppercase tracking-wider">Switch</h1>
        <p className="text-noctvm-silver/70 max-w-2xl">Toggle control. Violet when on, surface when off.</p>
      </div>

      <section className="space-y-6">
        <h2 className="font-heading text-xl font-semibold border-b border-noctvm-border pb-3 text-noctvm-silver">Settings List</h2>
        <div className="bg-noctvm-surface/30 rounded-2xl border border-white/5 divide-y divide-white/5">
          {items.map(item => (
            <div key={item.label} className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-noctvm-silver mt-0.5">{item.description}</p>
              </div>
              <Switch checked={item.checked} onCheckedChange={item.onChange} />
            </div>
          ))}
          <div className="flex items-center justify-between px-6 py-4 opacity-50">
            <div>
              <p className="text-sm font-medium text-foreground">Analytics (disabled)</p>
              <p className="text-xs text-noctvm-silver mt-0.5">Unavailable in your region</p>
            </div>
            <Switch disabled checked={false} />
          </div>
        </div>
      </section>
    </div>
  );
}
