'use client';
import React from 'react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui';

const faqs = [
  { q: 'What is NOCTVM?', a: 'NOCTVM is the living memory of the night — a platform to discover events, venues, and nightlife in Romanian cities.' },
  { q: 'How do stories work?', a: 'Stories are 24-hour ephemeral posts that let you share moments from events. They appear in the Stories carousel on the feed.' },
  { q: 'Can I claim my venue?', a: 'Yes. Go to your venue page and use the Claim button. Our team verifies your identity before granting access.' },
  { q: 'What genres are supported?', a: 'Techno, House, DnB, Rock, Jazz, Hip-Hop, Electronic, Live Music, and more. Genre tags help attendees find the right events.' },
];

export default function AccordionPage() {
  return (
    <div className="space-y-12 animate-fade-in pb-24">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2 font-heading uppercase tracking-wider">Accordion</h1>
        <p className="text-noctvm-silver/70 max-w-2xl">Collapsible content sections. CSS-animated open/close.</p>
      </div>

      <section className="space-y-6">
        <h2 className="font-heading text-xl font-semibold border-b border-noctvm-border pb-3 text-noctvm-silver">Single (FAQ)</h2>
        <div className="bg-noctvm-surface/30 p-6 rounded-2xl border border-white/5">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger>{faq.q}</AccordionTrigger>
                <AccordionContent>{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="font-heading text-xl font-semibold border-b border-noctvm-border pb-3 text-noctvm-silver">Multiple (open many)</h2>
        <div className="bg-noctvm-surface/30 p-6 rounded-2xl border border-white/5">
          <Accordion type="multiple" className="w-full">
            {faqs.slice(0, 3).map((faq, i) => (
              <AccordionItem key={i} value={`multi-${i}`}>
                <AccordionTrigger>{faq.q}</AccordionTrigger>
                <AccordionContent>{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </div>
  );
}
