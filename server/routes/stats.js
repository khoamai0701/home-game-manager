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
            users.id AS user_id,
            users.display_name,
            COALESCE(SUM(transactions.amount) FILTER (WHERE transactions.type != 'cashout' AND transactions.status = 'approved'), 0) AS total_buy_in,
            COALESCE(SUM(transactions.amount) FILTER (WHERE transactions.type = 'cashout' AND transactions.status = 'approved'), 0) AS total_cash_out
        FROM group_members
        JOIN users ON users.id = group_members.user_id
        LEFT JOIN players ON players.user_id = group_members.user_id
        LEFT JOIN transactions ON transactions.player_id = players.id
        WHERE group_members.group_id = $1
        GROUP BY users.id, users.display_name`, [groupId])
    res.json(groupStats.rows)


})



export default router