import { useState, useEffect, RefObject } from 'react';

export function useHeadroom(ref: RefObject<HTMLElement | null>, threshold: number = 100, scrollBuffer: number = 8) {
  const [headerHidden, setHeaderHidden] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let lastY = el.scrollTop;

    const handler = () => {
      const y = el.scrollTop;
      const diff = y - lastY;

      // Scrolling down - hide header
      if (diff > scrollBuffer && y > threshold) {
        setHeaderHidden(true);
      } 
      // Scrolling up - show header
      else if (diff < -scrollBuffer) {
        setHeaderHidden(false);
      }

      lastY = y;
    };

    el.addEventListener('scroll', handler, { passive: true });
    return () => el.removeEventListener('scroll', handler);
  }, [ref, threshold, scrollBuffer]);

  return headerHidden;
}
