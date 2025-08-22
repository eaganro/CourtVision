import schedule from 'node-schedule';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import puppeteer from 'puppeteer';
import myEmitter from '../eventEmitter.js';
import database from '../database.js';

import gamesObj from '../public/data/schedule/schedule.json' assert { type: 'json' };
// import testGame from './public/data/playByPlayData/0022300111.json' assert { type: 'json' };
// schedule.scheduleJob('0 8 * * *', () => {
  const today = new Date();
  let month = today.getMonth() + 1;
  if (month < 10) {
    month = '0' + month;
  }
  let day = today.getDate();
  if (day < 10) {
    day = '0' + day;
  }
  const todayString = `${today.getFullYear()}-${month}-${day}`
  // const todayString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate() >= 10 ? today.getDate() : '0' + today.getDate()}`
  console.log(todayString);


  (async () => {
    async function getGames() {
      return gamesObj[todayString].map(s => {
        return {
          url: s,
          startTime: today
        }
      });
      // const res = await fetch(`https://www.nba.com`);
      // const data = await res.text();
      // const $ = cheerio.load(data);
      // let obj = JSON.parse($('#__NEXT_DATA__').html());
      // let dateList = obj.props.pageProps.oldrollingschedule.find(d => d.gameDate === todayString);

      // return !dateList ? [] : obj.props.pageProps.oldrollingschedule.find(d => d.gameDate === todayString).games.map((g, i) => {
      //   return {
      //     url: `${g.visitorTeam.teamTricode}-vs-${g.homeTeam.teamTricode}-${g.gameId}`,
      //     startTime: new Date(g.gameDateTimeEst)
      //   };
      // });
    }

    let gameUrls = await getGames();
    console.log(gameUrls);
    // const browser = await puppeteer.launch({headless: true});
    const browser = await puppeteer.launch({
      executablePath: '/usr/bin/chromium-browser',
      headless: 'new'
    });
    console.log('con', browser.connected)
    browser.on('disconnected', () => console.log('disc'));

    // let pages = [];
    gameUrls.forEach(async (game) => {
      let gameId = game.url.slice(-10);
      if (gameId !== '0022300779') {
        console.log(gameId);
        // return;
      }
      let startTime = game.startTime;
      let fourHoursLater = new Date(startTime.getTime() + 4 * 60 * 60 * 1000);
      // schedule.scheduleJob((new Date), async () => {
        const page = await browser.newPage();
        await page.setDefaultNavigationTimeout(0);
        // await page.setRequestInterception(true);
        // console.log('asdfadsgasgasgd', page.isClosed())
        // console.log('page', page.url())
        let lastActionIndex = -1;
        console.log('1', gameId)
        let firstTime = true;
        // pages.push(page);

        // page.on('request', (req) => {
        //   if(req.resourceType() == 'stylesheet' || req.resourceType() == 'font' || req.resourceType() == 'image'){
        //     req.abort();
        //   }
        //   else {
        //       req.continue();
        //   }
        // });
        page.on('response', async (response) => {
          // console.log('asdf')
          if (response.url().includes('playbyplay')) {
            console.log('play')
            try {
              const playbyplay = (await response.json())
              const actions = playbyplay?.game?.actions;
              fs.writeFileSync(`public/data/playByPlayData/${gameId}.json`, JSON.stringify(actions), 'utf8');
              myEmitter.emit('update', { gameId, type: 'playByPlayData', data: JSON.stringify(actions)  });

              // const box = playbyplay?.game?.box;
              // fs.writeFileSync(`public/data/boxData/${gameId}.json`, JSON.stringify(box), 'utf8');
              // database.insertGame(box);
              // myEmitter.emit('update', { gameId, type: 'boxData', data: JSON.stringify(box) });
            } catch (error) {
              console.log(error);
            }
            // const newActions = actions.filter((_, index) => index > lastActionIndex);
            // lastActionIndex = actions.length - 1;
            // if (firstTime) {
            //   fs.writeFileSync(`public/data/playByPlayData/${gameId}.json`, JSON.stringify(newActions[0]) + '\n', 'utf8');
            //   newActions.shift();
            //   firstTime = false;
            // }
            // newActions.forEach(action => {
            //   console.log('written ' + action.actionNumber);
            //   fs.appendFileSync(`public/data/playByPlayData/${gameId}.json`, JSON.stringify(action) + '\n', 'utf8');
            // });
          }
          if (response.url().includes('boxscore')) {
            console.log('box')
            if (response.ok()) {
              const box = (await response.json())?.game;
              fs.writeFileSync(`public/data/boxData/${gameId}.json`, JSON.stringify(box), 'utf8');
              database.insertGame(box);
              myEmitter.emit('update', { gameId, type: 'boxData', data: JSON.stringify(box) });
            }
          }
        });
        console.log(`https://www.nba.com/game/${game.url}`)
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36');
        await page.goto(`https://www.nba.com/game/${game.url}/box-score`);
        // await page.goto(`https://roryeagan.com/nba`);
        console.log('after')
        // schedule.scheduleJob(fourHoursLater, () => {
        //   page.close(); // close the page
        // });
      // });
      
    });
    // setInterval(() => {
    //   pages.forEach(p => console.log(p.isClosed()));
    // }, 10000);
  })();
// });