import gamesObj from '../public/data/schedule/schedule.json' assert { type: 'json' };
import * as fs from 'fs';
import fsp from 'fs/promises';
import * as cheerio from 'cheerio';
import database from '../database.js';


let requestList = [];
const today = new Date();
// const today = new Date(2025, 1, 15);
const start = new Date(2025, 2, 6);
const end = new Date(2025, 2, 30);
Object.entries(gamesObj).forEach(([k,v]) => {
  if (today > new Date(k) && new Date(2025, 1, 30) < new Date(k)) {
  // if (new Date(k) >= start && new Date(k) < end) {
    v.forEach(gameId => {
      requestList.push([gameId, Math.random(), k])
    });
  }
});
requestList.sort((a, b) => a[1] - b[1]);

const getPage = async function(i) {
  if (i === requestList.length) {
    return;
  }
  const gameId = requestList[i][0];
  const gameIdNums = gameId.slice(-10);
  const date = new Date(requestList[i][2]);
  console.log(`${i} - ${gameId}`);

  let boxStat, playStat;
  try {
    boxStat = await fsp.stat(`public/data/boxData/${gameIdNums}.json`);
    playStat = await fsp.stat(`public/data/playByPlayData/${gameIdNums}.json`);
    let box = JSON.parse(await fsp.readFile(`public/data/boxData/${gameIdNums}.json`));
    if (!box.gameStatusText.startsWith('Final')) {
      fetchFunc(gameId, i);
    } else {
      getPage(i + 1);
    }
  } catch (error) {
    fetchFunc(gameId, i);
  }
  // fs.stat(`public/data/boxData/${gameIdNums}.json`, (err, stat) => {
  //   if (stat === undefined) {
  //     fetchFunc(gameId, i);
  //   } else {
  //     getPage(i + 1);
  //   }
  // });
}

const fetchFunc = function(gameId, i) {
  fetch(`https://www.nba.com/game/${gameId}`)
    .then(res=> res.text()).then(data => {
      const $ = cheerio.load(data);
      const obj = JSON.parse($('#__NEXT_DATA__').html());
      if (obj === null){
        fetchFunc(gameId, i);
      } else {
        const playByPlay = obj.props.pageProps.playByPlay?.actions;
	if (playByPlay === undefined) {
		return;
	}
        const box = obj.props.pageProps.game;
        database.insertGame(box);
        makeFile(playByPlay, box, gameId.slice(-10));
        // setTimeout(() => {
        //   getPage(i + 1);
        // }, Math.random() * 0)
      }
    });
}

const makeFile = function(playByPlay, box, gameId) {
  // if (playByPlay.length) {
    gameId = gameId.replace(/\//g, '');
    fs.writeFile(`public/data/playByPlayData/${gameId}.json`, JSON.stringify(playByPlay), function (err) {
      if (err) throw err;
      console.log('Saved!');
    });
    fs.writeFile(`public/data/boxData/${gameId}.json`, JSON.stringify(box), function (err) {
      if (err) throw err;
      console.log('Saved!');
    });
  // }
}

// requestList.forEach((v, i) => {
//   getPage(i);
//   setTimeout(() => {}, 200);
// });

// getPage(0);

requestList.forEach(async (r, i) =>{
  const gameId = r[0];
  const gameIdNums = gameId.slice(-10);
  console.log(`${i} - ${gameId}`);

  // let boxStat, playStat;
  try {
    // boxStat = await fsp.stat(`public/data/boxData/${gameIdNums}.json`);
    // playStat = await fsp.stat(`public/data/playByPlayData/${gameIdNums}.json`);
    let box = JSON.parse(await fsp.readFile(`public/data/boxData/${gameIdNums}.json`));
    if (!box.gameStatusText.startsWith('Final')) {
      fetchFunc(gameId, i);
    } else {
      // getPage(i + 1);
    }
  } catch (error) {
    fetchFunc(gameId, i);
  }
});
