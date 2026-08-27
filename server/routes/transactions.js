import { Router } from 'express'
import pool from '../db.js'

const VALID_STATUSES = ['pending', 'approved', 'rejected']

export default function(io) {
    const router = Router()

router.get('/:game_id', async (req, res) => {
    const { game_id } = req.params
    const transactions = await pool.query('SELECT * FROM transactions WHERE game_id = $1 ORDER BY created_at ASC', [game_id])

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
    const { status, amount } = req.body

    // Build the SET clause from whatever the caller actually sent so this one
    // route can approve/reject (status) AND correct a mis-typed amount.
    const sets = []
    const values = []

    if (status !== undefined) {
        if (!VALID_STATUSES.includes(status)) {
            return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` })
        }
        values.push(status)
        sets.push(`status = $${values.length}`)
    }

    if (amount !== undefined) {
        const numericAmount = Number(amount)
        if (!Number.isFinite(numericAmount) || numericAmount < 0) {
            return res.status(400).json({ error: 'amount must be a non-negative number' })
        }
        values.push(numericAmount)
        sets.push(`amount = $${values.length}`)
    }

    // Back-compat: an old client PATCHes with no body just to approve.
    if (sets.length === 0) {
        values.push('approved')
        sets.push(`status = $${values.length}`)
    }

    values.push(id)
    const result = await pool.query(
        `UPDATE transactions SET ${sets.join(', ')} WHERE id = $${values.length} RETURNING *`,
        values
    )

    if (result.rowCount === 0) {
        return res.status(404).json({ error: `Transaction ${id} not found` })
    }

    const updatedTransaction = result.rows[0]
    io.to(String(updatedTransaction.game_id)).emit('transaction-updated', updatedTransaction)

    let warning = null

    // A cash-out's approval state drives the player's cashed_out lock.
    if (updatedTransaction.type === 'cashout') {
        const nowApproved = updatedTransaction.status === 'approved'

        try {
            const playerResult = await pool.query(
                'UPDATE players SET cashed_out = $1 WHERE id = $2 RETURNING *',
                [nowApproved, updatedTransaction.player_id]
            )
            if (playerResult.rowCount > 0) {
                io.to(String(updatedTransaction.game_id)).emit('player-updated', playerResult.rows[0])
            }
        } catch (err) {
            // Column missing = migrate.js hasn't been run yet. Don't fail the
            // approval; the client also derives cashed_out from the transaction.
            console.error('could not update players.cashed_out (run migrate.js):', err.message)
        }

        // Table-wide chip-conservation check: warn (never block) if approving
        // this cash-out makes total approved cash-outs exceed total buy-ins.
        if (nowApproved) {
            const totals = await pool.query(
                `SELECT
                    COALESCE(SUM(amount) FILTER (WHERE type <> 'cashout'), 0) AS total_in,
                    COALESCE(SUM(amount) FILTER (WHERE type = 'cashout'), 0) AS total_out
                 FROM transactions
                 WHERE game_id = $1 AND status = 'approved'`,
                [updatedTransaction.game_id]
            )
            const { total_in, total_out } = totals.rows[0]
            if (Number(total_out) > Number(total_in)) {
                warning = `Heads up: approved cash-outs ($${Number(total_out).toLocaleString()}) now exceed approved buy-ins ($${Number(total_in).toLocaleString()}) for this game.`
            }
        }
    }

    res.json({ ...updatedTransaction, warning })
})

router.delete('/:id', async (req, res) => {
    const { id } = req.params

    const result = await pool.query('DELETE FROM transactions WHERE id = $1 RETURNING *', [id])

    if (result.rowCount === 0) {
        return res.status(404).json({ error: `Transaction ${id} not found` })
    }

    const deleted = result.rows[0]
    io.to(String(deleted.game_id)).emit('transaction-deleted', { id: Number(id) })
    res.status(204).send()
})
    return router
}
