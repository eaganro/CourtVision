// migrateGames.js

import pkg from 'pg';
const { Pool } = pkg;

import {
  DynamoDBClient,
  BatchWriteItemCommand
} from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  BatchWriteCommand
} from "@aws-sdk/lib-dynamodb";

import databaseCreds from './databaseCreds.js'; // your Postgres creds

// 1) Postgres setup
const pool = new Pool(databaseCreds);

// 2) DynamoDB setup
const ddbClient = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(ddbClient);

// helper to chunk an array into N-sized pieces
function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

async function migrate() {
  const pgClient = await pool.connect();

  try {
    console.log("Fetching rows from Postgres...");
    const res = await pgClient.query('SELECT * FROM public.games;');
    console.log(`  → Retrieved ${res.rows.length} games`);

    // Transform each PG row into a DynamoDB PutRequest
    const putRequests = res.rows.map(row => ({
      PutRequest: {
        Item: {
          PK:         `GAME#${row.id}`,
          SK:         `DATE#${row.date.toISOString().slice(0,10)}`,
          date:       row.date.toISOString().slice(0,10),
          id:         row.id,
          homescore:  row.homescore,
          awayscore:  row.awayscore,
          hometeam:   row.hometeam,
          awayteam:   row.awayteam,
          starttime:  row.starttime,
          clock:      row.clock,
          status:     row.status,
          homerecord: row.homerecord,
          awayrecord: row.awayrecord
        }
      }
    }));

    // DynamoDB BatchWrite can only handle 25 items per request
    const batches = chunkArray(putRequests, 25);

    console.log(`Writing to DynamoDB in ${batches.length} batches...`);
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`  → Batch ${i+1}/${batches.length} (${batch.length} items)`);
      const command = new BatchWriteCommand({
        RequestItems: {
          NBA_Games: batch
        }
      });
      const resp = await ddb.send(command);

      // handle unprocessed items (simple retry once)
      if (resp.UnprocessedItems && resp.UnprocessedItems.NBA_Games?.length) {
        console.log(`    ⚠️ ${resp.UnprocessedItems.NBA_Games.length} unprocessed, retrying...`);
        await ddb.send(new BatchWriteCommand({
          RequestItems: resp.UnprocessedItems
        }));
      }
    }

    console.log("✅ Migration complete!");
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    pgClient.release();
    await pool.end();
  }
}

migrate().catch(console.error);
