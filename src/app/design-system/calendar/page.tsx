'use client';

import React, { useState } from 'react';
import { Calendar } from '@/components/ui';

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedRange, setSelectedRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Calendar</h1>
        <p className="text-noctvm-silver">
          Date picker built on react-day-picker with NOCTVM styling.
          Supports single date, range, and multi-select modes.
        </p>
      </div>

      {/* Single Date */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-noctvm-silver uppercase tracking-widest">Single Date</h2>
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
          />
          <div className="space-y-2">
            <p className="text-noctvm-label font-mono text-foreground/50 uppercase tracking-widest">Selected</p>
            <p className="text-noctvm-sm text-foreground font-mono">
              {selectedDate ? selectedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'None'}
            </p>
          </div>
        </div>
      </section>

      {/* Date Range */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-noctvm-silver uppercase tracking-widest">Date Range</h2>
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <Calendar
            mode="range"
            selected={selectedRange.from && selectedRange.to ? { from: selectedRange.from, to: selectedRange.to } : undefined}
            onSelect={(range) => {
              if (range) {
                setSelectedRange({ from: range.from, to: range.to });
              } else {
                setSelectedRange({ from: undefined, to: undefined });
              }
            }}
            numberOfMonths={1}
          />
          <div className="space-y-2">
            <p className="text-noctvm-label font-mono text-foreground/50 uppercase tracking-widest">Range</p>
            <p className="text-noctvm-sm text-foreground font-mono">
              {selectedRange.from ? selectedRange.from.toLocaleDateString('en-GB') : 'Start'}
              {' — '}
              {selectedRange.to ? selectedRange.to.toLocaleDateString('en-GB') : 'End'}
            </p>
          </div>
        </div>
      </section>

      {/* Disabled Dates */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-noctvm-silver uppercase tracking-widest">With Disabled Dates</h2>
        <Calendar
          mode="single"
          disabled={[
            { before: new Date() },
            { dayOfWeek: [0, 6] },
          ]}
        />
        <p className="text-noctvm-caption text-noctvm-silver/50">
          Past dates and weekends are disabled. Use for booking flows where only weekdays are available.
        </p>
      </section>

      {/* Two Months */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-noctvm-silver uppercase tracking-widest">Two Months</h2>
        <div className="overflow-x-auto">
          <Calendar
            mode="single"
            numberOfMonths={2}
          />
        </div>
      </section>
    </div>
  );
}
