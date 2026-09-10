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

router.get('/group/:group_id', async (req, res) => {
    const { group_id } = req.params
    const games = await pool.query(`SELECT * FROM games WHERE group_id = $1 ORDER BY date DESC` , [group_id])
    res.json(games.rows)
})

router.post('/', async (req, res) => {
    const { date, location, group_id } = req.body
    const createdByUserId = req.user.userId
    const result = await pool.query(`INSERT INTO games (date, location, created_by_user_id, group_id) VALUES ($1, $2, $3, $4) RETURNING *`, [date, location, createdByUserId, group_id])
    
    res.status(201).json(result.rows[0])

})

router.delete('/:id', async (req, res) => {
    const { id } = req.params
    pool.query('DELETE FROM games WHERE id = $1', [id])
    res.status(204).send()
})

router.patch('/:id', async (req, res) => {
    const { id } = req.params
    const result = await pool.query(`UPDATE games SET is_active = $1 WHERE id = $2 RETURNING *`, [false, id])
    res.json(result.rows[0])

})

export default router