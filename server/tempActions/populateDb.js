import database from '../database.js';
import fsp from 'fs/promises';

(async function() {
  let files = await fsp.readdir('public/data/boxData');
  files.forEach(async file => {
    const box = JSON.parse(await fsp.readFile(`public/data/boxData/${file}`, 'utf8'));
    database.insertGame(box)
  });
})()
// fs.readdir('public/data/boxData', (err, files) => {
//   files.forEach(file => {
//     if (!file.endsWith('json')) {
//       fs.stat(`public/data/boxData/${file}.json`, (err, stat) => {
//         if (stat === undefined) {
//           fs.rename(`public/data/boxData/${file}`, `public/data/boxData/${file}.json`, () => {});
//         } else {
//           fs.unlinkSync(`public/data/boxData/${file}`);
//         }
//       });
//     }
//     // fs.rename(`./data/boxData/${file}`, `./data/boxData/${file.slice(-10)}`, () => {});
//   });
// });