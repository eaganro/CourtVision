import express from 'express';
import http from 'http';

import schedule from './public/data/schedule/schedule.json' assert { type: 'json' };



const app = express();
const server = http.createServer(app);
const port = 3000;

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