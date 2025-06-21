import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const wsProxy = createProxyMiddleware({ target: 'ws://100.126.126.12:3001', changeOrigin: true, ws: true, logger: console });

const app = express();
app.use(wsProxy);

const port = 3001
const server = app.listen(port, () => {
  console.log(`Proxy server listening on port ${port}`);
});
server.on('upgrade', wsProxy.upgrade);