import { useCallback, useEffect, useMemo, useState } from 'react';

type EventLike = {
  id: string;
};

export function useProgressiveEvents<TEvent extends EventLike>(events: TEvent[], batchSize = 36) {
  const eventKey = events.map((event) => event.id).join('|');
  const [visibleCount, setVisibleCount] = useState(batchSize);

  useEffect(() => {
    setVisibleCount(batchSize);
  }, [batchSize, eventKey]);

  const visibleEvents = useMemo(
    () => events.slice(0, visibleCount),
    [events, visibleCount],
  );

  const showMore = useCallback(() => {
    setVisibleCount((count) => Math.min(count + batchSize, events.length));
  }, [batchSize, events.length]);

  return {
    visibleEvents,
    hasMore: visibleCount < events.length,
    showMore,
    visibleCount,
  };
}
