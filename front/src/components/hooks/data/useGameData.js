import { useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { GAME_NOT_STARTED_MESSAGE } from '../../../domain/game-selection/status';
import { DEFAULT_GAMEPACK_STATE } from '../../../data/gamepackAdapter';
import {
  createDefaultGamePackResult,
  fetchGamePackData,
  fetchScheduleData,
  gamePackQueryKey,
  gamePackUrlQueryKey,
  scheduleQueryKey,
} from '../../../data/gameQueries';

/**
 * Hook for fetching and managing game data (box score, play-by-play, and schedule)
 */
export function useGameData() {
  const queryClient = useQueryClient();
  const activeGameIdRef = useRef(null);
  const [box, setBox] = useState(DEFAULT_GAMEPACK_STATE.box);
  const [playByPlay, setPlayByPlay] = useState(DEFAULT_GAMEPACK_STATE.playByPlay);
  const [awayTeamId, setAwayTeamId] = useState(DEFAULT_GAMEPACK_STATE.awayTeamId);
  const [homeTeamId, setHomeTeamId] = useState(DEFAULT_GAMEPACK_STATE.homeTeamId);
  const [nbaGameId, setNbaGameId] = useState(DEFAULT_GAMEPACK_STATE.nbaGameId);
  const [numPeriods, setNumPeriods] = useState(DEFAULT_GAMEPACK_STATE.numPeriods);
  const [lastAction, setLastAction] = useState(DEFAULT_GAMEPACK_STATE.lastAction);
  const [captions, setCaptions] = useState(DEFAULT_GAMEPACK_STATE.captions);
  const [gameStatusMessage, setGameStatusMessage] = useState(null);

  const [schedule, setSchedule] = useState([]);
  const [isScheduleLoading, setIsScheduleLoading] = useState(false);

  const [isBoxLoading, setIsBoxLoading] = useState(true);
  const [isPlayLoading, setIsPlayLoading] = useState(true);

  const applyGameDataState = useCallback((state) => {
    setBox(state.box);
    setPlayByPlay(state.playByPlay);
    setAwayTeamId(state.awayTeamId);
    setHomeTeamId(state.homeTeamId);
    setNbaGameId(state.nbaGameId);
    setNumPeriods(state.numPeriods);
    setLastAction(state.lastAction);
    setCaptions(state.captions);
  }, []);

  const transitionGameLoading = useCallback((showLoading) => {
    if (showLoading) {
      setIsBoxLoading(true);
      setIsPlayLoading(true);
    }
    setGameStatusMessage(null);
  }, []);

  const transitionGameNotStarted = useCallback(() => {
    setGameStatusMessage(GAME_NOT_STARTED_MESSAGE);
    applyGameDataState(DEFAULT_GAMEPACK_STATE);
  }, [applyGameDataState]);

  const transitionGameError = useCallback((errorLike) => {
    console.error('Error in fetchGamePack:', errorLike);
  }, []);

  const completeGameLoading = useCallback((showLoading) => {
    if (!showLoading) {
      return;
    }
    setIsBoxLoading(false);
    setIsPlayLoading(false);
  }, []);

  const fetchSchedule = useCallback(
    async (dateString) => {
      if (!dateString) return;

      setIsScheduleLoading(true);

      try {
        const nextSchedule = await queryClient.fetchQuery({
          queryKey: scheduleQueryKey(dateString),
          queryFn: () => fetchScheduleData(dateString),
        });
        setSchedule(nextSchedule);
      } finally {
        setIsScheduleLoading(false);
      }
    },
    [queryClient],
  );

  const fetchGamePack = useCallback(
    async ({ gameId, url, showLoading = true } = {}) => {
      if (!gameId && !url) return;
      if (gameId) {
        activeGameIdRef.current = gameId;
      }
      transitionGameLoading(showLoading);

      try {
        const queryKey = url ? gamePackUrlQueryKey(url) : gamePackQueryKey(gameId);
        const activeGameId = gameId || activeGameIdRef.current;
        const currentState = {
          box,
          playByPlay,
          awayTeamId,
          homeTeamId,
          nbaGameId,
          numPeriods,
          lastAction,
          captions,
          gameStatusMessage,
        };
        const previousState =
          (activeGameId ? queryClient.getQueryData(gamePackQueryKey(activeGameId))?.state : null) ||
          currentState ||
          createDefaultGamePackResult();
        const result = await queryClient.fetchQuery({
          queryKey,
          queryFn: () => fetchGamePackData({ gameId, url, previousState }),
        });

        if (result.status === 'not-available') {
          transitionGameNotStarted();
          return;
        }

        if (result.status !== 'success') {
          transitionGameError(result.error);
          return;
        }

        applyGameDataState(result.state);
        if (activeGameId) {
          queryClient.setQueryData(gamePackQueryKey(activeGameId), result);
        }
      } finally {
        completeGameLoading(showLoading);
      }
    },
    [
      applyGameDataState,
      awayTeamId,
      box,
      captions,
      completeGameLoading,
      gameStatusMessage,
      homeTeamId,
      lastAction,
      nbaGameId,
      numPeriods,
      playByPlay,
      queryClient,
      transitionGameError,
      transitionGameLoading,
      transitionGameNotStarted,
    ],
  );

  const setGameNotStarted = useCallback(() => {
    transitionGameNotStarted();
    setIsBoxLoading(false);
    setIsPlayLoading(false);
  }, [transitionGameNotStarted]);

  /**
   * Reset loading states when game changes
   */
  const resetLoadingStates = useCallback(() => {
    activeGameIdRef.current = null;
    setIsBoxLoading(true);
    setIsPlayLoading(true);
    setGameStatusMessage(null);
    setNbaGameId(null);
  }, []);

  return {
    box,
    playByPlay,
    schedule,
    awayTeamId,
    homeTeamId,
    nbaGameId,
    numPeriods,
    lastAction,
    captions,
    gameStatusMessage,
    isBoxLoading,
    isPlayLoading,
    isScheduleLoading,
    fetchGamePack,
    setGameNotStarted,
    fetchSchedule,
    resetLoadingStates,
  };
}
