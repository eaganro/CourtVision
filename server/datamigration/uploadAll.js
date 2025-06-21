// uploadAll.js
import fs from "fs/promises";
import path from "path";
import zlib from "zlib";
import { promisify } from "util";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const gzip = promisify(zlib.gzip);
const s3   = new S3Client({});
const BUCKET = "roryeagan.com-nba-processed-data";

async function uploadDir(localDir, s3Prefix) {
  const files = await fs.readdir(localDir);
  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    const fullPath = path.join(localDir, file);
    const raw      = await fs.readFile(fullPath, "utf8");
    const compressed = await gzip(raw);
    const key = `${s3Prefix}/${file}.gz`;

    await s3.send(new PutObjectCommand({
      Bucket:          BUCKET,
      Key:             key,
      Body:            compressed,
      ContentType:     "application/json",
      ContentEncoding: "gzip",
    }));
    console.log("Uploaded:", key);
  }
}

async function main() {
  await uploadDir("../public/data/playByPlayData", "data/playByPlayData");
  await uploadDir("../public/data/boxData",           "data/boxData");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
