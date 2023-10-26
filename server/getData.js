import schedule from 'node-schedule';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import puppeteer from 'puppeteer';

schedule.scheduleJob('0 8 * * *', () => {
  const today = new Date();
  const todayString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`
  console.log(todayString);


  (async () => {
    async function getGames() {
      const res = await fetch(`https://www.nba.com`);
      const data = await res.text();
      const $ = cheerio.load(data);
      let obj = JSON.parse($('#__NEXT_DATA__').html());
      let dateList = obj.props.pageProps.oldrollingschedule.find(d => d.gameDate === todayString);

      return !dateList ? [] : obj.props.pageProps.oldrollingschedule.find(d => d.gameDate === todayString).games.map((g, i) => {
        return {
          url: `${g.visitorTeam.teamTricode}-vs-${g.homeTeam.teamTricode}-${g.gameId}`,
          startTime: new Date(g.gameDateTimeUTC)
        };
      });
    }

    let gameUrls = await getGames();
    console.log(gameUrls);
    const browser = await puppeteer.launch({headless: true});
    gameUrls.forEach(game => {
      let gameId = game.url.slice(-10);
      let startTime = game.startTime;
      let fourHoursLater = new Date(startTime.getTime() + 4 * 60 * 60 * 1000);
      schedule.scheduleJob((new Date), async () => {
        const page = await browser.newPage();
        await page.setDefaultNavigationTimeout(0);
        let lastActionIndex = -1;
        const writeStream = fs.createWriteStream(`public/playByPlayData/${gameId}.json`);
        page.on('response', async (response) => {
          if (response.url().includes('playbyplay')) {
            const actions = (await response.json())?.game?.actions;
            const newActions = actions.filter((_, index) => index > lastActionIndex);
            lastActionIndex = actions.length - 1;
            newActions.forEach(action => {
              writeStream.write(JSON.stringify(action) + '\n', err => {
                if (err) {
                  console.error('Error writing to file', err);
                }
              });
            });
          }
        });
        await page.goto(`https://www.nba.com/game/${game.url}`);

        schedule.scheduleJob(fourHoursLater, () => {
          writeStream.end();
          page.close(); // close the page
        });
      });
      
    });
  })();
});