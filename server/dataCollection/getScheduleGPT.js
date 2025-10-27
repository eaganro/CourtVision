import fetch from 'node-fetch';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const REGION    = 'us-east-1';
const DDB_TABLE = 'NBA_Games';

const ddbClient = new DynamoDBClient({ region: REGION });
const ddb       = DynamoDBDocumentClient.from(ddbClient);

function toEtIso(utcString) {
  if (!utcString) return null;
  const date = new Date(utcString);
  if (Number.isNaN(date.getTime())) return null;
  const datePart = date.toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
  const timePart = date.toLocaleTimeString('en-GB', {
    timeZone:  'America/New_York',
    hour12:    false,
  });
  return `${datePart}T${timePart}`;
}

async function fetchGamesForDate(date) {
  const dateToken = date.replace(/-/g, '');
  const url       = `https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_${dateToken}.json`;

  console.log(`Fetching schedule for ${date}: ${url}`);
  const res = await fetch(url);
  if (res.status === 404) {
    console.warn(`No schedule found for ${date}`);
    return [];
  }
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }

  const json  = await res.json();
  const games = json?.scoreboard?.games ?? [];

  return games.map(game => {
    const home = game.homeTeam ?? {};
    const away = game.awayTeam ?? {};
    const statusText = game.gameStatusText?.trim() || (game.gameStatus === 1 ? 'Scheduled' : 'Unknown');
    const clock = game.gameClock?.trim() || (game.gameStatus === 1 ? 'Pregame' : '');

    return {
      id:         game.gameId,
      date,
      starttime:  toEtIso(game.gameTimeUTC) || `${date}T00:00:00`,
      hometeam:   home.teamTricode,
      awayteam:   away.teamTricode,
      homescore:  Number.isFinite(Number(home.score)) ? Number(home.score) : 0,
      awayscore:  Number.isFinite(Number(away.score)) ? Number(away.score) : 0,
      status:     statusText,
      clock,
      homerecord: `${home.wins ?? 0}-${home.losses ?? 0}`,
      awayrecord: `${away.wins ?? 0}-${away.losses ?? 0}`,
    };
  });
}

async function putScheduleGame(game) {
  const item = {
    PK:         `GAME#${game.id}`,
    SK:         `DATE#${game.date}`,
    date:       game.date,
    id:         game.id,
    homescore:  game.homescore,
    awayscore:  game.awayscore,
    hometeam:   game.hometeam,
    awayteam:   game.awayteam,
    starttime:  game.starttime,
    clock:      game.clock,
    status:     game.status,
    homerecord: game.homerecord,
    awayrecord: game.awayrecord,
  };

  await ddb.send(new PutCommand({
    TableName: DDB_TABLE,
    Item:      item,
  }));
}

async function syncGamesForDate(date) {
  const games = await fetchGamesForDate(date);
  if (!games.length) {
    return [];
  }

  for (const game of games) {
    await putScheduleGame(game);
  }
  console.log(`Upserted ${games.length} games for ${date}`);
  return games.map(g => g.id);
}

async function syncGamesForDays(dates) {
  const result = {};
  for (const date of dates) {
    result[date] = await syncGamesForDate(date);
  }
  return result;
}

async function syncGamesForYears(years) {
  const dates = getDatesForYears(years);
  return syncGamesForDays(dates);
}

function getDatesForYears(years) {
  const dates = [];
  for (const year of years) {
    const startDate = new Date(year, 0, 1);
    const endDate   = new Date(year, 11, 31);

    for (let date = startDate; date <= endDate; date.setDate(date.getDate() + 1)) {
      dates.push(new Date(date).toISOString().split('T')[0]);
    }
  }
  return dates;
}

function getDatesForMonths(year, months) {
  const dates = [];
  for (const month of months) {
    const startDate = new Date(year, month, 1);
    const endDate   = new Date(year, month + 1, 0);

    for (let date = startDate; date <= endDate; date.setDate(date.getDate() + 1)) {
      dates.push(new Date(date).toISOString().split('T')[0]);
    }
  }
  return dates;
}

async function syncGamesForMonths(year, months) {
  const dates = getDatesForMonths(year, months);
  return syncGamesForDays(dates);
}

(async () => {
  // Example usage:
  await syncGamesForYears([2025]);
  // await syncGamesForDays(['2024-10-01']);
  // const gamesByDate = await syncGamesForMonths(2025, [4]);
  // console.log(JSON.stringify(gamesByDate, null, 2));
})();
