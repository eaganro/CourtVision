import fetch from 'node-fetch';
import cheerio from 'cheerio';
import fs from 'fs/promises'; // Import the fs.promises module

async function fetchGamesForDate(date) {
  console.log(date);
  const res = await fetch(`https://www.nba.com/games?date=${date}`);
  console.log(`https://www.nba.com/games?date=${date}`)
  const data = await res.text();
  await fs.writeFile('./public/data/test/scheduletest.txt', data, 'utf-8');
  let hrefs = [];
  let start = data.indexOf('https://www.nba.com/game/');
  while (start !== -1) {
    let end = data.indexOf('"', start);
    hrefs.push(data.slice(start + 25, end));
    start = data.indexOf('https://www.nba.com/game/', end);
  }
  // const $ = cheerio.load(data);
  // console.log($)
  // let hrefs = [];
  // $('a.GameCard_gcm__SKtfh.GameCardMatchup_gameCardMatchup__H0uPe').each((i, a) => {
  //   console.log('asdf')
  //   hrefs.push($(a).attr('href').replace('/game/', ''));
  // });
  console.log(hrefs);
  return hrefs;
}

async function getAllGamesForDays(dates) {
  // let dates = ['2023-12-03', '2023-12-04', '2023-12-05', '2023-12-06', '2023-12-07', '2023-12-08', '2023-12-09', '2023-12-10']
  // let dates = ['2023-12-04']
  let gamesByDate = {};

  for (let date of dates) {
    gamesByDate[date] = await fetchGamesForDate(date);
  }

  return gamesByDate;
}

async function getAllGamesForYears(years) {
  let dates = getDatesForYears(years);
  let gamesByDate = {};

  for (let date of dates) {
    gamesByDate[date] = await fetchGamesForDate(date);
  }

  return gamesByDate;
}

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

function getGamesForMonths(year, months) {
  let dates = [];
  for (let month of months) {
    let startDate = new Date(year, month, 1); // January 1st of the year
    let endDate = new Date(year, month + 1, 0); // December 31st of the year

    for (let date = startDate; date <= endDate; date.setDate(date.getDate() + 1)) {
      dates.push(new Date(date).toISOString().split('T')[0]); // Format as YYYY-MM-DD
    }
  }
  return getAllGamesForDays(dates)
  // return dates;
}

(async () => {
  // let gamesByDate = await getAllGamesForYears([2023, 2024]);
  // let gamesByDate = await getAllGamesForDays();
  let gamesByDate = await getGamesForMonths(2024, [3, 4, 5]);

  // Convert the object to JSON string
  const jsonContent = JSON.stringify(gamesByDate, null, 2);

  // Write the JSON string to a file in the specified directory
  try {
    await fs.mkdir('./public/data', { recursive: true }); // Create the directory if it doesn't exist
    await fs.writeFile('./public/data/schedule/ist.json', jsonContent, 'utf8');
    console.log('Data saved to ./public/data/schedule/ist.json');
  } catch (error) {
    console.error('Error writing file:', error);
  }
})();
