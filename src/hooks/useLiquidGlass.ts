'use client';

import { useEffect } from 'react';

/**
 * useLiquidGlass — Desktop mouse-reactive shimmer for .liquid-glass elements.
 *
 * Tracks mouse position over any element with class "liquid-glass" and sets
 * CSS custom properties --mouse-x and --mouse-y (0-100 range) so the
 * radial-gradient highlight follows the cursor like tilting a glass pane.
 *
 * On mobile (no hover capability), the default CSS animation plays instead.
 * The hook adds the "lg-mouse" class on desktop to activate the override.
 */
export function useLiquidGlass() {
  useEffect(() => {
    // Only activate on devices with a fine pointer (desktop/laptop)
    const isDesktop = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!isDesktop) return;

    const elements = document.querySelectorAll<HTMLElement>('.liquid-glass');
    if (elements.length === 0) return;

    // Add the lg-mouse class so CSS knows to swap animation for mouse-driven gradient
    elements.forEach(el => el.classList.add('lg-mouse'));

    const handlers = new Map<HTMLElement, {
      move: (e: MouseEvent) => void;
      leave: () => void;
    }>();

    elements.forEach(el => {
      const onMove = (e: MouseEvent) => {
        const rect = el.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        el.style.setProperty('--mouse-x', String(Math.round(x)));
        el.style.setProperty('--mouse-y', String(Math.round(y)));
      };

      const onLeave = () => {
        // Reset to center when mouse leaves — gentle fade back
        el.style.setProperty('--mouse-x', '50');
        el.style.setProperty('--mouse-y', '50');
      };

      el.addEventListener('mousemove', onMove);
      el.addEventListener('mouseleave', onLeave);
      handlers.set(el, { move: onMove, leave: onLeave });
    });

    return () => {
      handlers.forEach(({ move, leave }, el) => {
        el.removeEventListener('mousemove', move);
        el.removeEventListener('mouseleave', leave);
        el.classList.remove('lg-mouse');
      });
    };
  }, []);
}
