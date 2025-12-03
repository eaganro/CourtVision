import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  DeleteCommand
} from "@aws-sdk/lib-dynamodb";
import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand
} from "@aws-sdk/client-apigatewaymanagementapi";

// ——— Clients & Constants ———
const ddbClient = new DynamoDBClient({});
const ddb       = DynamoDBDocumentClient.from(ddbClient);
const apigw     = new ApiGatewayManagementApiClient({
  endpoint: process.env.WS_API_ENDPOINT
});

const GAMES_TABLE     = process.env.GAMES_TABLE     || "NBA_Games";
const GAMES_GSI       = process.env.GAMES_GSI       || "ByDate";
const DATE_CONN_TABLE = process.env.DATE_CONN_TABLE || "DateConnections";
const DATE_INDEX_NAME = process.env.DATE_INDEX_NAME || "date-index";

export const handler = async (event) => {
  // 1) Collect distinct dates in this batch
  const dates = new Set();
  for (const record of event.Records) {
    if (record.eventName === "INSERT" || record.eventName === "MODIFY") {
      const date = record.dynamodb.NewImage.date.S;
      dates.add(date);
    }
  }

  // 2) Process each date once
  for (const date of dates) {
    // 2a) Fetch all subscribers for this date
    const subResp = await ddb.send(new QueryCommand({
      TableName:              DATE_CONN_TABLE,
      IndexName:              DATE_INDEX_NAME,
      KeyConditionExpression: "#d = :date",
      ExpressionAttributeNames:  { "#d": "dateString" },
      ExpressionAttributeValues: { ":date": date }
    }));
    const connections = (subResp.Items || []).map(i => i.connectionId);
    if (connections.length === 0) {
      continue;
    }

    // 2b) Fetch all games for this date
    const gamesResp = await ddb.send(new QueryCommand({
      TableName:              GAMES_TABLE,
      IndexName:              GAMES_GSI,
      KeyConditionExpression: "#d = :date",
      ExpressionAttributeNames:  { "#d": "date" },
      ExpressionAttributeValues: { ":date": date }
    }));
    const games = gamesResp.Items || [];

    // 3) Build a single payload
    const payload = JSON.stringify({
      type: "date",
      data: games.map(g => ({
        id:         g.id,
        homescore:  g.homescore,
        awayscore:  g.awayscore,
        hometeam:   g.hometeam,
        awayteam:   g.awayteam,
        starttime:  g.starttime,
        clock:      g.clock,
        status:     g.status,
        date:       g.date,
        homerecord: g.homerecord,
        awayrecord: g.awayrecord
      }))
    });

    // 4) Fan-out to each connection
    await Promise.all(connections.map(async connectionId => {
      try {
        await apigw.send(new PostToConnectionCommand({
          ConnectionId: connectionId,
          Data:         payload
        }));
      } catch (err) {
        // On GoneException, remove stale sub
        if (err.name === "GoneException") {
          await ddb.send(new DeleteCommand({
            TableName: DATE_CONN_TABLE,
            Key: {
              dateString:   date,
              connectionId: connectionId
            }
          }));
        }
      }
    }));
  }
};