import fetch from 'node-fetch';
import cheerio from 'cheerio';
import fs from 'fs/promises'; // Import the fs.promises module

async function fetchGamesForDate(date) {
  const res = await fetch(`https://www.nba.com/games?date=${date}`);
  const data = await res.text();
  const $ = cheerio.load(data);
  let hrefs = [];
  $('a.GameCard_gcm__SKtfh.GameCardMatchup_gameCardMatchup__H0uPe').each((i, a) => {
    hrefs.push($(a).attr('href'));
  });
  return hrefs;
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

(async () => {
  let gamesByDate = await getAllGamesForYears([2023, 2024]);

  // Convert the object to JSON string
  const jsonContent = JSON.stringify(gamesByDate, null, 2);

  // Write the JSON string to a file in the specified directory
  try {
    await fs.mkdir('./public/data', { recursive: true }); // Create the directory if it doesn't exist
    await fs.writeFile('./public/data/2023-2024.json', jsonContent, 'utf8');
    console.log('Data saved to ./public/data/2023-2024.json');
  } catch (error) {
    console.error('Error writing file:', error);
  }
})();
