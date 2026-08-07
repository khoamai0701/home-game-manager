import { Router } from 'express'
import db from '../db.js'

const router = Router()

router.get('/', (req, res) => {
    const games = db.prepare('SELECT * FROM games ORDER BY date DESC').all()
    res.json(games)
})

router.get('/:id', (req, res) => {
    const { id } = req.params   
    const selectedGame = db.prepare('SELECT * FROM games WHERE id = ?').get(id)
    res.json(selectedGame)
})

router.post('/', (req, res) => {
    const { date, location, pin} = req.body
    const result = db.prepare(`INSERT INTO games (date, location, pin) VALUES (?, ?, ?)`).run(date, location, pin)
    const newGame = db.prepare('SELECT * FROM games WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json(newGame)

})

router.delete('/:id', (req, res) => {
    const { id } = req.params
    db.prepare('DELETE FROM games WHERE id = ?').run(id)
    res.status(204).send()
})

export default router