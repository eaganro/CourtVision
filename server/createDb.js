import pkg from 'pg';
const { Pool } = pkg;
import databaseCreds from './databaseCreds.js';

const pool = new Pool(databaseCreds);

pool.connect(err => {
  if (err) {
    console.error('Connection error', err.stack);
  } else {
    console.log('Connected to PostgreSQL');
  }
});

// const createDatabaseQuery = ['DROP DATABASE IF EXISTS games;', 'CREATE DATABASE nbavis'];
// const createDatabaseQuery = ['DROP TABLE IF EXISTS games;', 'CREATE TABLE games(id VARCHAR PRIMARY KEY);',
// 'ALTER TABLE games ADD COLUMN homeScore INTEGER;', 'ALTER TABLE games ADD COLUMN awayScore INTEGER;',
// 'ALTER TABLE games ADD COLUMN homeRecord VARCHAR;', 'ALTER TABLE games ADD COLUMN awayRecord VARCHAR;',
// 'ALTER TABLE games ADD COLUMN homeTeam VARCHAR;', 'ALTER TABLE games ADD COLUMN awayTeam VARCHAR;',
// 'ALTER TABLE games ADD COLUMN startTime VARCHAR;', 'ALTER TABLE games ADD COLUMN clock VARCHAR;',
// 'ALTER TABLE games ADD COLUMN status VARCHAR;', 'ALTER TABLE games ADD COLUMN date DATE;'];

const createDatabaseQuery = ['ALTER TABLE games ADD COLUMN homeRecord VARCHAR;', 'ALTER TABLE games ADD COLUMN awayRecord VARCHAR;'];
// const createDatabaseQuery = ['ALTER TABLE games DROP COLUMN homeRecord;', 'ALTER TABLE games DROP COLUMN awayRecord;'];

const nextC = async function(i) {
  await pool.query(createDatabaseQuery[i]);
  if (createDatabaseQuery.length > i + 1) {
    nextC(i + 1);
  }
}
nextC(0);