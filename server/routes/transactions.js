import { Router } from 'express'
import db from '../db.js'

export default function(io) {
    const router = Router()

router.get('/:game_id', (req, res) => {
    const { game_id } = req.params
    const transactions = db.prepare('SELECT * FROM transactions WHERE game_id = ?').all(game_id)

    res.json(transactions)


})

router.post('/', (req, res) => {
    const { player_id, game_id, amount, type, status } = req.body
    const created_at = new Date().toISOString()

    const result = db.prepare(`INSERT INTO transactions (player_id, game_id, created_at, amount, type, status) VALUES (?, ?, ?, ?, ?, ?)`).run(player_id, game_id, created_at, amount, type, status)

    const newTransaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(result.lastInsertRowid)
    io.to(String(game_id)).emit('transaction-added', newTransaction)
    res.status(201).json(newTransaction)
    
})

router.patch('/:id', (req, res) => {
    const { id } = req.params
    const result = db.prepare(`UPDATE transactions SET status = 'approved' WHERE id = ?`).run(id)

    const updatedTransaciton = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id)
    io.to(String(updatedTransaciton.game_id)).emit('transaction-updated', updatedTransaciton)
    res.json(updatedTransaciton)
   



})

router.delete('/:id', (req, res) => {
    const { id } = req.params

    db.prepare('DELETE FROM transactions WHERE id = ?').run(id)
    res.status(204).send()
})
    return router
}