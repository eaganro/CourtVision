import { timeToSeconds } from './utils';

// Convert a play event to elapsed seconds from game start (regulation and OT)
export function elapsedSecondsFromStart(ev) {
  const per = Number(ev.period || 1);
  const clock = ev.clock || 'PT12M00.00S';
  const inPeriod = timeToSeconds(clock); // remaining time in period
  const periodLength = per <= 4 ? 12 * 60 : 5 * 60;
  let elapsedBefore = 0;
  if (per <= 4) {
    elapsedBefore = (per - 1) * 12 * 60;
  } else {
    // After regulation, each additional period is 5 minutes
    elapsedBefore = 4 * 12 * 60 + (per - 5) * 5 * 60;
  }
  return Math.max(0, elapsedBefore + (periodLength - inPeriod));
}

function emptyStats() {
  return {
    minutes: '00:00',
    fieldGoalsMade: 0,
    fieldGoalsAttempted: 0,
    threePointersMade: 0,
    threePointersAttempted: 0,
    freeThrowsMade: 0,
    freeThrowsAttempted: 0,
    reboundsOffensive: 0,
    reboundsDefensive: 0,
    reboundsTotal: 0,
    assists: 0,
    steals: 0,
    blocks: 0,
    turnovers: 0,
    foulsPersonal: 0,
    points: 0,
    plusMinusPoints: 0,
  };
}

function formatMinutesFromSeconds(sec) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const rs = String(s % 60).padStart(2, '0');
  return `${String(m).padStart(2, '0')}:${rs}`;
}

// Sum seconds overlapped between [segStart, segEnd] and [winStart, winEnd]
function overlapSeconds(segStart, segEnd, winStart, winEnd) {
  const s = Math.max(segStart, winStart);
  const e = Math.min(segEnd, winEnd);
  return Math.max(0, e - s);
}

