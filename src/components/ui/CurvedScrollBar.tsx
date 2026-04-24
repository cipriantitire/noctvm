'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type HTMLAttributes, type ReactNode, type UIEvent } from 'react';
import { cn } from '@/lib/cn';

export type CurvedScrollBarProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  viewportClassName?: string;
  contentClassName?: string;
  scrollBarColor?: string;
  scrollBarWidth?: number;
  showRail?: boolean;
  cornerRadius?: number;
  edgePadding?: number;
  verticalInset?: number;
  horizontalPosition?: number;
  visibleLength?: number;
  inactiveOpacity?: number;
  fadeEdges?: boolean;
};

type Metrics = {
  width: number;
  height: number;
  contentHeight: number;
  contentWidth: number;
};

type RailGeometry = {
  railPath: string;
  totalLength: number;
};

const DEFAULT_SCROLL_BAR_COLOR = 'rgb(var(--noctvm-violet-rgb) / 0.92)';
const DEFAULT_EDGE_PADDING = 4;
const DEFAULT_VERTICAL_INSET = 2;
const DEFAULT_CORNER_RADIUS = 16;
const DEFAULT_HORIZONTAL_POSITION = 1.1;
const DEFAULT_VISIBLE_LENGTH = 70;
const DEFAULT_INACTIVE_OPACITY = 0.3;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function buildRailGeometry(
  width: number,
  height: number,
  cornerRadius: number,
  edgePadding: number,
  verticalInset: number,
  horizontalPosition: number,
): RailGeometry {
  if (width <= 0 || height <= 0) {
    return { railPath: '', totalLength: 0 };
  }

  const safeEdgePadding = Math.max(0, edgePadding);
  const safeVerticalInset = Math.max(0, verticalInset);
  const safeCornerRadius = Math.max(
    0,
    Math.min(cornerRadius, (width - safeEdgePadding * 2) / 2, (height - safeVerticalInset * 2) / 2),
  );
  const safeHorizontalPosition = Math.max(1.02, horizontalPosition);
  const topY = safeVerticalInset;
  const bottomY = height - safeVerticalInset;
  const leftX = width / safeHorizontalPosition;
  const rightX = width - safeEdgePadding;
  const cornerX = rightX - safeCornerRadius;

  const points = [
    { x: leftX, y: topY },
    { x: cornerX, y: topY },
    { x: rightX, y: topY + safeCornerRadius },
    { x: rightX, y: bottomY - safeCornerRadius },
    { x: cornerX, y: bottomY },
    { x: leftX, y: bottomY },
  ];

  let totalLength = 0;

  for (let index = 0; index < points.length - 1; index += 1) {
    if (index === 1 || index === 3) {
      totalLength += (Math.PI * safeCornerRadius) / 2;
      continue;
    }

    const dx = points[index + 1].x - points[index].x;
    const dy = points[index + 1].y - points[index].y;
    totalLength += Math.sqrt(dx * dx + dy * dy);
  }

  const railPath = safeCornerRadius > 0
    ? `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y} A ${safeCornerRadius} ${safeCornerRadius} 0 0 1 ${points[2].x} ${points[2].y} L ${points[3].x} ${points[3].y} A ${safeCornerRadius} ${safeCornerRadius} 0 0 1 ${points[4].x} ${points[4].y} L ${points[5].x} ${points[5].y}`
    : `M ${points[0].x} ${points[0].y} L ${points[2].x} ${points[2].y} L ${points[3].x} ${points[3].y} L ${points[5].x} ${points[5].y}`;

  return { railPath, totalLength };
}

