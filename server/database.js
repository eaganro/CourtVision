import pkg from 'pg';
const { Pool } = pkg;

import fs from 'fs/promises';

const pool = new Pool({
  user: 'test',
  host: 'localhost',
  database: 'nbavis',
  password: 'test',
  port: 5432,
});

// pool.query('SELECT NOW()', (err, res) => {
//   console.log(err, res);
//   pool.end();
// });

(async () => {
  const files = await fs.readdir('public/data/boxData');
  files.forEach(async file => {
    const box = JSON.parse(await fs.readFile(`public/data/boxData/${file}`, 'utf8'));
    const id = box.gameId;
    const homeScore = box.homeTeam.score;
    const awayScore = box.awayTeam.score;
    const startTime = box.gameTimeUTC;
    const clock = box.gameClock;
    const status = box.gameStatusText;
    const date = new Date(box.gameEt);
    const dateDB = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    const query = `INSERT INTO games (id, homeScore, awayScore, startTime, clock, status, date)
      VALUES ('${id}', ${homeScore}, ${awayScore}, '${startTime}', '${clock}', '${status}', '${dateDB}')
      ON CONFLICT (id) 
      DO UPDATE SET 
      homeScore = EXCLUDED.homeScore,
      awayScore = EXCLUDED.awayScore,
      startTime = EXCLUDED.startTime,
      clock = EXCLUDED.clock,
      status = EXCLUDED.status;`;
      console.log(query)
    pool.query(query, (err, res) => {
      if (err) {
        console.log(err);
      } else{
        console.log('insert');
      }
    });
  });
})();