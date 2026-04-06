'use client';

import ColorBends from '@/components/ColorBends/ColorBends';

type AppBackdropMode = 'rich' | 'faded';

type AppBackdropProps = {
  mode: AppBackdropMode;
};

const colorBendsProps = {
  rotation: 70,
  speed: 0.1,
  colors: ['#8033cc', '#140f1a', '#f4b625'],
  transparent: true,
  autoRotate: 0.3,
  scale: 0.8,
  frequency: 1.7,
  warpStrength: 1,
  mouseInfluence: 1.2,
  parallax: 0.8,
  noise: 0.1,
};

export default function AppBackdrop({ mode }: AppBackdropProps) {
  const isRich = mode === 'rich';

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <div className="absolute inset-0 bg-noctvm-black" />

      <ColorBends
        className="absolute inset-0 transition-opacity duration-300"
        style={{ opacity: isRich ? 1 : 0.34 }}
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