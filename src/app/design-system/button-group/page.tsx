'use client';
import { useState } from 'react';
import { ButtonGroup } from '@/components/ui/ButtonGroup';
import { Button } from '@/components/ui/Button';

export default function ButtonGroupPage() {
  const [active, setActive] = useState('posts');
  const tabs = ['Posts', 'Events', 'Venues'];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Button Group</h1>
        <p className="text-noctvm-silver">Connected buttons sharing border radius.</p>
      </div>
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-noctvm-silver uppercase tracking-widest">Segmented control</h2>
        <ButtonGroup>
          {tabs.map(t => (
            <Button
              key={t}
              variant={active === t.toLowerCase() ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setActive(t.toLowerCase())}
            >
              {t}
            </Button>
          ))}
        </ButtonGroup>
      </div>
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-noctvm-silver uppercase tracking-widest">Vertical</h2>
        <ButtonGroup orientation="vertical">
          <Button variant="secondary" size="sm">Top action</Button>
          <Button variant="secondary" size="sm">Middle action</Button>
          <Button variant="secondary" size="sm">Bottom action</Button>
        </ButtonGroup>
      </div>
    </div>
  );
}
