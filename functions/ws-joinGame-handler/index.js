import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  const connectionId = event.requestContext.connectionId;
  const { gameId } = JSON.parse(event.body);

  const TTL_SECONDS = 12 * 60 * 60;
  const expiresAt  = Math.floor(Date.now() / 1000) + TTL_SECONDS;

  await ddb.send(
    new PutCommand({
      TableName: "GameConnections",
      Item: {
        connectionId,
        gameId,
        connectedAt: new Date().toISOString(),
        expiresAt
      },
    })
  );
  
  return {
    statusCode: 200,
  };
};
