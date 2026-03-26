'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';

import { cn } from '@/lib/cn';
import { buttonVariants } from '@/components/ui/Button';

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3 bg-noctvm-midnight/50 backdrop-blur-md rounded-2xl border border-white/5', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row gap-2',
        month: 'flex flex-col gap-4',
        caption: 'flex justify-center pt-1 relative items-center w-full mb-2',
        caption_label: 'text-xs font-bold uppercase tracking-widest text-white',
        nav: 'flex items-center gap-1',
        nav_button: cn(
          buttonVariants({ variant: 'outline' }),
          'size-7 bg-transparent p-0 opacity-50 hover:opacity-100 border-noctvm-border hover:bg-white/5'
        ),
        nav_button_previous: 'absolute left-1',
        nav_button_next: 'absolute right-1',
        table: 'w-full border-collapse space-x-1',
        head_row: 'flex mb-1 justify-between w-full',
        head_cell:
          'text-noctvm-silver/40 rounded-md w-8 justify-center items-center flex font-mono font-medium text-[0.65rem] uppercase tracking-tighter',
        row: 'flex w-full mt-1 justify-between',
        cell: cn(
          'relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-noctvm-violet/20 [&:has([aria-selected].day-range-end)]:rounded-r-md',
          props.mode === 'range'
            ? '[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md'
            : '[&:has([aria-selected])]:rounded-md'
        ),
        day: cn(
          buttonVariants({ variant: 'ghost' }),
          'size-8 rounded-full p-0 text-xs font-medium aria-selected:opacity-100 hover:bg-white/5 data-[today]:text-noctvm-violet data-[today]:font-bold'
        ),
        day_range_start:
          'day-range-start aria-selected:bg-noctvm-violet aria-selected:text-white',
        day_range_end:
          'day-range-end aria-selected:bg-noctvm-violet aria-selected:text-white',
        day_selected:
          'bg-noctvm-violet text-white hover:bg-noctvm-violet hover:text-white focus:bg-noctvm-violet focus:text-white',
        day_today: 'bg-white/5 text-noctvm-violet font-bold outline outline-1 outline-noctvm-violet/30',
        day_outside:
          'day-outside text-noctvm-silver/20 aria-selected:bg-noctvm-violet/10 aria-selected:text-noctvm-silver/30',
        day_disabled: 'text-noctvm-silver/10 opacity-50',
        day_range_middle:
          'aria-selected:bg-noctvm-violet/10 aria-selected:text-white',
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
