'use client';
import { useState } from 'react';
import { Listbox, ListboxItem, ListboxSection } from '@/components/ui/Listbox';
import { Music, MapPin, Star, Heart, Share2 } from 'lucide-react';

export default function ListboxPage() {
  const [selected, setSelected] = useState('techno');
  const genres = ['Techno', 'House', 'Drum & Bass', 'Ambient', 'Acid'];
  const venues = ['Berghain', 'Fabric', 'Tresor', 'Robert Johnson'];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Listbox</h1>
        <p className="text-noctvm-silver">Selectable list with sections and icons.</p>
      </div>
      <div className="space-y-6 max-w-sm">
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-noctvm-silver uppercase tracking-widest">Single selection</h2>
          <div className="bg-noctvm-surface border border-noctvm-border rounded-noctvm-md overflow-hidden">
            <Listbox label="Select genre">
              {genres.map(g => (
                <ListboxItem
                  key={g}
                  isSelected={selected === g.toLowerCase().replace(' & ', '-')}
                  color="violet"
                  onClick={() => setSelected(g.toLowerCase().replace(' & ', '-'))}
                  startContent={<Music className="w-4 h-4" />}
                >
                  {g}
                </ListboxItem>
              ))}
            </Listbox>
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-noctvm-silver uppercase tracking-widest">With sections</h2>
          <div className="bg-noctvm-surface border border-noctvm-border rounded-noctvm-md overflow-hidden">
            <Listbox label="Post actions">
              <ListboxSection title="Social" showDivider>
                <ListboxItem startContent={<Heart className="w-4 h-4" />} description="Show appreciation">Like post</ListboxItem>
                <ListboxItem startContent={<Share2 className="w-4 h-4" />} description="Share to your story">Share</ListboxItem>
              </ListboxSection>
              <ListboxSection title="Navigation">
                <ListboxItem startContent={<MapPin className="w-4 h-4" />} description="See full venue info">Visit venue</ListboxItem>
                <ListboxItem startContent={<Star className="w-4 h-4" />} description="Add to your saves">Save post</ListboxItem>
              </ListboxSection>
            </Listbox>
          </div>
        </div>
      </div>
    </div>
  );
}
