'use client';
import { useState } from 'react';
import { Slider } from '@/components/ui/Slider';

export default function SliderPage() {
  const [volume, setVolume] = useState([70]);
  const [capacity, setCapacity] = useState([250]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Slider</h1>
        <p className="text-noctvm-silver">Range input for numeric values.</p>
      </div>

      {/* Sizes with labels */}
      <div className="space-y-8 max-w-md">
        <Slider
          label="Volume"
          value={volume}
          onValueChange={setVolume}
          min={0}
          max={100}
          size="sm"
          showValue
          formatValue={v => `${v}%`}
        />
        <Slider
          label="Venue capacity"
          value={capacity}
          onValueChange={setCapacity}
          min={50}
          max={2000}
          size="md"
          color="violet"
          showValue
          formatValue={v => `${v} people`}
        />
        <Slider
          label="Price range"
          defaultValue={[20]}
          min={0}
          max={100}
          size="lg"
          color="gold"
          showValue
          formatValue={v => `€${v}`}
        />
      </div>

      {/* Color variants */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-noctvm-silver uppercase tracking-widest">
          Colors
        </h2>
        <div className="space-y-4 max-w-md">
          <Slider defaultValue={[60]} color="violet" size="sm" />
          <Slider defaultValue={[75]} color="emerald" size="sm" />
          <Slider defaultValue={[40]} color="gold" size="sm" />
        </div>
      </div>

      {/* Size scale */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-noctvm-silver uppercase tracking-widest">
          Sizes
        </h2>
        <div className="space-y-6 max-w-md">
          <div className="space-y-1">
            <p className="text-noctvm-caption text-noctvm-silver/50 font-mono">sm</p>
            <Slider defaultValue={[50]} size="sm" color="violet" />
          </div>
          <div className="space-y-1">
            <p className="text-noctvm-caption text-noctvm-silver/50 font-mono">md</p>
            <Slider defaultValue={[50]} size="md" color="violet" />
          </div>
          <div className="space-y-1">
            <p className="text-noctvm-caption text-noctvm-silver/50 font-mono">lg</p>
            <Slider defaultValue={[50]} size="lg" color="violet" />
          </div>
        </div>
      </div>
    </div>
  );
}
