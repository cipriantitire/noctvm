import { useCallback, useEffect, useMemo, useState } from 'react';
import type { NoctEvent } from '@/lib/types';
import { supabase } from '@/lib/supabase';

export type EventSaveState = {
  isSaved: boolean;
  saveCount: number;
};

type EventSaveStateMap = Record<string, EventSaveState>;
type EventSaveSeed = {
  id: string;
  saveCount: number;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isPersistedEventId(id: string): boolean {
  return UUID_RE.test(id);
}

function buildBaseSaveStates(seeds: EventSaveSeed[]): EventSaveStateMap {
  return seeds.reduce<EventSaveStateMap>((states, event) => {
    states[event.id] = {
      isSaved: false,
      saveCount: event.saveCount,
    };
    return states;
  }, {});
}

export function useEventSaveStates(events: NoctEvent[], userId?: string) {
  const eventSeedKey = JSON.stringify(events.map((event) => [event.id, event.save_count ?? 0]));
  const eventSeeds = useMemo(
    () =>
      (JSON.parse(eventSeedKey) as [string, number][]).map(([id, saveCount]) => ({
        id,
        saveCount,
      })),
    [eventSeedKey],
  );
  const baseSaveStates = useMemo(() => buildBaseSaveStates(eventSeeds), [eventSeeds]);
  const persistedEventIds = useMemo(
    () => eventSeeds.map((event) => event.id).filter(isPersistedEventId),
    [eventSeeds],
  );
  const [saveStates, setSaveStates] = useState<EventSaveStateMap>(baseSaveStates);

  useEffect(() => {
    setSaveStates((previous) => {
      const nextStates = buildBaseSaveStates(eventSeeds);

      for (const event of eventSeeds) {
        if (previous[event.id]) {
          nextStates[event.id] = {
            isSaved: previous[event.id].isSaved,
            saveCount: previous[event.id].saveCount,
          };
        }
      }

      return nextStates;
    });
  }, [eventSeeds]);

  useEffect(() => {
    if (!userId || persistedEventIds.length === 0) {
      setSaveStates((previous) => {
        const nextStates = { ...previous };
        for (const eventId of Object.keys(nextStates)) {
          nextStates[eventId] = {
            ...nextStates[eventId],
            isSaved: false,
          };
        }
        return nextStates;
      });
      return;
    }

    let isCancelled = false;

    async function loadSavedFlags() {
      try {
        const { data, error } = await supabase
          .from('event_saves')
          .select('event_id')
          .eq('user_id', userId)
          .in('event_id', persistedEventIds);

        if (isCancelled || error) {
          return;
        }

        const savedIds = new Set((data ?? []).map((row: { event_id: string }) => row.event_id));
        setSaveStates((previous) => {
          const nextStates = { ...previous };
          for (const eventId of persistedEventIds) {
            if (!nextStates[eventId]) continue;
            nextStates[eventId] = {
              ...nextStates[eventId],
              isSaved: savedIds.has(eventId),
            };
          }
          return nextStates;
        });
      } catch {
        // Keep optimistic/default card state if the batch read fails.
      }
    }

    loadSavedFlags();

    return () => {
      isCancelled = true;
    };
  }, [persistedEventIds, userId]);

  const handleSaveStateChange = useCallback((eventId: string, state: EventSaveState) => {
    setSaveStates((previous) => ({
      ...previous,
      [eventId]: state,
    }));
  }, []);

  return {
    saveStates,
    handleSaveStateChange,
  };
}
