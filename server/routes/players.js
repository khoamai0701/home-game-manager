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
        const { game_id, name, cashOut } = req.body
        const result = await pool.query(`INSERT INTO players (game_id, name) VALUES ($1, $2) RETURNING * `, [game_id, name])
        const newPlayer = result.rows[0]

        io.to(String(game_id)).emit('player-added', newPlayer)
        res.status(201).json(newPlayer)
    })

    router.delete('/:id', async (req, res) => {
        const { id } = req.params
        const player = await pool.query('SELECT * FROM players WHERE id = $1', [id])
        await pool.query('DELETE FROM players WHERE id = $1', [id])
        io.to(String(player.rows[0].game_id)).emit('player-deleted', {id: Number(id)})
        res.status(204).send()
    })

    return router
}