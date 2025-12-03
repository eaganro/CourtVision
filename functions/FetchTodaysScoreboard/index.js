import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  BatchWriteCommand
} from "@aws-sdk/lib-dynamodb";

const ddbClient = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(ddbClient);
const TABLE = process.env.GAMES_TABLE;
const BATCH_SIZE = 25;

function chunk(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export const handler = async () => {
  const resp = await fetch(
    "https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_00.json"
  );
  if (!resp.ok) throw new Error(`Scoreboard fetch failed: ${resp.status}`);
  const { scoreboard: { games } = {} } = await resp.json();
  if (!Array.isArray(games)) {
    console.warn("No games array in JSON");
    return;
  }

  const requests = games.map(game => ({
    PutRequest: {
      Item: {
      PK:         `GAME#${game.gameId}`,
      SK:         `DATE#${game.gameEt.split('T')[0]}`,
      date:       game.gameEt.split('T')[0],
      id:         game.gameId,
      homescore:  game.homeTeam.score,
      awayscore:  game.awayTeam.score,
      hometeam:   game.homeTeam.teamTricode,
      awayteam:   game.awayTeam.teamTricode,
      starttime:  game.gameEt,
      clock:      game.gameClock,
      status:     game.gameStatusText,
      homerecord: `${game.homeTeam.wins}-${game.homeTeam.losses}`,
      awayrecord: `${game.awayTeam.wins}-${game.awayTeam.losses}`
      }
    }
  }));

  // 3. Batch‐write to DynamoDB
  const batches = chunk(requests, BATCH_SIZE);
  for (const batch of batches) {
    const cmd = new BatchWriteCommand({
      RequestItems: {
        [TABLE]: batch
      }
    });
    const out = await ddb.send(cmd);
    if (out.UnprocessedItems?.[TABLE]?.length) {
      // simple retry once
      await ddb.send(new BatchWriteCommand({ RequestItems: out.UnprocessedItems }));
    }
  }

  console.log(`Wrote ${games.length} games into ${TABLE}`);
};