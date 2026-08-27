    import { useParams } from "react-router-dom"
    import { useEffect, useRef, useState } from "react"
    import GameEntry from './GameEntry.jsx'
    import PlayerTransactionsModal from './PlayerTransactionsModal.jsx'
    import { io } from 'socket.io-client'

    // REST calls go through the Vercel rewrite / Vite proxy at `/api`, but a
    // websocket can't use that proxy — it needs an absolute origin. Prefer an
    // explicit env var, otherwise fall back to the known backend in prod and to
    // the local dev server otherwise. (Pointing at localhost in prod is why live
    // updates never arrived and users had to refresh.)
    const SOCKET_URL =
        import.meta.env.VITE_API_URL ||
        (import.meta.env.PROD
            ? 'https://home-game-manager-production.up.railway.app'
            : 'http://localhost:3002')

    const DEFAULT_FORM = {
            name: '',
            buyIn: ''
        }
    function GamePage() {
        const { id } = useParams()
        const [game, setGame] = useState()
        const [players, setPlayers] = useState([])
        const [view, setView] = useState('entry')
        const [pin, setPin] = useState('')
        const [error, setError] = useState(null)
        const [currentPlayer, setCurrentPlayer] = useState(null)
        const [topOff, setTopOff] = useState('')


        const [playersForm, setPlayersForm] = useState(DEFAULT_FORM)
        const [transactions, setTransactions] = useState([])
        const [cashOut, setCashOut] = useState('')
        const [previousView, setPreviousView] = useState(null)
        const [linkCopied, setLinkCopied] = useState(false)
        const [toast, setToast] = useState(null)
        const [confirmDeletePlayer, setConfirmDeletePlayer] = useState(null)
        const [historyPlayer, setHistoryPlayer] = useState(null)
        const [showClaimList, setShowClaimList] = useState(false)

        // Socket listeners are attached once per game id; use a ref so those
        // closures can see the *current* player without re-subscribing.
        const currentPlayerRef = useRef(null)
        useEffect(() => { currentPlayerRef.current = currentPlayer }, [currentPlayer])

        const toastTimer = useRef(null)
        const lastToastRef = useRef({ message: null, at: 0 })
        function showToast(message) {
            if (!message) return
            // Same message twice within 4s = a duplicate (e.g. the cash-flow
            // warning arriving over both the socket and the HTTP response).
            const now = Date.now()
            if (lastToastRef.current.message === message && now - lastToastRef.current.at < 4000) return
            lastToastRef.current = { message, at: now }
            setToast(message)
            window.clearTimeout(toastTimer.current)
            toastTimer.current = window.setTimeout(() => setToast(null), 2800)
        }

        // A player is locked once their cash-out is approved. Use the server flag
        // when present, but also derive it from transactions so this still works
        // before migrate.js adds players.cashed_out.
        const myCashouts = currentPlayer
            ? transactions.filter(t => t.player_id === currentPlayer.id && t.type === 'cashout')
            : []
        const isCashedOut = Boolean(currentPlayer?.cashed_out) || myCashouts.some(t => t.status === 'approved')
        const myPendingCashout = myCashouts.some(t => t.status === 'pending')

        useEffect(() => {
            if (!id) return

            const socket = io(SOCKET_URL)
            socket.emit('join-game', id)

            socket.on('transaction-added', (transaction) => {
                setTransactions(prev =>
                    prev.some(t => t.id === transaction.id) ? prev : [...prev, transaction]
                )
            })

            socket.on('transaction-updated', (transaction) => {
                setTransactions(prev => prev.map(t => t.id === transaction.id ? transaction : t))
            })

            socket.on('transaction-deleted', ({ id: deletedId }) => {
                setTransactions(prev => prev.filter(t => t.id !== deletedId))
            })

            socket.on('player-added', (player) => {
                setPlayers(prev =>
                    prev.some(p => p.id === player.id) ? prev : [...prev, player]
                )
            })

            socket.on('player-updated', (player) => {
                setPlayers(prev => prev.map(p => p.id === player.id ? player : p))
                if (currentPlayerRef.current && currentPlayerRef.current.id === player.id) {
                    setCurrentPlayer(player)
                    localStorage.setItem(`player_${id}`, JSON.stringify(player))
                }
            })

            // Primary delivery for the cash-flow warning: same real-time channel
            // that already reliably delivers the approval itself. Only the host
            // acts on it. Deduped against the copy handleApprove may also show.
            socket.on('cashflow-warning', ({ warning }) => {
                if (warning && localStorage.getItem(`host_${id}`)) showToast(warning)
            })

            socket.on('player-deleted', ({ id: deletedId }) => {
                setPlayers(prev => prev.filter(p => p.id !== deletedId))
                setTransactions(prev => prev.filter(t => t.player_id !== deletedId))

                if (currentPlayerRef.current && currentPlayerRef.current.id === deletedId) {
                    localStorage.removeItem(`player_${id}`)
                    setCurrentPlayer(null)
                    setHistoryPlayer(null)
                    if (!localStorage.getItem(`host_${id}`)) {
                        setView('entry')
                        showToast('Your session was removed by the host')
                    }
                }
            })

            return () => {
                socket.disconnect()
            }
        }, [id])

        useEffect(() => {
            let cancelled = false

            // Restore the saved session immediately from localStorage so a slow or
            // failed players fetch can never drop a valid session (the old code only
            // restored inside the fetch's .then, so any hiccup logged the player out).
            const saved = localStorage.getItem(`player_${id}`)
            if (saved) {
                try {
                    const parsed = JSON.parse(saved)
                    if (parsed && parsed.id != null) {
                        setCurrentPlayer(parsed)
                        setView('player')
                    }
                } catch {
                    localStorage.removeItem(`player_${id}`)
                }
            }
            if (localStorage.getItem(`host_${id}`)) {
                setView('host')
            }

            fetch(`/api/games/${id}`)
                .then(res => res.json())
                .then(data => { if (!cancelled) setGame(data) })
                .catch(() => {})

            fetch(`/api/players/${id}`)
                .then(res => (res.ok ? res.json() : Promise.reject(new Error('players fetch failed'))))
                .then(data => {
                    if (cancelled || !Array.isArray(data)) return
                    setPlayers(data)

                    // Only reconcile against a *confirmed* list: if the saved player
                    // genuinely no longer exists, clear the session; otherwise keep it.
                    const savedRaw = localStorage.getItem(`player_${id}`)
                    if (!savedRaw) return
                    try {
                        const parsed = JSON.parse(savedRaw)
                        if (data.some(p => p.id === parsed.id)) {
                            setCurrentPlayer(parsed)
                        } else {
                            localStorage.removeItem(`player_${id}`)
                            setCurrentPlayer(null)
                            if (!localStorage.getItem(`host_${id}`)) setView('entry')
                        }
                    } catch {
                        localStorage.removeItem(`player_${id}`)
                    }
                })
                .catch(() => { /* transient failure: keep the optimistic session */ })

            fetch(`/api/transactions/${id}`)
                .then(res => res.json())
                .then(data => { if (!cancelled && Array.isArray(data)) setTransactions(data) })
                .catch(() => {})

            return () => { cancelled = true }
        }, [id])

        function handleChange(e) {
            const { name, value} = e.target
            setPlayersForm(prev => ({...prev, [name]: value}))
        }
        async function handleSubmit(e) {
            e.preventDefault()


            const response = await fetch('/api/players', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({...playersForm, game_id: id})

            })


            const data = await response.json()
            setCurrentPlayer(data)
            localStorage.setItem(`player_${id}`, JSON.stringify(data))



            const response2 = await fetch('/api/transactions', {
                method: 'POST',
                headers: {'Content-Type' : 'application/json'},
                body: JSON.stringify({
                    player_id: data.id,
                    game_id: id,
                    amount: Number(playersForm.buyIn),
                    type: 'buyin',
                    status: 'approved'
                })
            })

            await response2.json()

            setPlayersForm(DEFAULT_FORM)

        }

        function handlePinSubmit() {
            if (game.pin === pin) {
                setView('host')
                localStorage.setItem(`host_${id}`, true)
            }
            else {
                setError('Incorrect PIN try again')
            }

        }

        function claimPlayer(player) {
            // Reconnect to an existing player record (lost localStorage / new
            // device). Same persistence path as handleSubmit after a new signup.
            setCurrentPlayer(player)
            localStorage.setItem(`player_${id}`, JSON.stringify(player))
            setShowClaimList(false)
            setView('player')
            showToast(`Welcome back, ${player.name}`)
        }

        async function handleTopOff() {
            if (isCashedOut || myPendingCashout) return
            const response = await fetch('/api/transactions', {
                method: 'POST',
                headers: {'Content-type' : 'application/json'},
                body: JSON.stringify({
                    player_id: currentPlayer.id,
                    game_id: id,
                    amount: Number(topOff),
                    type: 'topoff',
                    status: 'pending'
                })
            })

            await response.json()

            setTopOff('')
        }

        async function handleCashOutSubmit() {
            if (isCashedOut || myPendingCashout) { setView(previousView); return }
            const response = await fetch('/api/transactions', {
                method: 'POST',
                headers: {'Content-type' : 'application/json'},
                body: JSON.stringify({
                    player_id: currentPlayer.id,
                    game_id: id,
                    amount: Number(cashOut),
                    type: 'cashout',
                    status: 'pending'
                })
            })

            await response.json()

            setCashOut('')
            setView(previousView)
        }
        async function handleApprove(transactionId) {
            const res = await fetch(`/api/transactions/${transactionId}`, {
                method: 'PATCH',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ status: 'approved' })
            })

            let body = null
            try {
                body = await res.json()
            } catch (err) {
                console.error('[handleApprove] could not read response body', res.status, err)
            }

            if (!res.ok) {
                console.error('[handleApprove] approval failed', res.status, body)
                return
            }

            console.log('[handleApprove] ok', body)
            // Backup path — the warning normally arrives over the socket
            // ('cashflow-warning'); showToast dedupes so this is harmless.
            if (body && body.warning) showToast(body.warning)
        }

        async function handleReject(transactionId) {
            await fetch(`/api/transactions/${transactionId}`, {
                method: 'PATCH',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ status: 'rejected' })
            })
            showToast('Request rejected')
        }

        async function handleUpdateAmount(transactionId, amount) {
            const res = await fetch(`/api/transactions/${transactionId}`, {
                method: 'PATCH',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ amount })
            })
            if (!res.ok) {
                const body = await res.json().catch(() => ({}))
                showToast(body.error || 'Could not update amount')
                return
            }
            const updated = await res.json()
            // The socket broadcast also updates state, but update locally too so
            // the host sees the correction immediately.
            setTransactions(prev => prev.map(t => t.id === updated.id ? updated : t))
            showToast('Amount updated')
        }

        async function handleShare() {
            const url = `${window.location.origin}/game/${id}`

            if (navigator.share) {
                try {
                    await navigator.share({ title: `${game.location} — Poker Game`, text: 'Join my poker game', url })
                } catch {
                    // user dismissed the share sheet
                }
                return
            }

            await navigator.clipboard.writeText(url)
            setLinkCopied(true)
            setTimeout(() => setLinkCopied(false), 2000)
        }

        async function confirmDelete() {
            const player = confirmDeletePlayer
            if (!player) return
            setConfirmDeletePlayer(null)

            const isSelf = currentPlayer && currentPlayer.id === player.id

            const res = await fetch(`/api/players/${player.id}`, {method: 'DELETE'})

            if (!res.ok && res.status !== 404) {
                showToast('Could not remove player')
                return
            }

            // Update locally right away (don't wait on the socket round-trip).
            setPlayers(prev => prev.filter(p => p.id !== player.id))
            setTransactions(prev => prev.filter(t => t.player_id !== player.id))
            if (historyPlayer && historyPlayer.id === player.id) setHistoryPlayer(null)

            if (isSelf) {
                localStorage.removeItem(`player_${id}`)
                setCurrentPlayer(null)
                setView(localStorage.getItem(`host_${id}`) ? 'host' : 'entry')
                showToast('You left the game')
            } else {
                showToast(`Removed ${player.name}`)
            }
        }

        if (!game) return <div className="loading-screen"><span className="spinner"></span>Loading table…</div>




        const toastEl = toast && <div className="toast">{toast}</div>

        if (view === 'entry') {
            return (
                <>
                    {toastEl}
                    <GameEntry onSelectHost={() => setView('pin')} onSelectPlayer={() => setView('player')}/>
                </>
            )
        }

        if (view === 'pin') return (
            <div className="screen-center">
                {toastEl}
                <div className="pin-card">
                    <div className="brand-mark" style={{ marginBottom: 0 }}>🔒</div>
                    <h2>Enter Host PIN</h2>
                    <p className="pin-card__sub">Only the host has this code</p>
                    <input
                        className="pin-input"
                        type="text"
                        inputMode="numeric"
                        placeholder="••••"
                        name="pin"
                        value={pin}
                        onChange={e => setPin(e.target.value)}
                    />
                    {error && <p className="pin-error">{error}</p>}
                    <button className="btn btn-primary btn-block" onClick={handlePinSubmit}>Unlock Host View</button>
                </div>
            </div>
        )

        if (view === 'cashOut' && (isCashedOut || myPendingCashout)) return (
            <div className="screen-center">
                {toastEl}
                <div className="cashout-card">
                    <h1>{isCashedOut ? 'Already Cashed Out' : 'Cash-Out Pending'}</h1>
                    <p className="cashout-card__sub">
                        {isCashedOut
                            ? 'Your cash-out has already been approved.'
                            : 'You already have a cash-out waiting for host approval.'}
                    </p>
                    <button className="btn btn-secondary btn-block" onClick={() => setView(previousView || 'player')}>Back</button>
                </div>
            </div>
        )

        if (view === 'cashOut') return (
            <div className="screen-center">
                {toastEl}
                <div className="cashout-card">
                    <h1>Cash Out</h1>
                    <p className="cashout-card__sub">Enter your final stack to request a cash out</p>
                    <div className="cashout-input-wrap">
                        <span>$</span>
                        <input
                            className="cashout-input"
                            type="number"
                            placeholder="0"
                            name="stack"
                            value={cashOut}
                            onChange={e => setCashOut(e.target.value)}
                        />
                    </div>
                    <div className="btn-column">
                        <button className="btn btn-primary btn-block" onClick={handleCashOutSubmit}>Submit Cash Out</button>
                        <button className="btn btn-secondary btn-block" onClick={() => setView(previousView)}>Back</button>
                    </div>
                </div>
            </div>
        )

        const pendingTransactions = transactions.filter(t => t.status === 'pending')
        const feedTransactions = [...transactions].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        const typeIcon = { buyin: '💵', topoff: '🔄', cashout: '💰' }
        const formatMoney = n => `$${Number(n).toLocaleString()}`

        // ----- cash flow summary (host) -----
        const approvedTx = transactions.filter(t => t.status === 'approved')
        const totalIn = approvedTx
            .filter(t => t.type !== 'cashout')
            .reduce((sum, t) => sum + Number(t.amount), 0)
        const totalOut = approvedTx
            .filter(t => t.type === 'cashout')
            .reduce((sum, t) => sum + Number(t.amount), 0)
        const netCashFlow = totalOut - totalIn // 0 when every chip is accounted for

    return (
        <div className="app-shell">
            {toastEl}
            <div className="game-header">
                <div className="game-header__info">
                    <span className="game-header__location">{game.location}</span>
                    <span className="game-header__date">{game.date}</span>
                </div>
                {view === 'host' && (
                    <div className="game-header__actions">
                        <button className="icon-btn icon-btn--neutral" onClick={handleShare} aria-label="Share game link">
                            {linkCopied ? '✓' : '🔗'}
                        </button>
                        <span className="role-badge role-badge--host">👑 Host</span>
                    </div>
                )}
                {view === 'player' && currentPlayer && <span className="role-badge role-badge--player">🂡 {currentPlayer.name}</span>}
            </div>

            <div className="page-content">
                {view === 'host' && (
                    <div className="summary-bar">
                        <div className="summary-stat">
                            <span className="summary-stat__label">Buy-ins</span>
                            <span className="summary-stat__value">{formatMoney(totalIn)}</span>
                        </div>
                        <div className="summary-stat">
                            <span className="summary-stat__label">Cash-outs</span>
                            <span className="summary-stat__value">{formatMoney(totalOut)}</span>
                        </div>
                        <div className="summary-stat">
                            <span className="summary-stat__label">{netCashFlow === 0 ? 'Settled' : 'On table'}</span>
                            <span className={`summary-stat__value ${netCashFlow < 0 ? 'summary-stat__value--negative' : 'summary-stat__value--positive'}`}>
                                {formatMoney(Math.abs(netCashFlow))}
                            </span>
                        </div>
                    </div>
                )}

                {currentPlayer ? (
                    isCashedOut ? (
                        <div className="action-panel action-panel--locked">
                            <div className="action-panel__title">You're Cashed Out</div>
                            <p className="action-panel__note">Your cash-out has been approved — your night is settled. See you next game.</p>
                        </div>
                    ) : myPendingCashout ? (
                        <div className="action-panel action-panel--locked">
                            <div className="action-panel__title">Cash-Out Requested</div>
                            <p className="action-panel__note">Waiting for the host to approve your cash-out. Top-offs are paused.</p>
                        </div>
                    ) : (
                        <div className="action-panel">
                            <div className="action-panel__title">Top Off Your Stack</div>
                            <div className="action-panel__row">
                                <input
                                    className="form-input"
                                    type="number"
                                    placeholder="Amount"
                                    value={topOff}
                                    onChange={e => setTopOff(e.target.value)}
                                />
                            </div>
                            <div className="action-panel__buttons">
                                <button className="btn btn-primary" type="submit" onClick={handleTopOff}>Top Off</button>
                                <button className="btn btn-outline-danger" onClick={() => { setPreviousView(view); setView('cashOut')}}>Cash Out</button>
                            </div>
                        </div>
                    )
                ): (
                    <div>
                        <form className="form-card" onSubmit={handleSubmit}>
                            <h2>Add a Player</h2>
                            <div className="form-group">
                                <label className="form-label" htmlFor="name">Name</label>
                                <input className="form-input" id="name" type="text" name="name" placeholder="Player name" value={playersForm.name} onChange={handleChange}></input>
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="buyIn">Buy-in</label>
                                <input className="form-input" id="buyIn" type="number" name="buyIn" placeholder="0" value={playersForm.buyIn} onChange={handleChange}></input>
                            </div>
                            <button className="btn btn-primary btn-block" type="submit">Add Player</button>
                        </form>

                        {players.length > 0 && (
                            <div className="claim-block">
                                <button className="link-btn" onClick={() => setShowClaimList(v => !v)}>
                                    {showClaimList ? 'Never mind' : 'Already joined? Tap your name'}
                                </button>

                                {showClaimList && (
                                    <div className="claim-list">
                                        {players.map(p => (
                                            <button key={p.id} className="claim-item" onClick={() => claimPlayer(p)}>
                                                <span className="claim-item__avatar">{p.name?.[0]?.toUpperCase() || '?'}</span>
                                                <span className="claim-item__name">{p.name}</span>
                                                {p.cashed_out && <span className="claim-item__tag">cashed out</span>}
                                                <span className="claim-item__chevron">›</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                <div>
                    <div className="section-title">
                        <h2>🪑 Players</h2>
                        <span className="section-count">{players.length}</span>
                    </div>

                    {players.length === 0 ? (
                        <div className="empty-state">No players yet</div>
                    ) : (
                        <div className="player-list">
                            {players.map(p => {
                                const playerTransactions = transactions.filter(t => t.player_id === p.id && t.status === 'approved' && t.type !== 'cashout')
                                const totalBuyIn = playerTransactions.reduce((sum,  t) => sum + Number(t.amount), 0)
                                const approvedCashOut = transactions.find(t => t.player_id === p.id && t.status === 'approved' && t.type === 'cashout')
                                const profit = approvedCashOut ? approvedCashOut.amount - totalBuyIn : null
                                const isSelf = currentPlayer && p.id === currentPlayer.id

                                return(

                                    <div key={p.id} className={`player-card${isSelf ? ' player-card--self' : ''}`}>
                                        <div className="player-card__avatar">{p.name?.[0]?.toUpperCase() || '?'}</div>
                                        <div className="player-card__info">
                                            <span className="player-card__name">
                                                {p.name}
                                                {isSelf && <span className="player-card__you">You</span>}
                                            </span>
                                            <span className="player-card__buyin">Buy-in {formatMoney(totalBuyIn)}</span>
                                        </div>
                                        <div className="player-card__right">
                                            {profit !== null && (
                                                <span className={`profit-pill ${profit > 0 ? 'profit-pill--positive' : profit < 0 ? 'profit-pill--negative' : 'profit-pill--neutral'}`}>
                                                    {profit > 0 ? '+' : ''}{formatMoney(profit)}
                                                </span>
                                            )}
                                            {view === 'host' && (
                                                <>
                                                    <button className="icon-btn icon-btn--neutral" onClick={() => setHistoryPlayer(p)} aria-label={`Edit ${p.name}'s transactions`}>✎</button>
                                                    <button className="icon-btn" onClick={() => setConfirmDeletePlayer(p)} aria-label={`Remove ${p.name}`}>✕</button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )

                            })}
                        </div>
                    )}
                </div>

                {view === 'host' && (
                    <div className="pending-section">
                        <div className="section-title">
                            <h2>⏳ Pending Approvals</h2>
                            {pendingTransactions.length > 0 && <span className="pending-count">{pendingTransactions.length}</span>}
                        </div>
                        {pendingTransactions.length === 0 ? (
                            <div className="empty-state">Nothing waiting on you</div>
                        ) : (
                            <div className="pending-list">
                                {pendingTransactions.map(t => {
                                    const player = players.find(p => p.id === t.player_id)
                                    return(
                                        <div key={t.id} className="pending-item">
                                            <div className="pending-item__info">
                                                <span className="pending-item__name">{player?.name}</span>
                                                <span className="pending-item__meta">
                                                    <span className={`type-badge type-badge--${t.type}`}>{t.type}</span>
                                                    {formatMoney(t.amount)}
                                                </span>
                                            </div>
                                            <div className="pending-item__actions">
                                                <button className="btn btn-approve" onClick={() => handleApprove(t.id)}>Approve</button>
                                                <button className="btn btn-reject" onClick={() => handleReject(t.id)}>Reject</button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}

                <div>
                    <div className="section-title">
                        <h2>📜 Transaction Feed</h2>
                    </div>
                    {feedTransactions.length === 0 ? (
                        <div className="empty-state">No transactions yet</div>
                    ) : (
                        <div className="feed-list">
                            {feedTransactions.map(t => {
                                const player = players.find(p => p.id === t.player_id)
                                return (
                                    <div key={t.id} className={`feed-item feed-item--${t.status}`}>
                                        <div className="feed-item__icon">{typeIcon[t.type] || '•'}</div>
                                        <div className="feed-item__body">
                                            <div className="feed-item__top">
                                                <span className="feed-item__name">{player?.name}</span>
                                                <span className="feed-item__time">{new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <div className="feed-item__desc">
                                                <span className={`type-badge type-badge--${t.type}`}>{t.type}</span>
                                                <span className="feed-item__amount">{formatMoney(t.amount)}</span>
                                                <span className={`status-pill status-pill--${t.status}`}>{t.status}</span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            {confirmDeletePlayer && (
                <div className="modal-overlay" onClick={() => setConfirmDeletePlayer(null)}>
                    <div className="modal-card modal-card--sm" onClick={e => e.stopPropagation()}>
                        <h2>Remove {confirmDeletePlayer.name}?</h2>
                        <p className="modal-subtitle">This also deletes their buy-ins and transactions. This can't be undone.</p>
                        <div className="btn-column">
                            <button className="btn btn-outline-danger btn-block" onClick={confirmDelete}>Remove player</button>
                            <button className="btn btn-secondary btn-block" onClick={() => setConfirmDeletePlayer(null)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {historyPlayer && (
                <PlayerTransactionsModal
                    player={historyPlayer}
                    transactions={transactions}
                    onClose={() => setHistoryPlayer(null)}
                    onUpdateAmount={handleUpdateAmount}
                    onApprove={handleApprove}
                    onReject={handleReject}
                />
            )}
        </div>

        )

    }

    export default GamePage
