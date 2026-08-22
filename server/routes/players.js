import { Router } from 'express'
import db from '../db.js'


export default function(io) {
    const router = Router()

    router.get('/:game_id', (req, res) => {
        const { game_id } = req.params
        const players = db.prepare('SELECT * FROM players WHERE game_id = ?').all(game_id)

        res.json(players)
    })

    router.post('/', (req, res) => {
        const { game_id, name, cashOut } = req.body
        const result = db.prepare(`INSERT INTO players (game_id, name) VALUES (?, ?)`).run(game_id, name)

        const newPlayer = db.prepare('SELECT * FROM players WHERE id = ?').get(result.lastInsertRowid)

        io.to(String(game_id)).emit('player-added', newPlayer)
        res.status(201).json(newPlayer)
    })

    router.delete('/:id', (req, res) => {
        const { id } = req.params
        const player = db.prepare('SELECT * FROM players WHERE id = ?').get(id)
        db.prepare('DELETE FROM players WHERE id = ?').run(id)
        io.to(String(player.game_id)).emit('player-deleted', {id: Number(id)})
        res.status(204).send()
    })

    return router
}