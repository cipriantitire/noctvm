'use client';
import React from 'react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel, DropdownMenuCheckboxItem } from '@/components/ui';
import { Button } from '@/components/ui';

export default function DropdownPage() {
  const [bookmarked, setBookmarked] = React.useState(false);
  const [notifications, setNotifications] = React.useState(true);

  return (
    <div className="space-y-12 animate-fade-in pb-24">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2 font-heading uppercase tracking-wider">Dropdown Menu</h1>
        <p className="text-noctvm-silver/70 max-w-2xl">Context menus and action menus. Replaces PostOptionsMenu and similar patterns.</p>
      </div>

      <section className="space-y-6">
        <h2 className="font-heading text-xl font-semibold border-b border-noctvm-border pb-3 text-noctvm-silver">Post Actions</h2>
        <div className="flex flex-wrap gap-4 bg-noctvm-surface/30 p-8 rounded-2xl border border-white/5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary">Post Options ···</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem checked={bookmarked} onCheckedChange={setBookmarked}>
                {bookmarked ? 'Bookmarked' : 'Bookmark'}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={notifications} onCheckedChange={setNotifications}>
                Notifications
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Share</DropdownMenuItem>
              <DropdownMenuItem>Copy Link</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">Report Post</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </section>
    </div>
  );
}
