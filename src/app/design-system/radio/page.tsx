'use client';
import { RadioGroup, RadioItem } from '@/components/ui/RadioGroup';

export default function RadioPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Radio Group</h1>
        <p className="text-noctvm-silver">Single selection from a set of options.</p>
      </div>
      <div className="space-y-6">
        <h2 className="text-sm font-semibold text-noctvm-silver uppercase tracking-widest">Basic</h2>
        <RadioGroup defaultValue="techno">
          <RadioItem value="techno" label="Techno" />
          <RadioItem value="house" label="House" />
          <RadioItem value="dnb" label="Drum & Bass" />
        </RadioGroup>
      </div>
      <div className="space-y-6">
        <h2 className="text-sm font-semibold text-noctvm-silver uppercase tracking-widest">With Descriptions</h2>
        <RadioGroup defaultValue="standard">
          <RadioItem value="free" label="Free entry" description="Walk in any time, no reservation needed." />
          <RadioItem value="standard" label="Standard ticket" description="Reserved entry, 2 free drinks included." />
          <RadioItem value="vip" label="VIP table" description="Private booth, bottle service, priority access." />
        </RadioGroup>
      </div>
      <div className="space-y-6">
        <h2 className="text-sm font-semibold text-noctvm-silver uppercase tracking-widest">Sizes</h2>
        <div className="space-y-4">
          <RadioGroup defaultValue="sm" orientation="horizontal" className="flex-row gap-6">
            <RadioItem value="sm" size="sm" label="Small" />
            <RadioItem value="md" size="md" label="Medium" />
            <RadioItem value="lg" size="lg" label="Large" />
          </RadioGroup>
        </div>
      </div>
      <div className="space-y-6">
        <h2 className="text-sm font-semibold text-noctvm-silver uppercase tracking-widest">Disabled</h2>
        <RadioGroup defaultValue="b">
          <RadioItem value="a" label="Disabled option" disabled />
          <RadioItem value="b" label="Active option" />
        </RadioGroup>
      </div>
    </div>
  );
}
