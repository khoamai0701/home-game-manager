import { Router } from 'express'
import pool from '../db.js'

const router = Router()

router.get('/me', async (req, res) => {
    const result = await pool.query(
        'SELECT id, display_name, email, avatar_url FROM users WHERE id = $1',
        [req.user.userId]
    )
    if (result.rowCount === 0) {
        return res.status(404).json({ error: 'User not found' })
    }
    res.json(result.rows[0])
})

export default router
