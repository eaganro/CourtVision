import * as fs from 'fs';

fs.readdir('public/data/playByPlayData', (err, files) => {
  files.forEach(file => {
    fs.readFile(`public/data/playByPlayData/${file}`, 'utf8', (err, data) => { 
      fs.writeFile(`public/data/playByPlayData/${file}`, '', () => {
        JSON.parse(data).forEach(row => {
          fs.appendFileSync(`public/data/playByPlayData/${file}`, JSON.stringify(row) + '\n', 'utf8');
        });
      });
    }); 
  });
});
