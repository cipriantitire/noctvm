'use client';
import { useState } from 'react';
import { Chip } from '@/components/ui/Chip';

const genres = ['Techno', 'House', 'Drum & Bass', 'Ambient', 'Acid', 'Industrial'];

export default function ChipPage() {
  const [selected, setSelected] = useState(['Techno', 'House']);
  const toggle = (g: string) =>
    setSelected(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Chip</h1>
        <p className="text-noctvm-silver">Tags, filters, and removable labels.</p>
      </div>
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-noctvm-silver uppercase tracking-widest">Variants</h2>
        <div className="flex flex-wrap gap-2">
          <Chip variant="solid" color="violet">Solid</Chip>
          <Chip variant="bordered" color="violet">Bordered</Chip>
          <Chip variant="flat" color="violet">Flat</Chip>
          <Chip variant="ghost" color="violet">Ghost</Chip>
        </div>
      </div>
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-noctvm-silver uppercase tracking-widest">Colors</h2>
        <div className="flex flex-wrap gap-2">
          <Chip variant="flat" color="violet">Violet</Chip>
          <Chip variant="flat" color="emerald">Emerald</Chip>
          <Chip variant="flat" color="gold">Gold</Chip>
          <Chip variant="flat" color="red">Red</Chip>
          <Chip variant="flat" color="default">Default</Chip>
        </div>
      </div>
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-noctvm-silver uppercase tracking-widest">Dot variant</h2>
        <div className="flex flex-wrap gap-2">
          <Chip isDot color="emerald" variant="flat">Live now</Chip>
          <Chip isDot color="gold" variant="flat">Selling fast</Chip>
          <Chip isDot color="red" variant="flat">Sold out</Chip>
        </div>
      </div>
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-noctvm-silver uppercase tracking-widest">Removable (genre filter)</h2>
        <div className="flex flex-wrap gap-2">
          {genres.map(g => (
            <Chip
              key={g}
              variant={selected.includes(g) ? 'solid' : 'ghost'}
              color={selected.includes(g) ? 'violet' : 'default'}
              onClick={() => toggle(g)}
              onRemove={selected.includes(g) ? () => toggle(g) : undefined}
              className="cursor-pointer"
            >
              {g}
            </Chip>
          ))}
        </div>
      </div>
    </div>
  );
}
