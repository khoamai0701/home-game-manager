import { Router } from 'express'
import pool from '../db.js'

const router = Router()

router.get('/', async (req, res) => {
    const stats = await pool.query(`
        SELECT
            SUM(amount) FILTER (WHERE type != 'cashout' AND status = 'approved') AS total_buy_in,
            SUM(amount) FILTER (WHERE type = 'cashout' AND status = 'approved') AS total_cash_out,
            COUNT(DISTINCT transactions.game_id) AS games_played
        FROM transactions
        JOIN players ON transactions.player_id = players.id
        WHERE players.user_id = $1`, [req.user.userId]
        
    )
    res.json(stats.rows[0])

})

router.get('/:group_id', async (req, res) => {
    const groupId = req.params.group_id
    const groupStats = await pool.query(`
        SELECT 
            users.display_name, 
            SUM(amount) FILTER (WHERE type != 'cashout' AND status = 'approved') AS total_buy_in,
            SUM(amount) FILTER (WHERE type = 'cashout' AND status = 'approved') AS total_cash_out
        FROM transactions
        JOIN players ON transactions.player_id = players.id
        JOIN group_members ON players.user_id = group_members.user_id 
        JOIN users ON group_members.user_id = users.id
        WHERE group_members.group_id = $1
        GROUP BY users.display_name`, [groupId])
    res.json(groupStats.rows)
        

})



export default router