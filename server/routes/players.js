import { Router } from 'express'
import db from '../db.js'

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

    res.status(201).json(newPlayer)
})

router.delete('/:id', (req, res) => {
    const { id } = req.params
    db.prepare('DELETE FROM players WHERE id = ?').run(id)
    res.status(204).send()
})
export default router