export default function CurvedScrollBar({
  children,
  className,
  viewportClassName,
  contentClassName,
  scrollBarColor = DEFAULT_SCROLL_BAR_COLOR,
  scrollBarWidth = 6,
  showRail = true,
  cornerRadius = DEFAULT_CORNER_RADIUS,
  edgePadding = DEFAULT_EDGE_PADDING,
  verticalInset = DEFAULT_VERTICAL_INSET,
  horizontalPosition = DEFAULT_HORIZONTAL_POSITION,
  visibleLength = DEFAULT_VISIBLE_LENGTH,
  inactiveOpacity = DEFAULT_INACTIVE_OPACITY,
  fadeEdges = false,
  ...rest
}: CurvedScrollBarProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const scrollFadeTimeoutRef = useRef<number | null>(null);
  const pendingProgressRef = useRef(0);
  const [metrics, setMetrics] = useState<Metrics>({ width: 0, height: 0, contentHeight: 0, contentWidth: 0 });
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isScrollActive, setIsScrollActive] = useState(false);
  const [fadeMask, setFadeMask] = useState('');

  const computeFadeMask = useCallback((el: HTMLDivElement) => {
    if (!fadeEdges) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const canScrollUp = scrollTop > 1;
    const canScrollDown = scrollTop < scrollHeight - clientHeight - 1;
    const topStop = canScrollUp ? 'transparent' : 'black';
    const bottomStop = canScrollDown ? 'transparent' : 'black';
    setFadeMask(`linear-gradient(to bottom, ${topStop}, black 16px, black calc(100% - 16px), ${bottomStop})`);
  }, [fadeEdges]);

  const measure = useCallback(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;

    if (!viewport || !content) {
      return;
    }

    setMetrics({
      width: viewport.clientWidth,
      height: viewport.clientHeight,
      contentHeight: content.scrollHeight,
      contentWidth: content.scrollWidth,
    });
    computeFadeMask(viewport);
  }, [computeFadeMask]);

  useEffect(() => {
    measure();

    const viewport = viewportRef.current;
    const content = contentRef.current;

    if (!viewport || !content) {
      return undefined;
    }

    if (typeof ResizeObserver === 'undefined') {
      const handleResize = () => measure();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }

    const observer = new ResizeObserver(() => {
      measure();
    });

    observer.observe(viewport);
    observer.observe(content);

    return () => {
      observer.disconnect();
    };
  }, [measure]);

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
      if (scrollFadeTimeoutRef.current !== null) {
        window.clearTimeout(scrollFadeTimeoutRef.current);
      }
    };
  }, []);

  const commitProgress = useCallback(() => {
    frameRef.current = null;
    setScrollProgress(pendingProgressRef.current);
  }, []);

  const handleScroll = useCallback((event: UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    const maxScrollDistance = target.scrollHeight - target.clientHeight;
    const nextProgress = maxScrollDistance > 0 ? target.scrollTop / maxScrollDistance : 0;

    pendingProgressRef.current = clamp(nextProgress, 0, 1);

    if (scrollFadeTimeoutRef.current !== null) {
      window.clearTimeout(scrollFadeTimeoutRef.current);
    }

    setIsScrollActive(true);
    scrollFadeTimeoutRef.current = window.setTimeout(() => {
      scrollFadeTimeoutRef.current = null;
      setIsScrollActive(false);
    }, 900);

    if (frameRef.current !== null) {
      return;
    }

    frameRef.current = window.requestAnimationFrame(commitProgress);
    computeFadeMask(target);
  }, [commitProgress, computeFadeMask]);

  const railGeometry = useMemo(
    () => buildRailGeometry(metrics.width, metrics.height, cornerRadius, edgePadding, verticalInset, horizontalPosition),
    [edgePadding, horizontalPosition, cornerRadius, metrics.height, metrics.width, verticalInset],
  );

  const isScrollable = metrics.contentHeight > metrics.height + 1;
  const isRailActive = isScrollable && (isHovered || isScrollActive);
  const thumbLength = Math.min(visibleLength, railGeometry.totalLength);
  const dashArray = `${thumbLength} ${railGeometry.totalLength || 1}`;
  const dashOffset = -scrollProgress * railGeometry.totalLength + thumbLength / 2;
  const railOpacity = isScrollable ? (isRailActive ? 1 : inactiveOpacity) : inactiveOpacity;
  const thumbOpacity = isScrollable ? (isRailActive ? 1 : 0.75) : 0;
  const trackOpacity = isScrollable ? (isRailActive ? 0.2 : 0.08) : 0;

  return (
    <div
      {...rest}
      className={cn('relative flex flex-col min-h-0 w-full', className)}
    >
      <div
        ref={viewportRef}
        onScroll={handleScroll}
        onPointerEnter={() => setIsHovered(true)}
        onPointerLeave={() => setIsHovered(false)}
        className={cn('min-h-0 flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide', viewportClassName)}
        style={fadeMask ? { WebkitMaskImage: fadeMask, maskImage: fadeMask } : undefined}
      >
        <div ref={contentRef} className={cn('relative min-h-full w-full', contentClassName)}>
          {children}
        </div>
      </div>

      {showRail && railGeometry.railPath && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-20 overflow-hidden transition-opacity duration-200 ease-out"
          style={{ opacity: railOpacity }}
        >
          <svg
            width={metrics.width}
            height={metrics.height}
            className="absolute inset-0"
            focusable="false"
            aria-hidden="true"
          >
            <path
              d={railGeometry.railPath}
              stroke={scrollBarColor}
              strokeWidth={scrollBarWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              opacity={trackOpacity}
              style={{ filter: 'drop-shadow(0 0 6px rgb(var(--noctvm-violet-rgb) / 0.12))' }}
            />
            <path
              d={railGeometry.railPath}
              stroke={scrollBarColor}
              strokeWidth={scrollBarWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
              opacity={thumbOpacity}
              style={{ filter: isRailActive ? 'drop-shadow(0 0 10px rgb(var(--noctvm-violet-rgb) / 0.28))' : 'drop-shadow(0 0 7px rgb(var(--noctvm-violet-rgb) / 0.18))' }}
            />
          </svg>
        </div>
      )}
    </div>
  );
}