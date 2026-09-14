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
        SELECT groups.*, users.id AS member_user_id, users.display_name, users.email
        FROM groups
        JOIN group_members ON groups.id = group_members.group_id
        JOIN users ON users.id = group_members.user_id
        WHERE groups.id = $1`, [id])

    if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Group not found' })
    }

    const members = result.rows.map(row => {
        return { user_id: row.member_user_id, display_name: row.display_name, email: row.email }
    })
    const response = {
        id: result.rows[0].id,
        name: result.rows[0].name,
        created_by_user_id: result.rows[0].created_by_user_id,
        members: members
    }
    res.json(response)
})

router.patch('/:id', async (req, res) => {
    const { id } = req.params
    const { name } = req.body
    const userId = req.user.userId

    const groupResult = await pool.query('SELECT * FROM groups WHERE id = $1', [id])
    if (groupResult.rowCount === 0) {
        return res.status(404).json({ error: 'Group not found' })
    }
    if (groupResult.rows[0].created_by_user_id !== userId) {
        return res.status(403).json({ error: 'Only the group creator can rename this group' })
    }
    if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Name is required' })
    }

    const result = await pool.query('UPDATE groups SET name = $1 WHERE id = $2 RETURNING *', [name.trim(), id])
    res.json(result.rows[0])
})

router.delete('/:id', async (req, res) => {
    const { id } = req.params
    const userId = req.user.userId

    const groupResult = await pool.query('SELECT * FROM groups WHERE id = $1', [id])
    if (groupResult.rowCount === 0) {
        return res.status(404).json({ error: 'Group not found' })
    }
    if (groupResult.rows[0].created_by_user_id !== userId) {
        return res.status(403).json({ error: 'Only the group creator can delete this group' })
    }

    // Detach this group's games rather than deleting them — the games (and
    // their transactions) still belong to whoever hosted/played them.
    await pool.query('UPDATE games SET group_id = NULL WHERE group_id = $1', [id])
    await pool.query('DELETE FROM group_members WHERE group_id = $1', [id])
    await pool.query('DELETE FROM groups WHERE id = $1', [id])

    res.status(204).send()
})

router.delete('/:id/members/:user_id', async (req, res) => {
    const groupId = req.params.id
    const targetUserId = Number(req.params.user_id)
    const requesterId = req.user.userId

    const groupResult = await pool.query('SELECT * FROM groups WHERE id = $1', [groupId])
    if (groupResult.rowCount === 0) {
        return res.status(404).json({ error: 'Group not found' })
    }
    const group = groupResult.rows[0]

    const isSelf = targetUserId === requesterId
    const isCreator = group.created_by_user_id === requesterId

    if (!isSelf && !isCreator) {
        return res.status(403).json({ error: 'Only the group creator can remove other members' })
    }
    if (isSelf && isCreator) {
        return res.status(400).json({ error: "The group creator can't leave — delete the group instead" })
    }

    await pool.query('DELETE FROM group_members WHERE group_id = $1 AND user_id = $2', [groupId, targetUserId])
    res.status(204).send()
})

export default router
