import puppeteer from 'puppeteer';
import schedule from 'node-schedule';

import { gzip } from 'zlib';
import { promisify } from 'util';

import crypto from 'crypto';

import {
  DynamoDBClient
} from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  ScanCommand
} from "@aws-sdk/lib-dynamodb";

import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

const gzipAsync = promisify(gzip);

const REGION      = "us-east-1";
const BUCKET      = "roryeagan.com-nba-processed-data";
const PREFIX      = "data/";
const MANIFEST_KEY = `${PREFIX}manifest.json`;
const s3   = new S3Client({ region: REGION });

const DDB_TABLE = "NBA_Games";
const DDB_GSI   = "ByDate";
const ddb  = DynamoDBDocumentClient.from(new DynamoDBClient({}));

async function streamToString(stream) {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf-8");
}

let manifestSet = null;
async function loadManifest() {
  if (manifestSet) return manifestSet;
  try {
    const res  = await s3.send(new GetObjectCommand({
      Bucket: BUCKET,
      Key: MANIFEST_KEY
    }));
    // helper to slurp a Node.js ReadableStream to string:
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
    Bucket: BUCKET,
    Key:    MANIFEST_KEY,
    Body:   JSON.stringify(arr),
    ContentType: "application/json"
  }));
}

const lastPayloadHash = new Map();  // key → MD5 hash

async function uploadJsonToS3(key, jsonObject) {
  const body = JSON.stringify(jsonObject);
  const hash = crypto.createHash('md5').update(body).digest('hex');

  if (lastPayloadHash.get(key) === hash) {
    console.log(`Skipping S3 upload for ${key}; no change.`);
    return;
  }
  lastPayloadHash.set(key, hash);

  const compressed = await gzipAsync(body);
  try {
    const response = await s3.send(new PutObjectCommand({
      Bucket:          BUCKET,
      Key:             `${PREFIX}${key}.gz`,
      Body:            compressed,
      ContentType:     "application/json",
      ContentEncoding: "gzip"
    }));
    console.log(`Uploaded ${key} to S3`);
    return response;
  } catch (err) {
    console.error("Upload failed:", err);
    throw err;
  }
}

async function putGameToDDB(box) {
  const key = box.gameId;
  const hash = crypto.createHash('md5')
                    .update(JSON.stringify({
                      homescore: box.homeTeam.score,
                      awayscore: box.awayTeam.score,
                      status:    box.gameStatusText
                    }))
                    .digest('hex');

  if (lastPayloadHash.get(key + ':ddb') === hash) {
    console.log(`Skipping DDB write for game ${key}; no score/status change.`);
    return;
  }
  lastPayloadHash.set(key + ':ddb', hash);

  const dateStr = box.gameEt.split('T')[0];
  await ddb.send(new PutCommand({
    TableName: DDB_TABLE,
    Item: {
      PK:         `GAME#${box.gameId}`,
      SK:         `DATE#${dateStr}`,
      date:       dateStr,
      id:         box.gameId,
      homescore:  box.homeTeam.score,
      awayscore:  box.awayTeam.score,
      hometeam:   box.homeTeam.teamTricode,
      awayteam:   box.awayTeam.teamTricode,
      starttime:  box.gameEt,
      clock:      box.gameClock,
      status:     box.gameStatusText,
      homerecord: `${box.homeTeam.wins}-${box.homeTeam.losses}`,
      awayrecord: `${box.awayTeam.wins}-${box.awayTeam.losses}`
    }
  }));
}

async function getGamesByDate(dateString) {
  const cmd = new QueryCommand({
    TableName:              DDB_TABLE,
    IndexName:              DDB_GSI,
    KeyConditionExpression: "#dt = :d",
    ExpressionAttributeNames: { "#dt": "date" },
    ExpressionAttributeValues: { ":d": dateString }
  });
  const { Items } = await ddb.send(cmd);
  return Items || [];
}

async function recoverStuckGames() {
  const today = new Date()
    .toLocaleString("en-CA", { timeZone: "America/New_York" })
    .split(",")[0];          // "YYYY-MM-DD"

  // 1) find all pre-today games whose status != Final
  const stuck = [];
  let LastKey;
  do {
    const { Items, LastEvaluatedKey } = await ddb.send(new ScanCommand({
      TableName: DDB_TABLE,
      ProjectionExpression: "#id, #dt, #st",
      FilterExpression:     "#dt < :today AND #st <> :final",
      ExpressionAttributeNames: {
        "#id": "id", "#dt": "date", "#st": "status"
      },
      ExpressionAttributeValues: {
        ":today": { S: today },
        ":final": { S: "Final" }
      },
      ExclusiveStartKey: LastKey
    }));
    for (const it of Items || []) {
      if (it.id?.S && !manifestSet.has(it.id.S)) {
        stuck.push(it.id.S);
      }
    }
    LastKey = LastEvaluatedKey;
  } while (LastKey);

  if (!stuck.length) return;
  console.log(`Recovering ${stuck.length} stuck games…`);

  // 2) for each stuck game, fetch & upload + DDB + manifest
  for (const gameId of stuck) {
    try {
      const playRes = await fetch(`https://cdn.nba.com/static/json/liveData/playbyplay/playbyplay_${gameId}.json`);
      const playJson = (await playRes.json()).game.actions;
      await uploadJsonToS3(`playByPlayData/${gameId}.json`, playJson);
      const boxJson = (await (await fetch(
        `https://cdn.nba.com/static/json/liveData/boxscore/boxscore_${gameId}.json`
      )).json()).game;
      await uploadJsonToS3(`boxData/${gameId}.json`, boxJson);
      await putGameToDDB(boxJson);
      manifestSet.add(gameId);
      console.log(` ✓ Recovered ${gameId}`);
    } catch (e) {
      console.error(` ! Failed to recover ${gameId}:`, e.message);
    }
  }

  // 3) write manifest once
  await uploadManifest();
}

