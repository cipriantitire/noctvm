'use client';
import React, { useState } from 'react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel, SelectSeparator } from '@/components/ui';

export default function SelectPage() {
  const [city, setCity] = useState('');
  const [genre, setGenre] = useState('');

  return (
    <div className="space-y-12 animate-fade-in pb-24">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2 font-heading uppercase tracking-wider">Select</h1>
        <p className="text-noctvm-silver/70 max-w-2xl">Accessible dropdown selection. Replaces all native &lt;select&gt; elements.</p>
      </div>

      <section className="space-y-6">
        <h2 className="font-heading text-xl font-semibold border-b border-noctvm-border pb-3 text-noctvm-silver">Basic</h2>
        <div className="flex flex-wrap gap-6 bg-noctvm-surface/30 p-8 rounded-2xl border border-white/5 items-start">
          <Select value={city} onValueChange={setCity}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Select city" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="bucharest">București</SelectItem>
              <SelectItem value="cluj">Cluj-Napoca</SelectItem>
              <SelectItem value="constanta">Constanța</SelectItem>
              <SelectItem value="timisoara">Timișoara</SelectItem>
            </SelectContent>
          </Select>

          <Select value={genre} onValueChange={setGenre}>
            <SelectTrigger className="w-48" size="sm"><SelectValue placeholder="Genre (sm)" /></SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Electronic</SelectLabel>
                <SelectItem value="techno">Techno</SelectItem>
                <SelectItem value="house">House</SelectItem>
                <SelectItem value="dnb">DnB</SelectItem>
              </SelectGroup>
              <SelectSeparator />
              <SelectGroup>
                <SelectLabel>Live</SelectLabel>
                <SelectItem value="rock">Rock</SelectItem>
                <SelectItem value="jazz">Jazz</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        {city && <p className="text-xs text-noctvm-silver font-mono">Selected: {city}</p>}
      </section>
    </div>
  );
}
