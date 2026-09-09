import { Router } from 'express'
import pool from '../db.js'

const router = Router()

router.get('/', async (req, res) => {
    const games = await pool.query('SELECT * FROM games ORDER BY date DESC')
    res.json(games.rows)
})

router.get('/:id', async (req, res) => {
    const { id } = req.params   
    const selectedGame = await pool.query('SELECT * FROM games WHERE id =  $1', [id])
    res.json(selectedGame.rows[0])
})

router.post('/', async (req, res) => {
    const { date, location } = req.body
    const createdByUserId = req.user.userId
    const result = await pool.query(`INSERT INTO games (date, location, created_by_user_id) VALUES ($1, $2, $3) RETURNING *`, [date, location, createdByUserId])
    
    res.status(201).json(result.rows[0])

})

router.delete('/:id', async (req, res) => {
    const { id } = req.params
    pool.query('DELETE FROM games WHERE id = $1', [id])
    res.status(204).send()
})

export default router