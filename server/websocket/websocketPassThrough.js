import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

let port = 3001;
const args = process.argv.slice(2);
args.forEach((val, index) => {
  if (val === '-port' && args[index + 1]) {
    port = parseInt(args[index + 1], 10);
  }
});

const wsProxy = createProxyMiddleware({ target: 'ws://100.126.126.12:' + port, changeOrigin: true, ws: true, logger: console });

const app = express();
app.use(wsProxy);

const server = app.listen(port, () => {
  console.log(`Proxy server listening on port ${port}`);
});
server.on('upgrade', wsProxy.upgrade);
