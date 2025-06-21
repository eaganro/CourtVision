import pkg from 'pg';
const { Pool } = pkg;

import fs from 'fs/promises';
import myEmitter from './eventEmitter.js';

import gamesObj from './public/data/schedule/schedule.json' assert { type: 'json' };
import * as cheerio from 'cheerio';
import { query } from 'express';

import databaseCreds from './databaseCreds.js';




const pool = new Pool(databaseCreds);

// pool.query('SELECT NOW()', (err, res) => {
//   console.log(err, res);
//   pool.end();
// });

export async function databaseGetDate(date) {
  const query = `SELECT * FROM games WHERE date='${date}'`;
  try {
    let data = await pool.query(query);
    // console.log(data);
    return data;
  } catch (err) {
    console.log(err);
  }
}

let databaseInsertGame = async function(box) {
  console.log('asdfasdfasdfsadf', box.gameId);
  const id = box.gameId;
  const homeScore = box.homeTeam.score;
  const awayScore = box.awayTeam.score;
  const homeRecord = `${box.homeTeam.teamWins}-${box.homeTeam.teamLosses}`;
  const awayRecord = `${box.awayTeam.teamWins}-${box.awayTeam.teamLosses}`;
  const homeTeam = box.homeTeam.teamTricode;
  const awayTeam = box.awayTeam.teamTricode;
  const startTime = box.gameTimeUTC;
  const clock = box.gameClock;
  const status = box.gameStatusText;
  const date = new Date(box.gameEt);
  const dateDB = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  const query = `INSERT INTO games (id, homeScore, awayScore, homeTeam, awayTeam, startTime, clock, status, date, homeRecord, awayRecord)
    VALUES ('${id}', ${homeScore}, ${awayScore}, '${homeTeam}', '${awayTeam}', '${startTime}', '${clock}', '${status}', '${dateDB}', '${homeRecord}', '${awayRecord}')
    ON CONFLICT (id) 
    DO UPDATE SET 
    homeScore = EXCLUDED.homeScore,
    awayScore = EXCLUDED.awayScore,
    homeTeam = EXCLUDED.homeTeam,
    awayTeam = EXCLUDED.awayTeam,
    startTime = EXCLUDED.startTime,
    clock = EXCLUDED.clock,
    date = EXCLUDED.date,
    status = EXCLUDED.status,
    homeRecord = EXCLUDED.homeRecord,
    awayRecord = EXCLUDED.awayRecord;`;
    console.log(query);
  try{
    // console.log(await pool.query(query));
    await pool.query(query)
    myEmitter.emit('scheduleUpdate', { date: dateDB, type: 'date' });
  } catch (err) {
    console.log(err);
  }
}

// const populateFromSchedule = function() {
//   Object.keys(gamesObj).forEach(k => {
//     gamesObj[k].forEach(async g => {
//       const query = `SELECT * FROM games WHERE id='${g.slice(-10)}'`;
//       let gameExists = (await pool.query(query)).rows[0];
//       if (!gameExists || (!gameExists.status.startsWith('Final') && !gameExists.status.endsWith('ET'))) {
//         console.log(query);
//         const $ = cheerio.load(await (await fetch(`https://www.nba.com/game/${g}`)).text());
//         const obj = JSON.parse($('#__NEXT_DATA__').html());
//         let box = obj.props.pageProps.game;
//         if (box) {
//           databaseInsertGame(box);
//         }
//       }
//     });
//   });
// }
// populateFromSchedule();

export default {
  getDate: async function(date) {
    console.log(date);
    const query = `SELECT * FROM games WHERE date='${date}'`;
    try {
      let data = await pool.query(query);
      // console.log(data.rows);
      return data;
    } catch (err) {
      console.log(err);
    }
  },
  insertGame: databaseInsertGame
};

// (async () => {
//   const files = await fs.readdir('public/data/boxData');
//   files.forEach(async file => {
//     const box = JSON.parse(await fs.readFile(`public/data/boxData/${file}`, 'utf8'));
//     const id = box.gameId;
//     const homeScore = box.homeTeam.score;
//     const awayScore = box.awayTeam.score;
//     const homeTeam = box.homeTeam.teamTricode;
//     const awayTeam = box.awayTeam.teamTricode;
//     const startTime = box.gameTimeUTC;
//     const clock = box.gameClock;
//     const status = box.gameStatusText;
//     const date = new Date(box.gameEt);
//     const dateDB = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
//     const query = `INSERT INTO games (id, homeScore, awayScore, homeTeam, awayTeam, startTime, clock, status, date)
//       VALUES ('${id}', ${homeScore}, ${awayScore}, '${homeTeam}', '${awayTeam}', '${startTime}', '${clock}', '${status}', '${dateDB}')
//       ON CONFLICT (id) 
//       DO UPDATE SET 
//       homeScore = EXCLUDED.homeScore,
//       awayScore = EXCLUDED.awayScore,
//       homeTeam = EXCLUDED.homeTeam,
//       awayTeam = EXCLUDED.awayTeam,
//       startTime = EXCLUDED.startTime,
//       clock = EXCLUDED.clock,
//       date = EXCLUDED.date,
//       status = EXCLUDED.status;`;
//       console.log(query)
//     pool.query(query, (err, res) => {
//       if (err) {
//         console.log(err);
//       } else{
//         console.log('insert');
//       }
//     });
//   });
// })();