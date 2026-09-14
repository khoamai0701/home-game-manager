import { Router } from 'express'
import pool from '../db.js'

const router = Router()

router.get('/', async (req, res) => {
    // Scoped to games this user hosted or actually played in — this is a
    // person's own history, not a directory of every game on the server.
    // (GET /:id below stays unscoped: opening a shared game link is how a new
    // player joins a game they didn't create, so that lookup has to work for
    // any authenticated user, not just the host/existing players.)
    const userId = req.user.userId
    const games = await pool.query(
        `SELECT DISTINCT games.*
         FROM games
         LEFT JOIN players ON players.game_id = games.id
         WHERE games.created_by_user_id = $1 OR players.user_id = $1
         ORDER BY games.date DESC`,
        [userId]
    )
    res.json(games.rows)
})

router.get('/:id', async (req, res) => {
    const { id } = req.params   
    const selectedGame = await pool.query('SELECT * FROM games WHERE id =  $1', [id])
    res.json(selectedGame.rows[0])
})

router.get('/group/:group_id', async (req, res) => {
    const { group_id } = req.params
    const games = await pool.query(`SELECT * FROM games WHERE group_id = $1 ORDER BY date DESC` , [group_id])
    res.json(games.rows)
})

router.post('/', async (req, res) => {
    const { date, location, group_id } = req.body
    const safeGroupId = group_id === '' ? null : group_id
    const createdByUserId = req.user.userId
    const result = await pool.query(`INSERT INTO games (date, location, created_by_user_id, group_id) VALUES ($1, $2, $3, $4) RETURNING *`, [date, location, createdByUserId, safeGroupId])
    
    res.status(201).json(result.rows[0])

})

router.delete('/:id', async (req, res) => {
    const { id } = req.params

    const gameResult = await pool.query('SELECT * FROM games WHERE id = $1', [id])
    if (gameResult.rowCount === 0) {
        return res.status(404).json({ error: 'Game not found' })
    }
    if (gameResult.rows[0].created_by_user_id !== req.user.userId) {
        return res.status(403).json({ error: 'Only the host can delete this game' })
    }

    // Cascade, same as removing a single player in players.js — otherwise
    // this game's transactions and player rows are orphaned forever.
    await pool.query('DELETE FROM transactions WHERE game_id = $1', [id])
    await pool.query('DELETE FROM players WHERE game_id = $1', [id])
    await pool.query('DELETE FROM games WHERE id = $1', [id])

    res.status(204).send()
})

router.patch('/:id', async (req, res) => {
    const { id } = req.params
    const result = await pool.query(`UPDATE games SET is_active = $1 WHERE id = $2 RETURNING *`, [false, id])
    res.json(result.rows[0])

})

export default router