'use client';
import { useState } from 'react';
import { Checkbox } from '@/components/ui/Checkbox';

export default function CheckboxPage() {
  const [genres, setGenres] = useState<string[]>([]);
  const toggleGenre = (g: string) =>
    setGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
  const allGenres = ['Techno', 'House', 'Drum & Bass', 'Ambient'];
  const allChecked = genres.length === allGenres.length;
  const someChecked = genres.length > 0 && !allChecked;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Checkbox</h1>
        <p className="text-noctvm-silver">Controlled and uncontrolled selection.</p>
      </div>
      <div className="space-y-6">
        <h2 className="text-sm font-semibold text-noctvm-silver uppercase tracking-widest">Sizes</h2>
        <div className="space-y-3">
          <Checkbox size="sm" label="Small checkbox" defaultChecked />
          <Checkbox size="md" label="Medium checkbox" defaultChecked />
          <Checkbox size="lg" label="Large checkbox" defaultChecked />
        </div>
      </div>
      <div className="space-y-6">
        <h2 className="text-sm font-semibold text-noctvm-silver uppercase tracking-widest">With Description</h2>
        <div className="space-y-3">
          <Checkbox
            label="Enable notifications"
            description="Get notified about events at your saved venues."
            defaultChecked
          />
          <Checkbox
            label="Location access"
            description="Find events near your current location."
          />
        </div>
      </div>
      <div className="space-y-6">
        <h2 className="text-sm font-semibold text-noctvm-silver uppercase tracking-widest">Indeterminate</h2>
        <div className="space-y-3">
          <Checkbox
            checked={allChecked ? true : someChecked ? 'indeterminate' : false}
            onCheckedChange={v => setGenres(v ? allGenres : [])}
            label="All genres"
          />
          <div className="pl-6 space-y-2">
            {allGenres.map(g => (
              <Checkbox
                key={g}
                checked={genres.includes(g)}
                onCheckedChange={() => toggleGenre(g)}
                label={g}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="space-y-6">
        <h2 className="text-sm font-semibold text-noctvm-silver uppercase tracking-widest">States</h2>
        <div className="space-y-3">
          <Checkbox label="Disabled unchecked" disabled />
          <Checkbox label="Disabled checked" disabled defaultChecked />
        </div>
      </div>
    </div>
  );
}
