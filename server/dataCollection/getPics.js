import * as fs from 'fs';
import * as https from 'https';


fs.readFile('./teamNames.txt', 'utf8', (err, data) => {
  if (err) throw err;
  console.log(data.split('\n').length);
  data.split('\n').map(a => a.replace(/\W/g, '')).forEach(team => {
    // downloadFile((`https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/${team}.png`), `./public/img/teams/${team}.png`);
  });
  downloadFile((`https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/no.png`), `./public/img/teams/NOP.png`);
});


function downloadFile(url, filename) {
  console.log(url);
  const file = fs.createWriteStream(filename);

  https.get(url, response => {
    response.pipe(file);
  
    file.on('finish', () => {
      file.close();
      console.log(`Image downloaded as ${filename}`);
    });
  }).on('error', err => {
    fs.unlink(filename);
    console.error(`Error downloading image: ${err.message}`);
  });
  
  // const file = fs.createWriteStream(`./public/img/teams/${teams[i]}.png`);
  // const request = https.get(`https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/${teams[i]}.png`, function(response) {
  //   response.pipe(file);
  //     file.on("finish", () => {
  //       file.close();
  //       console.log("Download Completed");
  //       if (i < 28) {
  //         downloadFile(teams, i + 1);
  //       }
  //     });
  // });
}

// function downloadImage(teams, i) {
//   return new Promise((resolve, reject) => {
//       client.get(url, (res) => {
//           if (res.statusCode === 200) {
//               res.pipe(fs.createWriteStream(filepath))
//                   .on('error', reject)
//                   .once('close', () => resolve(filepath));
//           } else {
//               // Consume response data to free up memory
//               res.resume();
//               reject(new Error(`Request Failed With a Status Code: ${res.statusCode}`));

//           }
//       });
//   });
// }