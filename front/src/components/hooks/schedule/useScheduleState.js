import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  parseGameSlug,
  scheduleMatchesDate,
  sortGamesForSelection,
} from '../../../domain/game-selection/status';
import { fetchInitData, initQueryKey } from '../../../data/gameQueries';

export function useScheduleState({
  initialDate,
  initialGameId,
  gameId,
  setGameId,
  schedule,
  isScheduleLoading,
  fetchScheduleWithReason,
}) {
  const queryClient = useQueryClient();
  // Start null if no URL params; wait for init.json to provide the date.
  const [date, setDate] = useState(initialDate || null);
  const [isInitLoading, setIsInitLoading] = useState(!initialDate);

  useEffect(() => {
    if (date) return;

    const fallbackDate = new Date().toISOString().split('T')[0];

    const fetchInitState = async () => {
      try {
        const normalizedInit = await queryClient.fetchQuery({
          queryKey: initQueryKey(),
          queryFn: () => fetchInitData({ fallbackDate }),
        });

        setDate(normalizedInit.date);
        if (normalizedInit.autoSelectGameId && !initialGameId) {
          const slugParams = parseGameSlug(normalizedInit.autoSelectGameId);
          if (slugParams) {
            setGameId(slugParams.gameId);
          }
        }
      } catch (err) {
        console.error('Init fetch failed:', err);
        setDate(fallbackDate);
      } finally {
        setIsInitLoading(false);
      }
    };

    fetchInitState();
  }, [date, initialGameId, queryClient, setGameId]);

  useEffect(() => {
    if (date) {
      fetchScheduleWithReason(date, 'date-change');
    }
  }, [date, fetchScheduleWithReason]);

  const sortedGames = useMemo(() => sortGamesForSelection(schedule || []), [schedule]);

  useEffect(() => {
    if (!date || gameId || isScheduleLoading) {
      return;
    }
    if (!sortedGames.length || !scheduleMatchesDate(sortedGames, date)) {
      return;
    }
    const defaultGame = sortedGames[0];
    if (!defaultGame?.id) {
      return;
    }
    setGameId(String(defaultGame.id));
  }, [date, gameId, isScheduleLoading, sortedGames, setGameId]);

  const changeDate = useCallback(
    (newDate) => {
      if (!newDate || newDate === date) {
        return;
      }
      setDate(newDate);
    },
    [date],
  );

  return {
    date,
    isInitLoading,
    changeDate,
    sortedGames,
  };
}
