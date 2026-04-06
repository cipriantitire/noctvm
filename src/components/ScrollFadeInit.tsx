"use client";

import { useEffect } from 'react';

export default function ScrollFadeInit() {
  useEffect(() => {
    const SELECTOR = '.scrollbar-hide, [data-scroll-fade]';
    const managed = new Set<HTMLElement>();

    function isScrollable(e: HTMLElement) {
      const style = getComputedStyle(e);
      const overflowY = style.overflowY;
      const overflowX = style.overflowX;
      const overflow = style.overflow;
      const vert = (overflowY === 'auto' || overflowY === 'scroll' || overflow === 'auto' || overflow === 'scroll') && e.scrollHeight > e.clientHeight;
      const horz = (overflowX === 'auto' || overflowX === 'scroll' || overflow === 'auto' || overflow === 'scroll') && e.scrollWidth > e.clientWidth;
      return { vert, horz };
    }

    function updateVars(e: HTMLElement, vert: boolean, horz: boolean) {
      // Respect explicit opt-out
      if (e.classList.contains('no-scroll-fade')) {
        e.style.setProperty('--fade-top-start', '0%');
        e.style.setProperty('--fade-top-end', '0%');
        e.style.setProperty('--fade-bottom-start', '100%');
        e.style.setProperty('--fade-bottom-end', '100%');
        e.style.setProperty('--fade-left-start', '0%');
        e.style.setProperty('--fade-left-end', '0%');
        e.style.setProperty('--fade-right-start', '100%');
        e.style.setProperty('--fade-right-end', '100%');
        e.classList.remove('scroll-fade', 'scrollable-vertical', 'scrollable-horizontal', 'scrollable-both');
        return;
      }

      if (!vert && !horz) {
        e.style.setProperty('--fade-top-start', '0%');
        e.style.setProperty('--fade-top-end', '0%');
        e.style.setProperty('--fade-bottom-start', '100%');
        e.style.setProperty('--fade-bottom-end', '100%');
        e.style.setProperty('--fade-left-start', '0%');
        e.style.setProperty('--fade-left-end', '0%');
        e.style.setProperty('--fade-right-start', '100%');
        e.style.setProperty('--fade-right-end', '100%');
        e.classList.remove('scroll-fade', 'scrollable-vertical', 'scrollable-horizontal', 'scrollable-both');
        return;
      }

      e.classList.add('scroll-fade');

      if (vert && horz) {
        e.classList.add('scrollable-both');
        e.classList.remove('scrollable-vertical', 'scrollable-horizontal');
      } else if (vert) {
        e.classList.add('scrollable-vertical');
        e.classList.remove('scrollable-horizontal', 'scrollable-both');
      } else {
        e.classList.add('scrollable-horizontal');
        e.classList.remove('scrollable-vertical', 'scrollable-both');
      }

      const update = () => {
        if (vert) {
          const maxScrollTop = e.scrollHeight - e.clientHeight;
          const topVisible = e.scrollTop > 6;
          const bottomVisible = e.scrollTop < (maxScrollTop - 6);
          e.style.setProperty('--fade-top-start', '0%');
          e.style.setProperty('--fade-top-end', topVisible ? '6%' : '0%');
          e.style.setProperty('--fade-bottom-start', bottomVisible ? '94%' : '100%');
          e.style.setProperty('--fade-bottom-end', bottomVisible ? '99%' : '100%');
        }

        if (horz) {
          const maxScrollLeft = e.scrollWidth - e.clientWidth;
          const leftVisible = e.scrollLeft > 6;
          const rightVisible = e.scrollLeft < (maxScrollLeft - 6);
          e.style.setProperty('--fade-left-start', '0%');
          e.style.setProperty('--fade-left-end', leftVisible ? '6%' : '0%');
          e.style.setProperty('--fade-right-start', rightVisible ? '94%' : '100%');
          e.style.setProperty('--fade-right-end', rightVisible ? '99%' : '100%');
        }
      };

      update();

      const onScroll = () => update();
      e.addEventListener('scroll', onScroll, { passive: true });

      const ro = new ResizeObserver(() => {
        // Re-evaluate scrollability and vars on resize
        const { vert: v2, horz: h2 } = isScrollable(e);
        updateVars(e, v2, h2);
      });
      ro.observe(e);

      // store cleanup
      (e as any).__scrollFadeCleanup = () => {
        e.removeEventListener('scroll', onScroll);
        ro.disconnect();
      };
    }

    function scanAndAttach() {
      document.querySelectorAll(SELECTOR).forEach((node) => {
        const el = node as HTMLElement;
        if (el.classList.contains('no-scroll-fade')) return; // explicit opt-out
        if (managed.has(el)) return;
        managed.add(el);
        const { vert, horz } = isScrollable(el);
        updateVars(el, vert, horz);
      });
    }

    // Initial scan
    scanAndAttach();

    // Watch for DOM additions and attribute/class changes (new scrollable containers)
    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'childList') scanAndAttach();
        if (m.type === 'attributes') {
          const target = m.target as HTMLElement;
          if (managed.has(target)) {
            const { vert, horz } = isScrollable(target);
            updateVars(target, vert, horz);
          }
        }
      }
    });

    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });

    const onWinResize = () => managed.forEach((el) => {
      const { vert, horz } = isScrollable(el);
      updateVars(el, vert, horz);
    });
    window.addEventListener('resize', onWinResize);

    return () => {
      mo.disconnect();
      window.removeEventListener('resize', onWinResize);
      managed.forEach((el) => {
        const cleanup = (el as any).__scrollFadeCleanup;
        if (cleanup) cleanup();
      });
    };
  }, []);

  return null;
}
