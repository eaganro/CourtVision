import schedule from 'node-schedule';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import puppeteer from 'puppeteer';
import myEmitter from './eventEmitter.js';

import gamesObj from './public/data/schedule/schedule.json' assert { type: 'json' };
// import testGame from './public/data/playByPlayData/0022300111.json' assert { type: 'json' };

// schedule.scheduleJob('0 8 * * *', () => {
  const today = new Date();
  const todayString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate() >= 10 ? today.getDate() : '0' + today.getDate()}`
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
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ],
      // executablePath: '/usr/bin/chromium',
      headless: true
    });
    gameUrls.forEach(async (game) => {
      let gameId = game.url.slice(-10);
      let startTime = game.startTime;
      let fourHoursLater = new Date(startTime.getTime() + 4 * 60 * 60 * 1000);
      // schedule.scheduleJob((new Date), async () => {
        const page = await browser.newPage();
        await page.setDefaultNavigationTimeout(0);
        let lastActionIndex = -1;
        console.log('1', gameId)
        let firstTime = true;
        page.on('response', async (response) => {
          if (response.url().includes('playbyplay')) {
            console.log('play', gameId);
            try {
              const actions = (await response.json())?.game?.actions;
              fs.writeFileSync(`public/data/playByPlayData/${gameId}.json`, JSON.stringify(actions), 'utf8');
              myEmitter.emit('update', { gameId, type: 'playByPlayData', data: JSON.stringify(actions)  });
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
            if (response.ok()) {
              console.log('box', gameId)
              const box = (await response.json())?.game;
              fs.writeFileSync(`public/data/boxData/${gameId}.json`, JSON.stringify(box), 'utf8');
              myEmitter.emit('update', { gameId, type: 'boxData', data: JSON.stringify(box) });
            }
          }
        });
        console.log(`https://www.nba.com/game/${game.url}`)
        await page.goto(`https://www.nba.com/game/${game.url}`);

        // schedule.scheduleJob(fourHoursLater, () => {
        //   page.close(); // close the page
        // });
      // });
      
    });
  })();
// });