import schedule from 'node-schedule';
import { gzip } from 'zlib';
import { promisify } from 'util';
import crypto from 'crypto';

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

const gzipAsync = promisify(gzip);
const REGION       = 'us-east-1';
const BUCKET       = 'roryeagan.com-nba-processed-data';
const PREFIX       = 'data/';
const MANIFEST_KEY = `${PREFIX}manifest.json`;

const DDB_TABLE = 'NBA_Games';
const DDB_GSI   = 'ByDate';
const ddbClient = new DynamoDBClient({ region: REGION });
const ddb       = DynamoDBDocumentClient.from(ddbClient);
const s3        = new S3Client({ region: REGION });

// Utility to convert stream to string
async function streamToString(stream) {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf-8');
}

// --- Manifest Cache ---
let manifestSet = null;
async function loadManifest() {
  if (manifestSet) return manifestSet;
  try {
    const res  = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: MANIFEST_KEY }));
    const text = await streamToString(res.Body);
    manifestSet = new Set(JSON.parse(text));
  } catch (err) {
    if (err.$metadata?.httpStatusCode === 404) {
      manifestSet = new Set();
    } else {
      throw err;
    }
  }
  return manifestSet;
}
async function uploadManifest() {
  const arr = Array.from(manifestSet);
  await s3.send(new PutObjectCommand({
    Bucket:      BUCKET,
    Key:         MANIFEST_KEY,
    Body:        JSON.stringify(arr),
    ContentType: 'application/json',
  }));
}

// --- Deduplicate & upload payloads ---
const lastPayloadHash = new Map();
async function uploadJsonToS3(key, jsonObject, isFinal = false) {
  const body = JSON.stringify(jsonObject);
  const hash = crypto.createHash('md5').update(body).digest('hex');
  if (lastPayloadHash.get(key) === hash) {
    console.log(`Skipping upload for ${key}; no change.`);
    return;
  }
  lastPayloadHash.set(key, hash);
  const compressed = await gzipAsync(body);

  const cacheControl = isFinal
    ? "public, max-age=604800"                       // cache final for 24h
    : "s-maxage=0, max-age=0, must-revalidate";

  await s3.send(new PutObjectCommand({
    Bucket:          BUCKET,
    Key:             `${PREFIX}${key}.gz`,
    Body:            compressed,
    ContentType:     'application/json',
    ContentEncoding: 'gzip',
    CacheControl: cacheControl,
  }));
  console.log(`Uploaded ${key}`);
}

// --- Update DynamoDB ---
async function putGameToDDB(box) {
  const key = box.gameId;
  const hash = crypto.createHash('md5')
    .update(JSON.stringify({ homescore: box.homeTeam.score, awayscore: box.awayTeam.score, status: box.gameStatusText }))
    .digest('hex');
  if (lastPayloadHash.get(key + ':ddb') === hash) {
    console.log(`Skipping DDB write for ${key}; no change.`);
    return;
  }
  lastPayloadHash.set(key + ':ddb', hash);
  const dateStr = box.gameEt.split('T')[0];
  await ddb.send(new PutCommand({
    TableName: DDB_TABLE,
    Item: {
      PK:         `GAME#${key}`,
      SK:         `DATE#${dateStr}`,
      date:       dateStr,
      id:         key,
      homescore:  box.homeTeam.score,
      awayscore:  box.awayTeam.score,
      hometeam:   box.homeTeam.teamTricode,
      awayteam:   box.awayTeam.teamTricode,
      starttime:  box.gameEt,
      clock:      box.gameClock,
      status:     box.gameStatusText,
      homerecord: `${box.homeTeam.wins}-${box.homeTeam.losses}`,
      awayrecord: `${box.awayTeam.wins}-${box.awayTeam.losses}`,
    }
  }));
}

// --- Query games for a specific date ---
async function getGamesByDate(dateString) {
  const { Items } = await ddb.send(new QueryCommand({
    TableName: DDB_TABLE,
    IndexName: DDB_GSI,
    KeyConditionExpression: '#dt = :d',
    ExpressionAttributeNames:  { '#dt': 'date' },
    ExpressionAttributeValues: { ':d': dateString }
  }));
  return Items || [];
}

// --- Recover stuck games pre-today not marked Final ---
async function recoverStuckGames() {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
  const stuck = [];
  let LastKey;
  do {
    const { Items, LastEvaluatedKey } = await ddb.send(new ScanCommand({
      TableName: DDB_TABLE,
      ProjectionExpression:   '#id, #dt, #st',
      FilterExpression:       '#dt < :today AND NOT begins_with(#st, :final)',
      ExpressionAttributeNames:  { '#id': 'id', '#dt': 'date', '#st': 'status' },
      ExpressionAttributeValues: { ':today': today, ':final': 'Final' },
      ExclusiveStartKey: LastKey
    }));
    console.log('items', Items)
    for (const it of Items) {
      stuck.push(it.id);
    }
    LastKey = LastEvaluatedKey;
  } while (LastKey);

  if (!stuck.length) return;
  console.log(`Recovering ${stuck.length} stuck games…`);
  for (const gameId of stuck) {
    try {
      const urls = {
        play:  `https://cdn.nba.com/static/json/liveData/playbyplay/playbyplay_${gameId}.json`,
        box:   `https://cdn.nba.com/static/json/liveData/boxscore/boxscore_${gameId}.json`,
      };
      const headers = {};
      const resList = await Promise.all(Object.values(urls).map(url =>
        fetch(url, headers[url] ? { headers: { 'If-None-Match': headers[url] } } : {})
      ));
      const [playRes, boxRes] = resList;
      if (playRes.status === 304 && boxRes.status === 304) continue;
      const [playJsonRaw, boxJsonRaw] = await Promise.all([
        playRes.status === 304 ? null : playRes.json(),
        boxRes.status === 304  ? null : boxRes.json(),
      ]);
      if (playJsonRaw) {
        headers[urls.play] = playRes.headers.get('etag');
      }
      if (boxJsonRaw) {
        headers[urls.box]  = boxRes.headers.get('etag');
      }
      const actions = playJsonRaw?.game.actions;
      const box     = boxJsonRaw?.game;
      await Promise.all([
        actions && uploadJsonToS3(`playByPlayData/${gameId}.json`, actions, true),
        box     && uploadJsonToS3(`boxData/${gameId}.json`, box, true),
        box     && putGameToDDB(box)
      ]);
      manifestSet.add(gameId);
      console.log(`Recovered ${gameId}`);
    } catch (e) {
      console.error(`Failed to recover ${gameId}:`, e);
    }
  }
  await uploadManifest();
}

