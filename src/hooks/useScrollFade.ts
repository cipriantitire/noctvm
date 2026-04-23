'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type ScrollFadeDirection = 'x' | 'y';

export function useScrollFade(direction: ScrollFadeDirection): {
  ref: React.MutableRefObject<HTMLDivElement | null>;
  maskStyle: React.CSSProperties;
} {
  const [ref] = useState<React.MutableRefObject<HTMLDivElement | null>>(() => ({ current: null }));
  const [mask, setMask] = useState('');

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;

    const { scrollLeft, scrollTop, scrollWidth, scrollHeight, clientWidth, clientHeight } = el;

    if (direction === 'x') {
      const canScrollLeft = scrollLeft > 1;
      const canScrollRight = scrollLeft < scrollWidth - clientWidth - 1;
      const leftStop = canScrollLeft ? 'transparent' : 'black';
      const rightStop = canScrollRight ? 'transparent' : 'black';
      const m = `linear-gradient(to right, ${leftStop}, black 16px, black calc(100% - 16px), ${rightStop})`;
      setMask(m);
    } else {
      const canScrollUp = scrollTop > 1;
      const canScrollDown = scrollTop < scrollHeight - clientHeight - 1;
      const topStop = canScrollUp ? 'transparent' : 'black';
      const bottomStop = canScrollDown ? 'transparent' : 'black';
      const m = `linear-gradient(to bottom, ${topStop}, black 16px, black calc(100% - 16px), ${bottomStop})`;
      setMask(m);
    }
  }, [direction]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    update();
    el.addEventListener('scroll', update, { passive: true });

    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(update);
      ro.observe(el);
    } else {
      window.addEventListener('resize', update);
    }

    return () => {
      el.removeEventListener('scroll', update);
      if (ro) ro.disconnect();
      else window.removeEventListener('resize', update);
    };
  }, [update]);

  const maskStyle = mask
    ? { WebkitMaskImage: mask, maskImage: mask }
    : {};

  return { ref, maskStyle };
}
