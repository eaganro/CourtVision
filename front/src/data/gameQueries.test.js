import { afterEach, describe, expect, it, vi } from 'vitest';
import { GAME_NOT_STARTED_MESSAGE } from '../domain/game-selection/status';
import {
  fetchGamePackData,
  fetchInitData,
  fetchScheduleData,
  GAMEPACK_RESULT_STATUS,
  mergeGamePackPayload,
} from './gameQueries';

function createResponse(payload, { status = 200, ok = true } = {}) {
  return {
    status,
    ok,
    json: async () => payload,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('game query fetchers', () => {
  it('normalizes init and schedule payloads', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        createResponse({
          date: '2026-02-03',
          autoSelectGameId: '2026-02-03-phi-gsw',
        }),
      )
      .mockResolvedValueOnce(createResponse([{ id: 123, status: 'Final' }, null]));

    await expect(fetchInitData({ fallbackDate: '2026-02-01' })).resolves.toEqual({
      date: '2026-02-03',
      autoSelectGameId: '2026-02-03-phi-gsw',
    });

    await expect(fetchScheduleData('2026-02-03')).resolves.toEqual([
      { id: '123', status: 'Final' },
    ]);
  });

  it.each([403, 404])('maps schedule %s to an empty schedule', async (statusCode) => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      createResponse(null, { status: statusCode, ok: false }),
    );

    await expect(fetchScheduleData('2026-02-03')).resolves.toEqual([]);
  });

  it.each([403, 404])('maps gamepack %s to not available state', async (statusCode) => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      createResponse(null, { status: statusCode, ok: false }),
    );

    await expect(fetchGamePackData({ gameId: '2026-02-03-phi-gsw' })).resolves.toEqual(
      expect.objectContaining({
        status: GAMEPACK_RESULT_STATUS.NOT_AVAILABLE,
        state: expect.objectContaining({
          box: {},
          playByPlay: [],
          gameStatusMessage: GAME_NOT_STARTED_MESSAGE,
        }),
      }),
    );
  });

  it('merges partial gamepack payloads without clearing existing box data', async () => {
    const previousState = mergeGamePackPayload(null, {
      nbaGameId: '0022500001',
      box: {
        id: '0022500001',
        teams: {
          away: { id: 1, abbr: 'PHI' },
          home: { id: 2, abbr: 'GSW' },
        },
      },
    });

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      createResponse({
        v: 2,
        id: '0022500001',
        periods: 5,
        last: {
          quarter: 5,
          time: 'PT01M00.00S',
          awayScore: 120,
          homeScore: 118,
        },
        actions: [{ actionNumber: 501 }],
      }),
    );

    const result = await fetchGamePackData({
      url: '/gamepack/live',
      previousState,
    });

    expect(result.status).toBe(GAMEPACK_RESULT_STATUS.SUCCESS);
    expect(result.state.box).toEqual(previousState.box);
    expect(result.state.numPeriods).toBe(5);
    expect(result.state.playByPlay).toEqual(
      expect.objectContaining({
        actions: [{ actionNumber: 501 }],
      }),
    );
  });
});
