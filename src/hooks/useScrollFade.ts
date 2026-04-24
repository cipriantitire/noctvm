'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type ScrollFadeDirection = 'x' | 'y';

export function useScrollFade(direction: ScrollFadeDirection): {
  ref: React.MutableRefObject<HTMLDivElement | null>;
  maskStyle: React.CSSProperties;
} {
  const ref = useRef<HTMLDivElement>(null);
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

    // Initial measurement after layout paint
    let raf1 = requestAnimationFrame(() => {
      update();
      raf1 = 0;
    });

    let raf2 = requestAnimationFrame(() => {
      raf2 = 0;
    });
    raf2 = requestAnimationFrame(() => {
      update();
      raf2 = 0;
    });

    el.addEventListener('scroll', update, { passive: true });

    let ro: ResizeObserver | undefined;
    let mo: MutationObserver | undefined;

    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(update);
      ro.observe(el);
      // Observe ALL children so scrollWidth/scrollHeight changes are caught
      el.querySelectorAll('*').forEach((child) => ro!.observe(child));
    }

    if (typeof MutationObserver !== 'undefined') {
      mo = new MutationObserver(() => {
        update();
        // New children might have been added — observe them too
        if (ro) {
          el.querySelectorAll('*').forEach((child) => {
            try { ro!.observe(child); } catch { /* already observed */ }
          });
        }
      });
      mo.observe(el, { childList: true, subtree: true });
    }

    window.addEventListener('resize', update);

    const handleImgLoad = () => update();
    el.addEventListener('load', handleImgLoad, true);

    // Recompute after CSS animations/transitions that might change layout
    const handleTransitionEnd = () => update();
    el.addEventListener('transitionend', handleTransitionEnd, true);
    el.addEventListener('animationend', handleTransitionEnd, true);

    const timeoutId = window.setTimeout(update, 350);
    const timeoutId2 = window.setTimeout(update, 800);

    return () => {
      el.removeEventListener('scroll', update);
      el.removeEventListener('load', handleImgLoad, true);
      el.removeEventListener('transitionend', handleTransitionEnd, true);
      el.removeEventListener('animationend', handleTransitionEnd, true);
      if (ro) ro.disconnect();
      if (mo) mo.disconnect();
      window.removeEventListener('resize', update);
      window.clearTimeout(timeoutId);
      window.clearTimeout(timeoutId2);
      if (raf1) cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
    };
  }, [update]);

  const maskStyle = mask
    ? { WebkitMaskImage: mask, maskImage: mask }
    : {};

  return { ref, maskStyle };
}
