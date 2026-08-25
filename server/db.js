import pg from 'pg'
const { Pool } = pg

const pool = new Pool({
  database: 'homegame',
  host: 'localhost',
  port: 5432
})

export default pool