'use client';
import { Kbd } from '@/components/ui/Kbd';

export default function KbdPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Kbd</h1>
        <p className="text-noctvm-silver">Keyboard shortcut display.</p>
      </div>
      <div className="flex flex-wrap gap-3 items-center">
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
        <span className="text-noctvm-silver text-sm">or</span>
        <Kbd>Ctrl</Kbd>
        <span className="text-noctvm-silver text-sm">+</span>
        <Kbd>Shift</Kbd>
        <span className="text-noctvm-silver text-sm">+</span>
        <Kbd>P</Kbd>
      </div>
      <div className="space-y-3">
        <p className="text-sm text-noctvm-silver">Search <Kbd>⌘ K</Kbd></p>
        <p className="text-sm text-noctvm-silver">Save <Kbd>⌘ S</Kbd></p>
        <p className="text-sm text-noctvm-silver">Close <Kbd>Esc</Kbd></p>
      </div>
    </div>
  );
}
