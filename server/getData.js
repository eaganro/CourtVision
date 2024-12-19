import * as fs from 'fs';
import puppeteer from 'puppeteer';
import schedule from 'node-schedule';
import database from './database.js';
import myEmitter from './eventEmitter.js';

schedule.scheduleJob('0 11 * * *', async () => {
  const today = new Date();
  let month = today.getMonth() + 1;
  if (month < 10) {
    month = '0' + month;
  }
  today.setHours(today.getHours() - 8)
  let day = today.getDate() + 1;
  if (day < 10) {
    day = '0' + day;
  }
  const todayString = `${today.getFullYear()}-${month}-${day}`
  console.log(todayString);
  console.log(today);

  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium-browser',
    headless: 'new'
  });
  console.log('con', browser.connected)
  browser.on('disconnected', () => console.log('disc'));

  try {
    let games = await database.getDate(todayString)
    games.rows.forEach(game => {
      try {
        let gameUrl = `${game.awayteam}-vs-${game.hometeam}-${game.id}`
        let startTime = new Date(game.starttime)
        console.log(gameUrl, startTime)
        schedule.scheduleJob(startTime, async () => {
          const page = await browser.newPage();
          await page.setDefaultNavigationTimeout(0);

          page.on('response', async (response) => {
            if (response.url().includes('playbyplay')) {
              console.log('play')
              try {
                const playbyplay = (await response.json())
                const actions = playbyplay?.game?.actions;
                fs.writeFileSync(`public/data/playByPlayData/${gameId}.json`, JSON.stringify(actions), 'utf8');
                myEmitter.emit('update', { gameId, type: 'playByPlayData', data: JSON.stringify(actions)  });

                const box = playbyplay?.game?.box;
                try {
                  fs.writeFileSync(`public/data/boxData/${gameId}.json`, JSON.stringify(box), 'utf8');
                  database.insertGame(box);
                  myEmitter.emit('update', { gameId, type: 'boxData', data: JSON.stringify(box) });
                  if (box.gameStatusText.startsWith('Final')) {
                    await page.close()
                    console.log('page closed for game ' + gameUrl)
                  }
                } catch (error) {
                  console.log(error)
                }
                
              } catch (error) {
                console.log(error);
              }
            } else if (response.url().includes('boxscore')) {
              console.log('box')
              if (response.ok()) {
                try {
                  const box = (await response.json())?.game;
                  fs.writeFileSync(`public/data/boxData/${gameId}.json`, JSON.stringify(box), 'utf8');
                  database.insertGame(box);
                  myEmitter.emit('update', { gameId, type: 'boxData', data: JSON.stringify(box) });

                  if (box.gameStatusText.startsWith('Final')) {
                    await page.close()
                    console.log('page closed for game ' + gameUrl)
                  }
                } catch (error) {
                  console.log(error)
                }
              }
            }
          })
          await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36');
          await page.goto(`https://www.nba.com/game/${gameUrl}/box-score`);
        })
      } catch (error) {
        console.log('error with: ' + `${game.awayteam}-vs-${game.hometeam}-${game.id}`)
        console.log(error)
      }
    })
  } catch (error) {
    console.log('error on: ' + todayString)
    console.log(error)
  }
})