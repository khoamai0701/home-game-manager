import { Router } from 'express'
import pool from '../db.js'

export default function(io) {
    const router = Router()

router.get('/:game_id', async (req, res) => {
    const { game_id } = req.params
    const transactions = await pool.query('SELECT * FROM transactions WHERE game_id = $1', [game_id])

    res.json(transactions.rows)


})

router.post('/', async (req, res) => {
    const { player_id, game_id, amount, type, status } = req.body
    const created_at = new Date().toISOString()

    const result = await pool.query(`INSERT INTO transactions (player_id, game_id, created_at, amount, type, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`, [player_id, game_id, created_at, amount, type, status])

    const newTransaction = result.rows[0]
    io.to(String(game_id)).emit('transaction-added', newTransaction)
    res.status(201).json(newTransaction)
    
})

router.patch('/:id', async (req, res) => {
    const { id } = req.params
    const result = await pool.query(`UPDATE transactions SET status = 'approved' WHERE id = $1 RETURNING *`, [id])

    const updatedTransaciton = result.rows[0]
    io.to(String(updatedTransaciton.game_id)).emit('transaction-updated', updatedTransaciton)
    res.json(updatedTransaciton)
   



})

router.delete('/:id', async (req, res) => {
    const { id } = req.params

    await pool.query('DELETE FROM transactions WHERE id = $1', [id])
    res.status(204).send()
})
    return router
}