let browserPromise = null;

async function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      executablePath: '/usr/bin/chromium-browser',
      headless: 'new'
    }).then(b => {
      b.on('disconnected', () => {
        console.warn('Browser disconnected — will relaunch on next use');
        browserPromise = null;
      });
      return b;
    });
  }
  return browserPromise;
}

const recoverRule = new schedule.RecurrenceRule();
recoverRule.tz = 'America/New_York';
recoverRule.hour = 4;
recoverRule.minute = 0;
schedule.scheduleJob(recoverRule, async () => {
  await loadManifest();         // ensure manifestSet is populated
  await recoverStuckGames();    // rescue any pre-today, non-Final games
  console.log('4 AM recovery run complete');
});

const dailyRule = new schedule.RecurrenceRule();
dailyRule.tz = 'America/New_York';
dailyRule.hour = 13;
dailyRule.minute = 20;
schedule.scheduleJob(dailyRule, async () => {
  await loadManifest();  
  const todayString = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
  console.log(todayString);
  console.log(today);

  const browser = await getBrowser();

  console.log('con', browser.connected)
  browser.on('disconnected', () => console.log('disc'));

  try {
    let games = await getGamesByDate(todayString);
    console.log
    for (const game of games) {
      let gameId = game.id;
      try {
        let gameUrl = `${game.awayteam}-vs-${game.hometeam}-${game.id}/box-score`
        let startTime = new Date(game.starttime)
        console.log(gameUrl, startTime)
        const rule = new schedule.RecurrenceRule();
        rule.tz = 'America/New_York';
        rule.hour = game.starttime.split('T')[1].split(':')[0];
        rule.minute = game.starttime.split('T')[1].split(':')[1];
        schedule.scheduleJob(rule, async () => {
          console.log('GAME START: ' + gameUrl)
          const page = await browser.newPage();
          await page.setDefaultNavigationTimeout(300);

          let gotBoxFinal = false;
          let gotPBPFinal = false;
          async function maybeFinalize() {
            if (gotBoxFinal && gotPBPFinal && !manifestSet.has(gameId)) {
              manifestSet.add(gameId);
              await uploadManifest();
              await page.close();
              console.log(`✅ Completed & closed page for ${gameId}`);
            }
          }

          page.on('response', async (response) => {
            if (response.url().includes('playbyplay')) {
              console.log('play')
              try {
                const playbyplay = (await response.json())
                const actions = playbyplay?.game?.actions;
                await uploadJsonToS3(
                  `playByPlayData/${gameId}.json`,
                  actions
                );
                const last = actions[actions.length - 1];
                if (last?.status === "Final") {
                  gotPBPFinal = true;
                  await maybeFinalize();
                }
                const box = playbyplay?.game?.box;
                // if (box !== undefined) {
                //   try {
                //     await uploadJsonToS3(
                //       `boxData/${gameId}.json`,
                //       box
                //     );
                //     await putGameToDDB(box);
                //     if (box.gameStatusText.startsWith('Final')) {
                //       await page.close()
                //       console.log('page closed for game ' + gameUrl)
                //     }
                //   } catch (error) {
                //     console.log(error)
                //   }
                // }
                
              } catch (error) {
                console.log(error);
              }
            } else if (response.url().includes('boxscore')) {
              console.log('box')
              if (response.ok) {
                try {
                  const box = (await response.json())?.game;
                  await uploadJsonToS3(
                    `boxData/${gameId}.json`,
                    box
                  );
                  await putGameToDDB(box);
                  if (box.gameStatusText.startsWith('Final')) {
                    gotBoxFinal = true;
                    await maybeFinalize();
                  }
                } catch (error) {
                  console.log(error)
                }
              }
            }
          })
          await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36');
          await page.goto(`https://www.nba.com/game/${gameUrl}/box-score`);
        })
      } catch (error) {
        console.log('error with: ' + `${game.awayteam}-vs-${game.hometeam}-${game.id}`)
        console.log(error)
      }
    }
  } catch (error) {
    console.log('error on: ' + todayString)
    console.log(error)
  }
})