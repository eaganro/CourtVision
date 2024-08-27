
import express from 'express';
import http from 'http';
import fsp from 'fs/promises';
import { createProxyMiddleware } from 'http-proxy-middleware';
import database from './database.js';

const app = express();

let port = 3000;

const args = process.argv.slice(2);
args.forEach((val, index) => {
  if (val === '-port' && args[index + 1]) {
    port = parseInt(args[index + 1], 10);
  }
});

app.use(
  '/',
  createProxyMiddleware({
    target: 'http://100.126.126.12:' + port,
    changeOrigin: true,
  }),
);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
