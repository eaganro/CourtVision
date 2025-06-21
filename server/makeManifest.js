import {
  DynamoDBClient,
  ScanCommand
} from "@aws-sdk/client-dynamodb";
import {
  S3Client,
  PutObjectCommand
} from "@aws-sdk/client-s3";

const REGION      = "us-east-1";
const DDB_TABLE   = "NBA_Games";
const BUCKET      = "roryeagan.com-nba-processed-data";
const MANIFEST_KEY = "data/manifest.json";

const ddb = new DynamoDBClient({ region: REGION });
const s3  = new S3Client({ region: REGION });

// 1) Scan the table for every item with status == "Final"
async function fetchAllFinalGameIds() {
  const finalIds = [];
  let ExclusiveStartKey = undefined;

  do {
    const { Items, LastEvaluatedKey } = await ddb.send(new ScanCommand({
      TableName: DDB_TABLE,
      // only pass the status attribute (filter out everything else)
      ProjectionExpression: "#id, #st",
      FilterExpression:      "#st = :final",
      ExpressionAttributeNames: {
        "#id": "id",
        "#st": "status",
      },
      ExpressionAttributeValues: {
        ":final": { S: "Final" }
      },
      ExclusiveStartKey
    }));

    // DynamoDB returns items as AttributeValue maps
    for (const item of Items || []) {
      if (item.id && item.id.S) {
        finalIds.push(item.id.S);
      }
    }
    ExclusiveStartKey = LastEvaluatedKey;
  } while (ExclusiveStartKey);

  return finalIds;
}

// 2) Serialize and upload to S3
async function writeManifest(ids) {
  const body = JSON.stringify(ids);
  await s3.send(new PutObjectCommand({
    Bucket:      BUCKET,
    Key:         MANIFEST_KEY,
    Body:        body,
    ContentType: "application/json"
  }));
  console.log(`Wrote ${ids.length} IDs to s3://${BUCKET}/${MANIFEST_KEY}`);
}

(async () => {
  try {
    const finalGameIds = await fetchAllFinalGameIds();
    await writeManifest(finalGameIds);
  } catch (err) {
    console.error("Error rebuilding manifest:", err);
    process.exit(1);
  }
})();
