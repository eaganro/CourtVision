import * as fs from 'fs';

fs.readdir('public/data/boxData', (err, files) => {
  files.forEach(file => {
    if (!file.endsWith('json')) {
      fs.stat(`public/data/boxData/${file}.json`, (err, stat) => {
        if (stat === undefined) {
          fs.rename(`public/data/boxData/${file}`, `public/data/boxData/${file}.json`, () => {});
        } else {
          fs.unlinkSync(`public/data/boxData/${file}`);
        }
      });
    }
    // fs.rename(`./data/boxData/${file}`, `./data/boxData/${file.slice(-10)}`, () => {});
  });
});

fs.readdir('public/data/playByPlayData', (err, files) => {
  files.forEach(file => {
    if (!file.endsWith('json')) {
      fs.stat(`public/data/playByPlayData/${file}.json`, (err, stat) => {
        if (stat === undefined) {
          fs.rename(`public/data/playByPlayData/${file}`, `public/data/playByPlayData/${file}.json`, () => {});
        } else {
          fs.unlinkSync(`public/data/playByPlayData/${file}`);
        }
      });
    }
    // fs.rename(`./data/boxData/${file}`, `./data/boxData/${file.slice(-10)}`, () => {});
  });
});