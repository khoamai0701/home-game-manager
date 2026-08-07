import { DatabaseSync } from 'node:sqlite'
const db = new DatabaseSync('homegame.db')

db.exec(`
    CREATE TABLE IF NOT EXISTS games (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    date     TEXT,
    location TEXT,
    pin      TEXT

    )
`)

db.exec(`
    CREATE TABLE IF NOT EXISTS players (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER,
    name    TEXT,
    cashOut REAL
    )
    `)

db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id   INTEGER,
    game_id     INTEGER,
    created_at  TEXT,
    amount      REAL,
    type        TEXT,
    status      TEXT DEFAULT 'pending'
    )
    `

)

export default db

