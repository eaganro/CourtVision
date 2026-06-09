import { PREFIX } from '../environment';
import { GAME_NOT_STARTED_MESSAGE } from '../domain/game-selection/status';
import { classifyFetchResult, fetchJson } from './apiClient';
import { adaptGamePackPayload, DEFAULT_GAMEPACK_STATE } from './gamepackAdapter';
import { normalizeInitPayload, normalizeSchedulePayload } from './scheduleAdapter';

export const initQueryKey = () => ['init'];
export const scheduleQueryKey = (dateString) => ['schedule', dateString];
export const gamePackQueryKey = (gameId) => ['gamepack', gameId];
export const gamePackUrlQueryKey = (url) => ['gamepack-url', url];

export const GAMEPACK_RESULT_STATUS = {
  SUCCESS: 'success',
  NOT_AVAILABLE: 'not-available',
  ERROR: 'error',
};

export const createDefaultGamePackResult = () => ({
  ...DEFAULT_GAMEPACK_STATE,
  gameStatusMessage: null,
});

export const mergeGamePackPayload = (previousState, payload) => {
  const previous = previousState || createDefaultGamePackResult();
  const adapted = adaptGamePackPayload(payload);

  return {
    box: adapted.hasBoxData ? adapted.boxData : previous.box,
    playByPlay: adapted.hasPlayData ? adapted.playData : previous.playByPlay,
    awayTeamId: adapted.hasBoxData ? adapted.awayTeamId : previous.awayTeamId,
    homeTeamId: adapted.hasBoxData ? adapted.homeTeamId : previous.homeTeamId,
    nbaGameId: adapted.nbaGameId || previous.nbaGameId,
    numPeriods: adapted.hasPlayData ? adapted.numPeriods : previous.numPeriods,
    lastAction: adapted.hasPlayData ? adapted.lastAction : previous.lastAction,
    captions: adapted.hasPlayData ? adapted.captions : previous.captions,
    gameStatusMessage: null,
  };
};

export async function fetchInitData({ fallbackDate }) {
  const result = await fetchJson(`${PREFIX}/data/init.json`);
  const outcome = classifyFetchResult(result);

  if (outcome === 'success') {
    return normalizeInitPayload(result.data, { fallbackDate });
  }

  if (outcome !== 'not-available') {
    console.error('Init fetch failed:', result.error || `Init fetch failed: ${result.status}`);
  }

  return {
    date: fallbackDate,
    autoSelectGameId: null,
  };
}

export async function fetchScheduleData(dateString) {
  const result = await fetchJson(`${PREFIX}/schedule/${dateString}.json.gz`);
  const outcome = classifyFetchResult(result);

  if (outcome === 'success') {
    return normalizeSchedulePayload(result.data);
  }

  if (outcome !== 'not-available') {
    console.error(
      'Error in fetchSchedule:',
      result.error || `Schedule fetch failed: ${result.status}`,
    );
  }

  return [];
}

export async function fetchGamePackData({ gameId, url, previousState } = {}) {
  if (!gameId && !url) {
    return {
      status: GAMEPACK_RESULT_STATUS.ERROR,
      state: previousState || createDefaultGamePackResult(),
      error: new Error('Gamepack request requires a gameId or url.'),
    };
  }

  const requestUrl = url || `${PREFIX}/data/gamepack/${gameId}.json.gz`;
  const result = await fetchJson(requestUrl);
  const outcome = classifyFetchResult(result);

  if (outcome === 'not-available') {
    return {
      status: GAMEPACK_RESULT_STATUS.NOT_AVAILABLE,
      state: {
        ...createDefaultGamePackResult(),
        gameStatusMessage: GAME_NOT_STARTED_MESSAGE,
      },
      error: null,
    };
  }

  if (outcome !== 'success') {
    return {
      status: GAMEPACK_RESULT_STATUS.ERROR,
      state: previousState || createDefaultGamePackResult(),
      error: result.error || new Error(`S3 fetch failed: ${result.status}`),
    };
  }

  return {
    status: GAMEPACK_RESULT_STATUS.SUCCESS,
    state: mergeGamePackPayload(previousState, result.data),
    error: null,
  };
}