// Map to store ETags for conditional GET
const etagMap = new Map();
// --- Poll a game until Final status with jitter + ETag ---
function startPollingGame(gameId) {
  async function poll() {
    try {
      const urls = {
        play:  `https://cdn.nba.com/static/json/liveData/playbyplay/playbyplay_${gameId}.json`,
        box:   `https://cdn.nba.com/static/json/liveData/boxscore/boxscore_${gameId}.json`,
      };
      const responses = await Promise.all(Object.values(urls).map(async url => {
        const opts = {};
        if (etagMap.has(url)) opts.headers = { 'If-None-Match': etagMap.get(url) };
        const res = await fetch(url, opts);
        if (res.status === 200) etagMap.set(url, res.headers.get('etag'));
        return res;
      }));
      const [playRes, boxRes] = responses;
      if (!playRes.ok || !boxRes.ok) {
        console.warn(`Non-200 polling response for ${gameId}:`, playRes.status, boxRes.status);
        const jitter = (Math.random() * 20000) - 10000;
        return setTimeout(poll, 60000 + jitter);
      }
      const jsons = await Promise.all([
        playRes.status === 304 ? null : playRes.json(),
        boxRes.status === 304  ? null : boxRes.json(),
      ]);
      const actions = jsons[0]?.game.actions;
      const box     = jsons[1]?.game;
      const last = actions?.[actions.length - 1];
      if (actions || box) {
        await Promise.all([
          actions?.length && uploadJsonToS3(`playByPlayData/${gameId}.json`, actions, last?.description?.trim().startsWith('Game End')),
          box     && uploadJsonToS3(`boxData/${gameId}.json`, box, box?.gameStatusText?.trim().startsWith('Final')),
          box     && putGameToDDB(box)
        ]);
      }
      if (last?.description?.trim().startsWith('Game End') && box?.gameStatusText?.trim().startsWith('Final')) {
        manifestSet.add(gameId);
        await uploadManifest();
        console.log(`✅ Polling complete for ${gameId}`);
        return;
      }
    } catch (err) {
      console.error(`Error polling ${gameId}:`, err);
    }
    // schedule next poll with jitter ±1s
    const jitter = (Math.random() * 20000) - 10000;
    setTimeout(poll, 60000 + jitter);
  }
  // initial poll
  poll();
}

// --- Schedule recovery at 4 AM ET ---
// const recoverRule = new schedule.RecurrenceRule();
// recoverRule.tz = 'America/New_York'; recoverRule.hour = 14; recoverRule.minute = 55;
// schedule.scheduleJob(recoverRule, async () => {
//   await loadManifest();
//   await recoverStuckGames();
//   console.log('4 AM recovery run complete');
// });

// --- 1:20 PM schedule polling at tip-off ---
const nowET = new Date(
  new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })
);
const [year, month, day] = nowET.toLocaleDateString('en-CA', { timeZone: 'America/New_York' }).split('-');
const targetET = new Date(`${year}-${month}-${day}T13:20:00-04:00`);
if (nowET > targetET) {
  schedulePolling();
}
schedule.scheduleJob({ tz: 'America/New_York', hour: 18, minute: 10 }, schedulePolling);

async function schedulePolling() {
  await loadManifest();
  const today = new Date().toLocaleDateString('en-CA', {
    timeZone: 'America/New_York'
  });
  console.log(`Scheduling polls for games on ${today}`);

  // parse “now” in ET
  const nowET = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })
  );

  const games = await getGamesByDate(today);
  for (const g of games) {
    if (manifestSet.has(g.id)) continue;

    // extract hour & minute (strings)
    const [hourStr, minuteStr] = g.starttime.split('T')[1].split(':');
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);

    // build a Date for today’s start-time in ET (year–month–day from “today”)
    const [year, month, day] = today.split('-');
    const scheduledET = new Date(
      `${year}-${month}-${day}T${hourStr.padStart(2, '0')}:${minuteStr.padStart(2, '0')}:00`
    );

    // if we’ve already passed it, start right away
    if (nowET > scheduledET) {
      console.log(
        `→ [${g.id}] start time ${hourStr}:${minuteStr} ET already passed; polling immediately`
      );
      startPollingGame(g.id);
    }

    // and still schedule the daily ET job
    schedule.scheduleJob(
      { tz: 'America/New_York', hour, minute },
      () => {
        const firedAt = new Date().toLocaleTimeString('en-US', {
          timeZone: 'America/New_York'
        });
        console.log(`→ Started polling for ${g.id} at ${firedAt} ET`);
        startPollingGame(g.id);
      }
    );
  }
}
