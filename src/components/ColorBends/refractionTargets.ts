type RectLike = Pick<DOMRect, 'top' | 'right' | 'bottom' | 'left' | 'width' | 'height'>;

type CollectRefractionRectsArgs = {
  canvasRect: RectLike;
  viewport: {
    width: number;
    height: number;
  };
  targetRects: RectLike[];
  maxRects: number;
};

type RefractionRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function collectRefractionRects({
  canvasRect,
  viewport,
  targetRects,
  maxRects,
}: CollectRefractionRectsArgs): RefractionRect[] {
  if (maxRects <= 0 || canvasRect.width <= 0 || canvasRect.height <= 0) {
    return [];
  }

  const viewportLeft = 0;
  const viewportTop = 0;
  const viewportRight = Math.max(0, viewport.width);
  const viewportBottom = Math.max(0, viewport.height);
  const canvasLeft = canvasRect.left;
  const canvasTop = canvasRect.top;
  const canvasRight = canvasRect.right;
  const canvasBottom = canvasRect.bottom;

  const rects: RefractionRect[] = [];

  for (const targetRect of targetRects) {
    if (rects.length >= maxRects || targetRect.width <= 0 || targetRect.height <= 0) {
      continue;
    }

    const left = Math.max(targetRect.left, canvasLeft, viewportLeft);
    const top = Math.max(targetRect.top, canvasTop, viewportTop);
    const right = Math.min(targetRect.right, canvasRight, viewportRight);
    const bottom = Math.min(targetRect.bottom, canvasBottom, viewportBottom);
    const width = right - left;
    const height = bottom - top;

    if (width <= 0 || height <= 0) {
      continue;
    }

    rects.push({
      x: left - canvasLeft,
      y: canvasBottom - bottom,
      width,
      height,
    });
  }

  return rects;
}
