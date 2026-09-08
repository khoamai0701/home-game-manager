import express from 'express'
import pool from '../db.js'

const router = express.Router()

router.post('/', async (req, res) => {
    const { name } = req.body
    const user_id = req.user.userId
    const created_at = new Date().toISOString()

    const result = await pool.query('INSERT INTO groups (name, created_by_user_id, created_at) VALUES ($1, $2, $3) RETURNING *', [name, user_id, created_at])


    const newGroup = result.rows[0]
    const userResult = await pool.query(`INSERT into group_members (group_id, user_id, joined_at) VALUES ($1, $2, $3) RETURNING *`, [newGroup.id, user_id, new Date().toISOString()])
    
    res.status(201).json(newGroup)
})

router.get('/', async (req, res) => {
    const result = await pool.query(`
        SELECT groups.* FROM groups
        JOIN group_members ON groups.id = group_members.group_id
        WHERE group_members.user_id = $1`, [req.user.userId])
    res.json(result.rows)
})

router.post('/:id/members', async (req, res) => {
    const groupId = req.params.id
    
    const { email } = req.body
    const joined_at = new Date().toISOString()

    const userResult = await pool.query(`SELECT * FROM users WHERE email = $1`, [email])

    if (!userResult.rows[0]) {
        return res.status(404).json({ error: 'No user found with this email' })
    }
    const user_id = userResult.rows[0].id
    const result = await pool.query(`INSERT INTO group_members (group_id, user_id, joined_at) VALUES ($1, $2, $3) RETURNING *`, [groupId, user_id, joined_at])

    const newMember = result.rows[0]
    res.status(201).json(newMember)

})

router.get('/:id', async (req, res) => {
    const id  = req.params.id
    const result = await pool.query(`
        SELECT groups.*, users.display_name, users.email
        FROM groups
        JOIN group_members ON groups.id = group_members.group_id
        JOIN users ON users.id = group_members.user_id
        WHERE groups.id = $1`, [id])
    
    const members = result.rows.map(row => {
        return {display_name: row.display_name, email: row.email}
    })
    const response = {
        id: result.rows[0].id,
        name: result.rows[0].name,
        members: members
    }
    res.json(response)
})

export default router