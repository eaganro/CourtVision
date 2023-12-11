import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import fs from 'fs/promises';

import schedule from './public/data/schedule/schedule.json' assert { type: 'json' };
import myEmitter from './eventEmitter.js';


const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const port = 3000;


const gameSubscriptions = {};

wss.on('connection', function connection(ws) {
  ws.on('message', async (message) => {
    const data = JSON.parse(message);
    if (data.type === 'gameId') {
      const gameId = data.gameId;

      if (ws.gameId && gameSubscriptions[ws.gameId]) {
        gameSubscriptions[ws.gameId].delete(ws);
      }

      ws.gameId = gameId;
      if (!gameSubscriptions[gameId]) {
        gameSubscriptions[gameId] = new Set();
      }
      gameSubscriptions[gameId].add(ws);

      const playFilePath = `public/data/playByPlayData/${gameId}.json`;
      const boxFilePath = `public/data/boxData/${gameId}.json`;
      try {
        const play = JSON.parse(await fs.readFile(playFilePath, 'utf8'));
        const box = JSON.parse(await fs.readFile(boxFilePath, 'utf8'));
        ws.send(JSON.stringify({play, box}));
      } catch (error) {
        console.error('Error reading file:', error);
        ws.send(JSON.stringify({ error: 'Failed to read data' }));
      }
    }
    console.log('received: %s', message);
  });

  ws.on('close', () => {
    if (ws.gameId && gameSubscriptions[ws.gameId]) {
      gameSubscriptions[ws.gameId].delete(ws);
    }
  });

  console.log('connected')
});

myEmitter.on('update', ({gameId, type, data}) => {
  console.log(gameId);
  onDataUpdate(gameId, type, data);
});

const onDataUpdate = async (gameId, type, data) => {
  console.log(gameId, type)
  const subscribers = gameSubscriptions[gameId];
  if (subscribers) {
    // const filePath = `public/data/${type}/${gameId}.json`;
    try {
      // const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
      subscribers.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type, data }));
        }
      });
    } catch (error) {
      console.error('Error reading file:', error);
      ws.send(JSON.stringify({ error: 'Failed to read data' }));
    }
  }
  console.log('here')
};

const emitEvent = function(i) {
  console.log(i);
  if (i < testGame.length) {
    onDataUpdate(testGame.slice(0, i + 1));
    setTimeout(()=> {
      emitEvent(i + 1);
    }, 500 * Math.random());
  }
}
// emitEvent(0);

app.use(express.static('./public'));

app.get('/', (req, res) => {
  res.send('Hello World!')
});

app.get('/games', (req, res) => {
  let gamesArray = schedule[req.query.date]?.map(s => {
    return {
      away: s.split('-')[0],
      home: s.split('-')[2],
      gameId: s.split('-')[3]
    }
  });
  console.log(gamesArray);
  if (gamesArray === undefined) {
    res.sendStatus(404)
  } else {
    res.send(gamesArray);
  }
});

app.get('/game', (req, res) => {

  
  let obj = {
    playByPlay: {}
  };
  let gamesArray = schedule[req.query.date].map(s => {
    return {
      away: s.split('-')[0],
      home: s.split('-')[2],
      gameId: s.split('-')[3]
    }
  });
  console.log(gamesArray);
  res.send(gamesArray);
});

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});