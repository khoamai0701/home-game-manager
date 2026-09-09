import { Router } from 'express'
import pool from '../db.js'


export default function(io) {
    const router = Router()

    router.get('/:game_id', async (req, res) => {
        const { game_id } = req.params
        const players = await pool.query('SELECT * FROM players WHERE game_id = $1', [game_id])

        res.json(players.rows)
    })

    

    router.post('/', async (req, res) => {
        const { game_id, cashOut } = req.body
        const userId = req.user.userId
        const userResult = await pool.query(`SELECT display_name FROM users WHERE id = $1`, [userId])
        const name = userResult.rows[0].display_name

        const result = await pool.query(`INSERT INTO players (game_id, name, user_id) VALUES ($1, $2, $3) RETURNING * `, [game_id, name, userId])
        const newPlayer = result.rows[0]

        io.to(String(game_id)).emit('player-added', newPlayer)
        res.status(201).json(newPlayer)
    })

    router.delete('/:id', async (req, res) => {
        const { id } = req.params
        const player = await pool.query('SELECT * FROM players WHERE id = $1', [id])

        if (player.rowCount === 0) {
            return res.status(404).json({ error: `Player ${id} not found` })
        }

        const { game_id } = player.rows[0]

        // Remove the player's transactions too, otherwise their buy-ins keep
        // counting toward the game's totals / cash-flow summary forever.
        await pool.query('DELETE FROM transactions WHERE player_id = $1', [id])
        await pool.query('DELETE FROM players WHERE id = $1', [id])

        io.to(String(game_id)).emit('player-deleted', { id: Number(id) })
        res.status(204).send()
    })

    return router
}