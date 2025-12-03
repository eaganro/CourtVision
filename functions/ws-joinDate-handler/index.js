import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand
} from "@aws-sdk/lib-dynamodb";
import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand
} from "@aws-sdk/client-apigatewaymanagementapi";

// DynamoDB
const client = new DynamoDBClient({});
const ddb    = DynamoDBDocumentClient.from(client);

// WebSocket management client
const apigw = new ApiGatewayManagementApiClient({
  endpoint: process.env.WS_API_ENDPOINT
});

// Constants (or wire these up via env-vars)
const DATE_CONN_TABLE = "DateConnections";
const GAMES_TABLE     = "NBA_Games";
const GAMES_GSI       = "ByDate";  // your date-based GSI name

export const handler = async (event) => {
  const connectionId = event.requestContext.connectionId;
  const { date }     = JSON.parse(event.body); // e.g. "2025-05-07"

  const TTL_SECONDS = 12 * 60 * 60;
  const expiresAt  = Math.floor(Date.now() / 1000) + TTL_SECONDS;

  // 1) Record the subscription
  await ddb.send(new PutCommand({
    TableName: DATE_CONN_TABLE,
    Item: {
      dateString:  date,
      connectionId,
      connectedAt: new Date().toISOString(),
      expiresAt
    },
  }));

  // 2) Fetch all games on that date from NBA_Games
  const { Items: games = [] } = await ddb.send(new QueryCommand({
    TableName:              GAMES_TABLE,
    IndexName:              GAMES_GSI,
    KeyConditionExpression: "#dt = :d",
    ExpressionAttributeNames:  { "#dt": "date" },
    ExpressionAttributeValues: { ":d": date }
  }));

  // 3) Send them back immediately as a “date” message
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

  await apigw.send(new PostToConnectionCommand({
    ConnectionId: connectionId,
    Data:         payload
  }));

  return { statusCode: 200, body: "Subscribed to date and sent initial games" };
};
