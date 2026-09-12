import { useState } from 'react'
import { formatMoney } from '../utils/format'
import { IconClose, IconInbox } from './Icons'

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
        <div className="modal" onClick={onClose}>
            <div className="modal__card" onClick={e => e.stopPropagation()}>
                <div className="modal__head">
                    <div>
                        <h2 className="modal__title">{player.name}'s transactions</h2>
                        <span className="modal__sub">Approved buy-in {formatMoney(totalBuyIn)}</span>
                    </div>
                    <button className="iconbtn" onClick={onClose} aria-label="Close">
                        <IconClose size={16} />
                    </button>
                </div>

                <p className="hint">
                    Correct a mis-typed amount, or settle anything still pending.
                </p>

                {playerTransactions.length === 0 ? (
                    <div className="empty empty--sm">
                        <span className="empty__icon"><IconInbox size={20} /></span>
                        <span className="empty__title">No transactions for this player</span>
                    </div>
                ) : (
                    <div className="tx-list">
                        {playerTransactions.map(t => {
                            const draft = drafts[t.id] ?? String(t.amount)
                            const dirty = drafts[t.id] !== undefined && Number(drafts[t.id]) !== Number(t.amount)
                            return (
                                <div key={t.id} className={`tx-row tx-row--${t.status}`}>
                                    <div className="tx-row__meta">
                                        <span className={`tag tag--${t.type}`}>{TYPE_LABEL[t.type] || t.type}</span>
                                        <span className={`tag tag--${t.status}`}>{t.status}</span>
                                    </div>
                                    <div className="tx-row__edit">
                                        <span className="tx-row__prefix">$</span>
                                        <input
                                            className="input tx-row__input"
                                            type="number"
                                            aria-label={`${TYPE_LABEL[t.type] || t.type} amount`}
                                            value={draft}
                                            onChange={e => setDrafts(prev => ({ ...prev, [t.id]: e.target.value }))}
                                        />
                                        <button
                                            className="btn btn--approve btn--sm"
                                            disabled={!dirty || savingId === t.id}
                                            onClick={() => save(t)}
                                        >
                                            {savingId === t.id ? '…' : 'Save'}
                                        </button>
                                    </div>
                                    {t.status === 'pending' && (
                                        <div className="tx-row__actions">
                                            <button className="btn btn--approve btn--sm" onClick={() => onApprove(t.id)}>Approve</button>
                                            <button className="btn btn--reject btn--sm" onClick={() => onReject(t.id)}>Reject</button>
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
