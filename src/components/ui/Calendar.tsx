'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';

import { cn } from '@/lib/cn';

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('px-5 pt-6 pb-4 bg-noctvm-midnight/50 backdrop-blur-md rounded-2xl border border-white/5', className)}
      classNames={{
        months: 'flex flex-col gap-4',
        month: 'flex flex-col gap-3',
        caption: 'flex justify-center relative items-center mb-1',
        caption_label: 'text-xs font-bold uppercase tracking-widest text-foreground',
        nav: 'flex items-center',
        nav_button: 'w-7 h-7 bg-transparent p-0 opacity-40 hover:opacity-100 hover:bg-white/5 rounded-lg flex items-center justify-center transition-opacity',
        nav_button_previous: 'absolute left-0 -ml-1',
        nav_button_next: 'absolute right-0 -mr-1',
        table: 'w-full [&_thead]:block [&_tbody]:block',
        head_row: 'grid grid-cols-7 gap-x-1 mb-1',
        head_cell: 'text-noctvm-silver/30 text-center font-mono text-[0.6rem] uppercase tracking-tighter py-1',
        row: 'grid grid-cols-7 gap-x-1 mt-1',
        cell: 'relative flex items-center justify-center p-0 focus-within:z-20',
        day: 'w-[27px] h-[27px] rounded-full text-xs font-medium text-noctvm-silver/70 hover:bg-white/5 hover:text-foreground transition-colors flex items-center justify-center cursor-pointer',
        day_selected: 'bg-noctvm-violet !text-foreground hover:bg-noctvm-violet !w-[27px] !h-[27px]',
        day_today: 'text-noctvm-violet font-bold ring-1 ring-noctvm-violet/40',
        day_outside: 'text-noctvm-silver/20',
        day_disabled: 'text-noctvm-silver/10 opacity-40 cursor-default',
        day_hidden: 'invisible',
        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft className={cn('size-4', className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight className={cn('size-4', className)} {...props} />
        ),
      }}
      {...props}
    />
  );
}

export { Calendar };
