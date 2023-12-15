import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  user: 'test',
  host: 'localhost',
  password: 'test',
  port: 5432,
  database: 'nbavis'
});

client.connect(err => {
  if (err) {
    console.error('Connection error', err.stack);
  } else {
    console.log('Connected to PostgreSQL');
  }
});

// const createDatabaseQuery = ['DROP DATABASE IF EXISTS games;', 'CREATE DATABASE nbavis'];
const createDatabaseQuery = ['DROP TABLE IF EXISTS games;', 'CREATE TABLE games(id VARCHAR PRIMARY KEY)',
'ALTER TABLE games ADD COLUMN homeScore INTEGER', 'ALTER TABLE games ADD COLUMN awayScore INTEGER',
'ALTER TABLE games ADD COLUMN startTime VARCHAR', 'ALTER TABLE games ADD COLUMN clock VARCHAR',
'ALTER TABLE games ADD COLUMN status VARCHAR', 'ALTER TABLE games ADD COLUMN date DATE'];

createDatabaseQuery.forEach((q, i) =>{
  client.query(q, (err, res) => {
    if (err) {
      console.error('Error executing query', err.stack);
    } else {
      console.log('Success');
    }
  
    // Disconnect the client
    if(i === createDatabaseQuery.length - 1) {
      client.end();
    }
  });
});
