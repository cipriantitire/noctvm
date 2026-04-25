'use client';

import React, { useState, useEffect } from 'react';
import { GlassPanel, Avatar } from '@/components/ui';
import StoryProgressBar from '@/components/ui/StoryProgressBar';
import CodePreview from '../CodePreview';

export default function StoriesShowcasePage() {
  const [progress, setProgress] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const totalStories = 4;
  const isPlaying = true; // For the playground simulation

  // Simulate progress
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
           setCurrentIndex(i => (i + 1) % totalStories);
           return 0;
        }
        return prev + 2; // Advance by 2% every 50ms
      });
    }, 50);
    return () => clearInterval(interval);
  }, [isPlaying, totalStories]);

  return (
    <div className="space-y-12 pb-24">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground mb-4">Stories Elements</h1>
        <p className="text-noctvm-silver text-lg max-w-2xl">
          Core primitives for building rich Story experiences, including animated rings and multi-segment progress bars.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          
          <section className="space-y-4">
            <h2 className="text-xl font-heading font-semibold text-foreground">Interactive Progress Bar</h2>
            <GlassPanel variant="noise" className="p-8 aspect-video relative flex flex-col justify-between overflow-hidden">
               {/* Background abstract gradient for contrast */}
               <div className="absolute inset-0 bg-gradient-to-br from-noctvm-violet/20 via-black to-blue-900/30 -z-10" />
               
               {/* The Extracted Progress Bar */}
               <div className="pt-2">
                 <StoryProgressBar 
                   totalStories={totalStories} 
                   currentIndex={currentIndex} 
                   progress={progress} 
                 />
               </div>

               {/* Mock Header Info */}
               <div className="flex items-center gap-3 mt-4">
                 <Avatar 
                    src="/default_avatars/cyber-neon.jpg" 
                    fallback="A" 
                    size="md" 
                    ring="story-unseen"
                 />
                 <div>
                   <p className="text-foreground font-semibold text-sm drop-shadow-md">alexa_nct</p>
                   <p className="text-xs text-foreground/70 drop-shadow-md">2h ago</p>
                 </div>
               </div>
               
               {/* Mock tap zones purely visual */}
               <div className="flex-1 flex w-full">
                  <div 
                    className="flex-1 cursor-pointer" 
                    onClick={() => {
                       setCurrentIndex(i => Math.max(0, i - 1));
                       setProgress(0);
                    }} 
                  />
                  <div 
                    className="flex-1 cursor-pointer"
                    onClick={() => {
                       setCurrentIndex(i => Math.min(totalStories - 1, i + 1));
                       setProgress(0);
                    }} 
                  />
               </div>
            </GlassPanel>

            <CodePreview code={`<StoryProgressBar 
  totalStories={4} 
  currentIndex={1} 
  progress={65} // Values 0 to 100
  activeColor="bg-noctvm-violet" // optionally override
/>`} />
          </section>

          <section className="space-y-4">
             <h2 className="text-xl font-heading font-semibold text-foreground">Story Avatar Rings</h2>
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
               <GlassPanel className="p-6 flex flex-col items-center gap-3 justify-center text-center">
                  <Avatar fallback="U" size="lg" ring="story-unseen" />
                  <div>
                    <p className="text-foreground font-semibold text-sm">New Story</p>
                    <p className="text-xs text-noctvm-silver">Violet-cyan gradient</p>
                  </div>
               </GlassPanel>
               <GlassPanel className="p-6 flex flex-col items-center gap-3 justify-center text-center">
                  <Avatar fallback="U" size="lg" ring="highlight" />
                  <div>
                    <p className="text-foreground font-semibold text-sm">Highlight</p>
                    <p className="text-xs text-noctvm-silver">Silver border</p>
                  </div>
               </GlassPanel>
               <GlassPanel className="p-6 flex flex-col items-center gap-3 justify-center text-center">
                  <Avatar fallback="U" size="lg" ring="story-seen" />
                  <div>
                    <p className="text-foreground font-semibold text-sm">Viewed Story</p>
                    <p className="text-xs text-noctvm-silver">Muted grey ring</p>
                  </div>
               </GlassPanel>
             </div>
          </section>

        </div>

        <div className="space-y-6">
          <GlassPanel className="p-6 sticky top-24">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-6">Technical Notes</h3>
            <ul className="space-y-4 text-sm text-noctvm-silver leading-relaxed list-disc list-inside">
              <li>The <code>StoryProgressBar</code> uses hardware-accelerated CSS transitions for the <code>width</code> property based on absolute numbers.</li>
              <li>Avatars handle their own ring borders via the newly configured <code>ringStyle</code> API inside the Avatar Atom primitive.</li>
            </ul>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}
