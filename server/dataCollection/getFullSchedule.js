// schedule-import.js
import fetch from 'node-fetch';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const REGION    = 'us-east-1';
const DDB_TABLE = 'NBA_Games';
const SCHEDULE_URL = 'https://cdn.nba.com/static/json/staticData/scheduleLeagueV2_1.json';

const ddbClient = new DynamoDBClient({ region: REGION });
const ddb       = DynamoDBDocumentClient.from(ddbClient);

// Convert a UTC ISO string to America/New_York ISO (YYYY-MM-DDTHH:mm:ss)
function toEtIso(utcString) {
  if (!utcString) return null;
  const date = new Date(utcString);
  if (Number.isNaN(date.getTime())) return null;

  const datePart = date.toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); // YYYY-MM-DD
  const timePart = date.toLocaleTimeString('en-GB', {
    timeZone:  'America/New_York',
    hour12:    false,
  }); // HH:mm:ss
  return `${datePart}T${timePart}`;
}

// Safely coerce to number (default 0)
function n(v) {
  const num = Number(v);
  return Number.isFinite(num) ? num : 0;
}

async function fetchAllGamesFromSchedule() {
  console.log(`Fetching league schedule: ${SCHEDULE_URL}`);
  const res = await fetch(SCHEDULE_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch schedule: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  const dates = json?.leagueSchedule?.gameDates ?? [];
  const games = [];

  for (const gd of dates) {
    const dateGames = gd?.games ?? [];
    for (const g of dateGames) {
      const home = g.homeTeam ?? {};
      const away = g.awayTeam ?? {};

      // Prefer UTC datetime fields if provided
      const startEtIso = toEtIso(g.gameDateTimeUTC || g.gameDateUTC) ||
                         toEtIso(g.gameDateTimeEst || g.gameDateEst) || null;

      // Use the ET date portion for SK (fallback to parsing the "gameDate" if needed)
      let dateEt = startEtIso ? startEtIso.split('T')[0] : null;
      if (!dateEt && typeof gd.gameDate === 'string') {
        // gd.gameDate example: "10/02/2025 00:00:00" -> make Date in ET and format
        const parsed = new Date(`${gd.gameDate} UTC`); // best effort
        if (!Number.isNaN(parsed.getTime())) {
          dateEt = parsed.toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
        }
      }

      games.push({
        id:         g.gameId,
        date:       dateEt, // YYYY-MM-DD (ET)
        starttime:  startEtIso, // ISO (ET)
        hometeam:   home.teamTricode,
        awayteam:   away.teamTricode,
        homescore:  n(home.score),
        awayscore:  n(away.score),
        status:     (g.gameStatusText || '').trim() || (g.gameStatus === 1 ? 'Scheduled' : 'Unknown'),
        clock:      '', // not available in this static schedule feed
        homerecord: `${home.wins ?? 0}-${home.losses ?? 0}`,
        awayrecord: `${away.wins ?? 0}-${away.losses ?? 0}`,
        label:      g.gameLabel || '',        // e.g., "Preseason", "Regular Season", etc.
        sublabel:   g.gameSubLabel || '',     // e.g., "NBA Abu Dhabi Game"
        isNeutral:  !!g.isNeutral,
        arena:      g.arenaName || '',
        city:       g.arenaCity || '',
        seriesText: g.seriesText || '',
      });
    }
  }

  console.log(`Parsed ${games.length} games from schedule.`);
  return games;
}

async function putGameIfAbsent(game) {
  const item = {
    PK:         `GAME#${game.id}`,
    SK:         `DATE#${game.date ?? 'UNKNOWN'}`,
    // Core attrs
    id:         game.id,
    date:       game.date,
    starttime:  game.starttime,
    hometeam:   game.hometeam,
    awayteam:   game.awayteam,
    homescore:  game.homescore,
    awayscore:  game.awayscore,
    status:     game.status,
    clock:      game.clock,
    homerecord: game.homerecord,
    awayrecord: game.awayrecord,
    // Optional extras
    label:      game.label,
    sublabel:   game.sublabel,
    isNeutral:  game.isNeutral,
    arena:      game.arena,
    city:       game.city,
    seriesText: game.seriesText,
  };

  // Only insert if not present already
  try {
    await ddb.send(new PutCommand({
      TableName: DDB_TABLE,
      Item:      item,
      ConditionExpression: 'attribute_not_exists(PK) AND attribute_not_exists(SK)',
    }));
    return { gameId: game.id, status: 'inserted' };
  } catch (err) {
    // ConditionalCheckFailedException => already exists
    if (err?.name === 'ConditionalCheckFailedException') {
      return { gameId: game.id, status: 'exists' };
    }
    throw err;
  }
}

async function run() {
  const games = await fetchAllGamesFromSchedule();
  let inserted = 0;
  let existed  = 0;

  for (const g of games) {
    if (!g?.id) continue; // skip malformed
    const { status } = await putGameIfAbsent(g);
    if (status === 'inserted') inserted++;
    else existed++;
  }

  console.log(`Done. Inserted: ${inserted}, Already existed: ${existed}, Total processed: ${games.length}.`);
}

run().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});
