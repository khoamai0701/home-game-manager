import { Router } from 'express'
import pool from '../db.js'

const router = Router()

router.get('/', async (req, res) => {
    const stats = await pool.query(`
        SELECT
            SUM(amount) FILTER (WHERE type != 'cashout' AND status = 'approved') AS total_buy_in,
            SUM(amount) FILTER (WHERE type = 'cashout' AND status = 'approved') AS total_cash_out,
            COUNT(DISTINCT game_id) AS games_played
        FROM transactions
        JOIN players ON transactions.player_id = players.id
        WHERE players.user_id = $1`, [req.user.userId]
        
    )
    res.json(stats.rows[0])

})

export default router