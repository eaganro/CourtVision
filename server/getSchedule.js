import * as fs from 'fs';
import * as cheerio from 'cheerio';

(async () => {
  let date = new Date();
  const res = await fetch(`https://www.nba.com/games?date=${date}`);
  const data = await res.text();
  const $ = cheerio.load(data);
  $('a.GameCard_gcm__SKtfh.GameCardMatchup_gameCardMatchup__H0uPe').each((i, a) => {
    if (i === 0) {
      console.log($(a).attr('href'));
    }
  });

})();

function getDatesForYears(years) {
  let dates = [];
  for (let year of years) {
      let startDate = new Date(year, 0, 1); // January 1st of the year
      let endDate = new Date(year, 11, 31); // December 31st of the year

      for (let date = startDate; date <= endDate; date.setDate(date.getDate() + 1)) {
          dates.push(new Date(date).toISOString().split('T')[0]); // Format as YYYY-MM-DD
      }
  }
  return dates;
}

// Generate dates for 2023 and 2024
// let dateList = getDatesForYears([2023, 2024]);
// console.log(dateList);
