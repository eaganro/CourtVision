import express from 'express';
import http from 'http';
import fsp from 'fs/promises';
import database from './database.js';

const app = express();
const server = http.createServer(app);
const port = 3000;

app.use(express.static('./public'));

app.get('/', (req, res) => {
  res.send('Hello World!')
});

app.get('/game', async (req, res) => {
  const { gameId } = req.query;
  const playFilePath = `public/data/playByPlayData/${gameId}.json`;
  const boxFilePath = `public/data/boxData/${gameId}.json`;
  try {
    const play = JSON.parse(await fsp.readFile(playFilePath, 'utf8'));
    const box = JSON.parse(await fsp.readFile(boxFilePath, 'utf8'));
    res.send(JSON.stringify({play, box}));
  } catch (error) {
    console.error('Error reading file:', error);
    res.send(JSON.stringify({ error: 'Failed to read data' }));
  }
});

app.get('/games', async (req, res) => {
  const { date } = req.query;
  try {
    const dateData = await database.getDate(date)
    res.send(JSON.stringify({ data: dateData.rows }));
  } catch (error) {
    console.error('Error reading file:', error);
    res.send(JSON.stringify({ error: 'Failed to read data' }));
  }
});

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});