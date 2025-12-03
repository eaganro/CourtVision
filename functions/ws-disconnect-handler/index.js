import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  const connectionId = event.requestContext.connectionId;
  await ddb.send(new DeleteCommand({
    TableName: "GameConnections",
    Key: { connectionId }
  }));

  await ddb.send(new DeleteCommand({
    TableName: "DateConnections",
    Key: { connectionId }
  }));
  
  return {
    statusCode: 200,
  };
};