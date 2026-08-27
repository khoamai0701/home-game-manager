import { useState } from 'react'

const TYPE_LABEL = { buyin: 'Buy-in', topoff: 'Top-off', cashout: 'Cash-out' }

function PlayerTransactionsModal({ player, transactions, onClose, onUpdateAmount, onApprove, onReject }) {
    const [drafts, setDrafts] = useState({})
    const [savingId, setSavingId] = useState(null)

    const playerTransactions = [...transactions]
        .filter(t => t.player_id === player.id)
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))

    const totalBuyIn = playerTransactions
        .filter(t => t.status === 'approved' && t.type !== 'cashout')
        .reduce((sum, t) => sum + Number(t.amount), 0)

    async function save(t) {
        const raw = drafts[t.id]
        if (raw === undefined || raw === '' || Number(raw) === Number(t.amount)) return
        setSavingId(t.id)
        try {
            await onUpdateAmount(t.id, Number(raw))
            setDrafts(prev => {
                const next = { ...prev }
                delete next[t.id]
                return next
            })
        } finally {
            setSavingId(null)
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <h2>{player.name}'s Transactions</h2>
                        <span className="modal-subtitle">Total buy-in {`$${totalBuyIn.toLocaleString()}`}</span>
                    </div>
                    <button className="icon-btn icon-btn--neutral" onClick={onClose} aria-label="Close">✕</button>
                </div>

                {playerTransactions.length === 0 ? (
                    <div className="empty-state">No transactions for this player</div>
                ) : (
                    <div className="modal-tx-list">
                        {playerTransactions.map(t => {
                            const draft = drafts[t.id] ?? String(t.amount)
                            const dirty = drafts[t.id] !== undefined && Number(drafts[t.id]) !== Number(t.amount)
                            return (
                                <div key={t.id} className={`modal-tx-row modal-tx-row--${t.status}`}>
                                    <div className="modal-tx-row__meta">
                                        <span className={`type-badge type-badge--${t.type}`}>{TYPE_LABEL[t.type] || t.type}</span>
                                        <span className={`status-pill status-pill--${t.status}`}>{t.status}</span>
                                    </div>
                                    <div className="modal-tx-row__edit">
                                        <span className="modal-tx-row__dollar">$</span>
                                        <input
                                            className="form-input modal-tx-row__input"
                                            type="number"
                                            value={draft}
                                            onChange={e => setDrafts(prev => ({ ...prev, [t.id]: e.target.value }))}
                                        />
                                        <button
                                            className="btn btn-approve"
                                            disabled={!dirty || savingId === t.id}
                                            onClick={() => save(t)}
                                        >
                                            {savingId === t.id ? '…' : 'Save'}
                                        </button>
                                    </div>
                                    {t.status === 'pending' && (
                                        <div className="modal-tx-row__actions">
                                            <button className="btn btn-approve" onClick={() => onApprove(t.id)}>Approve</button>
                                            <button className="btn btn-reject" onClick={() => onReject(t.id)}>Reject</button>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}

export default PlayerTransactionsModal
