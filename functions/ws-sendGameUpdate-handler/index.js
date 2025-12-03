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

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const apigw = new ApiGatewayManagementApiClient({
  endpoint: process.env.WS_API_ENDPOINT
});

export const handler = async (event) => {
  for (const record of event.Records) {
    const key    = record.s3.object.key;      
    const rawETag= record.s3.object.eTag;
    const version= rawETag.replace(/"/g, "");

    const match = key.match(/data\/(?:boxData|playByPlayData)\/(.+?)\.json/);
    if (!match) continue;
    const gameId = match[1];

    // 1) find all subscribers
    const res = await ddb.send(new QueryCommand({
      TableName: process.env.CONN_TABLE,
      IndexName: "gameId-index",
      KeyConditionExpression: "gameId = :g",
      ExpressionAttributeValues: { ":g": gameId }
    }));
    const connections = res.Items || [];

    // 2) broadcast key + version to every subscriber
    const payload = JSON.stringify({ gameId, key, version });
    await Promise.all(connections.map(async ({ connectionId }) => {
      try {
        await apigw.send(new PostToConnectionCommand({
          ConnectionId: connectionId,
          Data:         payload
        }));
      } catch (err) {
        if (err.name === "GoneException") {
          await ddb.send(new DeleteCommand({
            TableName: process.env.CONN_TABLE,
            Key:       { gameId, connectionId }
          }));
        }
      }
    }));
  }
};