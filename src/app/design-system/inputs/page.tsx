'use client';

import React from 'react';
import { Field, Input } from '@/components/ui';

export default function InputsShowcasePage() {
  return (
    <div className="space-y-12 animate-fade-in pb-24">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2 heading-syne uppercase tracking-wider">Inputs & Forms</h1>
        <p className="text-noctvm-silver/70 max-w-2xl">
          Standardized input fields, text areas, and form wrappers.
        </p>
      </div>

      <section className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 bg-noctvm-surface/50 border border-white/5 rounded-2xl space-y-6">
            <Field id="ds-demo-1" label="Standard Input">
              <Input id="ds-demo-1" placeholder="Type here..." />
            </Field>
          </div>
        </div>
      </section>
    </div>
  );
}
