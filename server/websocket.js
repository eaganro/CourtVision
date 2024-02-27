import { WebSocketServer } from 'ws';
import fs from 'fs/promises';

import database from './database.js';
import myEmitter from './eventEmitter.js';


const wss = new WebSocketServer({ port: 3001 });

const gameSubscriptions = {};
const dateSubscriptions = {};

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
    } else if (data.type = 'date') {
      const date = data.date;
      if (ws.date && dateSubscriptions[ws.date]) {
        dateSubscriptions[ws.date].delete(ws);
      }

      ws.date = date;
      if (!dateSubscriptions[date]) {
        dateSubscriptions[date] = new Set();
      }
      dateSubscriptions[date].add(ws);

      try {
        const dateData = await database.getDate(date)
        ws.send(JSON.stringify({ type: 'date', data: dateData.rows }));
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
  onDataUpdate(gameId, type, data);
});
myEmitter.on('scheduleUpdate', async ({date, type}) => {
  if (type === 'date'){
    const data = await database.getDate(date);
    const subscribers = dateSubscriptions[date];
    if (subscribers) {
      try {
        subscribers.forEach((client) => {
          if (client.readyState === 1) {
            client.send(JSON.stringify({ type, data: data.rows }));
          }
        });
      } catch (error) {
        console.error('Error reading file:', error);
        // ws.send(JSON.stringify({ error: 'Failed to read data' }));
      }
    }
  }
});

const onDataUpdate = async (gameId, type, data) => {
  console.log(gameId, type)
  const subscribers = gameSubscriptions[gameId];
  if (subscribers) {
    // const filePath = `public/data/${type}/${gameId}.json`;
    try {
      // const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
      subscribers.forEach((client) => {
        if (client.readyState === 1) {
          client.send(JSON.stringify({ type, data }));
        }
      });
    } catch (error) {
      console.error('Error reading file:', error);
      // ws.send(JSON.stringify({ error: 'Failed to read data' }));
    }
  }
};