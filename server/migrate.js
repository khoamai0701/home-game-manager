import 'dotenv/config'
import pool from './db.js'

await pool.query(`
  CREATE TABLE IF NOT EXISTS games (
    id SERIAL PRIMARY KEY,
    date TEXT,
    location TEXT,
    pin TEXT
  )
`)

await pool.query(`
  CREATE TABLE IF NOT EXISTS players (
    id SERIAL PRIMARY KEY,
    game_id INTEGER,
    name TEXT,
    "cashOut" REAL
  )
`)

await pool.query(`
  CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    player_id INTEGER,
    game_id INTEGER,
    created_at TEXT,
    amount REAL,
    type TEXT,
    status TEXT DEFAULT 'pending'
  )
`)

console.log('Tables created')
await pool.end()