export function buildPartialBox({ box, playByPlay, range, awayTeamId, homeTeamId, awayPlayerTimeline, homePlayerTimeline }) {
  if (!box || !range || range.start == null || range.end == null) return null;
  const start = Math.min(range.start, range.end);
  const end = Math.max(range.start, range.end);

  // Prepare per-team and per-player maps
  const teams = {
    [box.awayTeam?.teamId || box.awayTeamId]: {
      team: box.awayTeam,
      players: new Map(),
      teamId: box.awayTeam?.teamId || box.awayTeamId,
    },
    [box.homeTeam?.teamId || box.homeTeamId]: {
      team: box.homeTeam,
      players: new Map(),
      teamId: box.homeTeam?.teamId || box.homeTeamId,
    },
  };

  const seedTeamPlayers = (teamObj, originalPlayers) => {
    (originalPlayers || []).forEach(p => {
      teamObj.players.set(p.personId, {
        ...p,
        statistics: emptyStats(),
      });
    });
  };

  seedTeamPlayers(teams[box.awayTeam?.teamId || box.awayTeamId], box.awayTeam?.players || []);
  seedTeamPlayers(teams[box.homeTeam?.teamId || box.homeTeamId], box.homeTeam?.players || []);

  // Build name->personId mapping per team from play-by-play
  const normalize = s => (s || '')
    .toString()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\./g, '')
    .trim()
    .toLowerCase();

  const nameToPid = new Map(); // key: `${teamId}|${normalizedName}` => pid
  const pidCounts = new Map(); // key: `${teamId}|${normalizedName}|${pid}` => count
  (playByPlay || []).forEach(ev => {
    if (!ev || !ev.teamId) return;
    const names = [ev.playerName, ev.playerNameI].filter(Boolean);
    if (names.length === 0) return;
    names.forEach(n => {
      const keyName = `${ev.teamId}|${normalize(n)}`;
      const pidKey = `${keyName}|${ev.personId}`;
      pidCounts.set(pidKey, (pidCounts.get(pidKey) || 0) + 1);
    });
  });
  // Resolve most common pid per name per team
  pidCounts.forEach((count, pidKey) => {
    const [teamNameKey, pidStr] = [pidKey.slice(0, pidKey.lastIndexOf('|')), pidKey.slice(pidKey.lastIndexOf('|') + 1)];
    const cur = nameToPid.get(teamNameKey);
    if (!cur || count > cur.count) {
      nameToPid.set(teamNameKey, { pid: Number(pidStr), count });
    }
  });

  // Aggregate events
  (playByPlay || []).forEach(ev => {
    const t = elapsedSecondsFromStart(ev);
    if (t < start || t > end) return;
    const team = teams[ev.teamId];
    if (!team) return;

    const pid = ev.personId;
    const entry = pid && team.players.get(pid);
    const addStat = (mutator) => { if (entry) mutator(entry.statistics); };
    const made = (ev.shotResult || '').toString().toLowerCase() === 'made';
    const type = (ev.actionType || '').toString().toLowerCase();

    switch (type) {
      case '2pt':
      case '3pt': {
        addStat(s => {
          s.fieldGoalsAttempted += 1;
          if (type === '3pt') s.threePointersAttempted += 1;
          if (made) {
            s.fieldGoalsMade += 1;
            if (type === '3pt') s.threePointersMade += 1;
            s.points += (type === '3pt') ? 3 : 2; // ignore ev.pointsTotal to avoid double-count via cumulative totals
          }
        });
        // Assist credit lives on scoring play
        if (made && ev.assistPersonId && team.players.has(ev.assistPersonId)) {
          const a = team.players.get(ev.assistPersonId);
          a.statistics.assists += 1;
        }
        break;
      }
      case 'freethrow':
      case 'free-throw':
      case 'free_throw':
      case 'freethrowmade':
      case 'freethrowmiss':
      case 'free throw':
      case 'freethrows':
      case 'freeThrow': {
        addStat(s => {
          s.freeThrowsAttempted += 1;
          if (made) {
            s.freeThrowsMade += 1;
            s.points += 1;
          }
        });
        break;
      }
      case 'rebound': {
        addStat(s => {
          if (ev.subType === 'offensive') s.reboundsOffensive += 1;
          else s.reboundsDefensive += 1;
          s.reboundsTotal += 1;
        });
        break;
      }
      case 'turnover': {
        addStat(s => { s.turnovers += 1; });
        break;
      }
      case 'steal': {
        addStat(s => { s.steals += 1; });
        break;
      }
      case 'block': {
        addStat(s => { s.blocks += 1; });
        break;
      }
      case 'foul': {
        addStat(s => { s.foulsPersonal += 1; });
        break;
      }
      default:
        break;
    }
  });

  // Compute minutes from overlap of playtime segments
  const computeMinutesForTeam = (teamId, timelines) => {
    Object.entries(timelines || {}).forEach(([name, segs]) => {
      // Map player by name to personId using PBP evidence or fallback to last-name match
      const team = teams[teamId];
      if (!team) return;
      const nrm = normalize(name);
      let entry = null;
      const mapHit = nameToPid.get(`${teamId}|${nrm}`);
      if (mapHit && team.players.has(mapHit.pid)) {
        entry = team.players.get(mapHit.pid);
      } else {
        // Fallback by last name comparison
        const last = nrm.split(' ').slice(-1)[0];
        entry = Array.from(team.players.values()).find(p => normalize(p.familyName) === last || normalize(`${p.firstName} ${p.familyName}`) === nrm || normalize(p.nameI || '') === nrm);
      }
      if (!entry) return;
      // Sum overlap seconds across segments
      let total = 0;
      (segs || []).forEach(seg => {
        const per = Number(seg.period || 1);
        const perLen = per <= 4 ? 12 * 60 : 5 * 60;
        const segStart = elapsedSecondsFromStart({ period: per, clock: seg.start });
        const segEnd = elapsedSecondsFromStart({ period: per, clock: seg.end || `PT00M00.00S` });
        const s = Math.min(segStart, segEnd);
        const e = Math.max(segStart, segEnd);
        total += overlapSeconds(s, e, start, end);
      });
      entry.statistics.minutes = formatMinutesFromSeconds(total);
    });
  };

  computeMinutesForTeam(awayTeamId, awayPlayerTimeline);
  computeMinutesForTeam(homeTeamId, homePlayerTimeline);

  // Derive per-player percentages after counting
  const derivePercents = (map) => {
    Array.from(map.values()).forEach(p => {
      const s = p.statistics;
      s.fieldGoalsPercentage = s.fieldGoalsAttempted ? (s.fieldGoalsMade / s.fieldGoalsAttempted) : 0;
      s.threePointersPercentage = s.threePointersAttempted ? (s.threePointersMade / s.threePointersAttempted) : 0;
      s.freeThrowsPercentage = s.freeThrowsAttempted ? (s.freeThrowsMade / s.freeThrowsAttempted) : 0;
    });
  }

  derivePercents(teams[box.awayTeam?.teamId || box.awayTeamId].players);
  derivePercents(teams[box.homeTeam?.teamId || box.homeTeamId].players);

  // Build final box-like object with filtered stats
  const buildTeamOut = (origTeam, map) => {
    const players = (origTeam?.players || []).map(p => map.get(p.personId) || { ...p, statistics: emptyStats() });
    // Sum totals for team row
    const totals = emptyStats();
    players.forEach(p => {
      const s = p.statistics;
      totals.fieldGoalsMade += s.fieldGoalsMade;
      totals.fieldGoalsAttempted += s.fieldGoalsAttempted;
      totals.threePointersMade += s.threePointersMade;
      totals.threePointersAttempted += s.threePointersAttempted;
      totals.freeThrowsMade += s.freeThrowsMade;
      totals.freeThrowsAttempted += s.freeThrowsAttempted;
      totals.reboundsOffensive += s.reboundsOffensive;
      totals.reboundsDefensive += s.reboundsDefensive;
      totals.reboundsTotal += s.reboundsTotal;
      totals.assists += s.assists;
      totals.steals += s.steals;
      totals.blocks += s.blocks;
      totals.turnovers += s.turnovers;
      totals.foulsPersonal += s.foulsPersonal;
      totals.points += s.points;
      // plusMinus not computed for partial; leave 0
    });
    return { ...origTeam, players, totals };
  };

  const awayOut = buildTeamOut(box.awayTeam, teams[box.awayTeam?.teamId || box.awayTeamId].players);
  const homeOut = buildTeamOut(box.homeTeam, teams[box.homeTeam?.teamId || box.homeTeamId].players);

  return { awayTeam: awayOut, homeTeam: homeOut };
}
