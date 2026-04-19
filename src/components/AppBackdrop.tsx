'use client';

import { useEffect, useMemo, useState } from 'react';
import ColorBends from '@/components/ColorBends/ColorBends';

type AppBackdropMode = 'rich' | 'faded';

type AppBackdropProps = {
  mode: AppBackdropMode;
  paused?: boolean;
};

const baseColorBendsProps = {
  rotation: 70,
  speed: 0.1,
  colors: ['#8033cc', '#140f1a', '#f4b625'],
  transparent: true,
  autoRotate: 0.3,
  scale: 0.8,
  frequency: 1.7,
  warpStrength: 1,
  mouseInfluence: 0.55,
  parallax: 0.35,
  noise: 0.07,
};

export default function AppBackdrop({ mode, paused = false }: AppBackdropProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(max-width: 1023px)');
    const update = () => setIsMobile(media.matches);
    update();

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', update);
      return () => media.removeEventListener('change', update);
    }

    media.addListener(update);
    return () => media.removeListener(update);
  }, []);

  const colorBendsProps = useMemo(() => ({
    ...baseColorBendsProps,
    interactive: !isMobile,
    mouseInfluence: isMobile ? 0 : baseColorBendsProps.mouseInfluence,
    parallax: isMobile ? 0 : baseColorBendsProps.parallax,
    noise: isMobile ? 0.04 : baseColorBendsProps.noise,
    maxPixelRatio: isMobile ? 1.1 : 1.5,
  }), [isMobile]);

  const isRich = mode === 'rich';
  const refractionStrength = isMobile ? 0.66 : 1.3;

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <div className="absolute inset-0 bg-noctvm-black" />

      <ColorBends
        className="absolute inset-0 transition-opacity duration-300"
        style={{ opacity: isRich ? 1 : 0.34 }}
        isPaused={paused}
        refraction={isRich}
        refractionStrength={refractionStrength}
        {...colorBendsProps}
      />

      <div
        className="absolute inset-0"
        style={{
          background: isRich
            ? 'linear-gradient(180deg, rgba(5,5,5,0.06) 0%, rgba(5,5,5,0.16) 100%)'
            : 'linear-gradient(180deg, rgba(5,5,5,0.48) 0%, rgba(5,5,5,0.76) 100%)',
        }}
      />

      {!isRich && (
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(120% 100% at 50% 0%, rgba(255,255,255,0.02) 0%, transparent 55%)',
            opacity: 0.55,
          }}
        />
      )}
    </div>
  );
}
