    import { useParams, useNavigate } from "react-router-dom"
    import { useEffect, useRef, useState } from "react"
    import PlayerTransactionsModal from './PlayerTransactionsModal.jsx'
    import { io } from 'socket.io-client'
    import { authHeaders, getCurrentUserId } from "../utils/authHeaders.js"
    import { formatMoney, formatSigned, formatGameDate, formatTime } from "../utils/format.js"
    import {
        IconChevronLeft, IconLink, IconCheck, IconEdit, IconTrash, IconPlus,
        IconChips, IconFlag, IconUser, IconInbox, IconClock, IconSpade,
    } from './Icons.jsx'


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
            buyIn: ''
        }

    const TYPE_ICON = { buyin: IconPlus, topoff: IconChips, cashout: IconFlag }

    function GamePage() {
        const { id } = useParams()
        const navigate = useNavigate()
        const [game, setGame] = useState()
        const [players, setPlayers] = useState([])
        const [view, setView] = useState('main')
        const [topOff, setTopOff] = useState('')


        const [playersForm, setPlayersForm] = useState(DEFAULT_FORM)
        const [transactions, setTransactions] = useState([])
        const [cashOut, setCashOut] = useState('')
        const [previousView, setPreviousView] = useState(null)
        const [linkCopied, setLinkCopied] = useState(false)
        const [toast, setToast] = useState(null)
        const [confirmDeletePlayer, setConfirmDeletePlayer] = useState(null)
        const [historyPlayer, setHistoryPlayer] = useState(null)
        const [needsLogin, setNeedsLogin] = useState(false)
        const myUserId = getCurrentUserId()

        // Identity is now derived from the logged-in account rather than
        // localStorage: whichever player row (if any) belongs to this user.
        const currentPlayer = players.find(p => p.user_id === myUserId) || null
        const isHost = game?.created_by_user_id === myUserId

        // Socket listeners are attached once per game id; use refs so those
        // closures can see the *current* player/host status without re-subscribing.
        const currentPlayerRef = useRef(null)
        useEffect(() => { currentPlayerRef.current = currentPlayer }, [currentPlayer])

        const isHostRef = useRef(false)
        useEffect(() => { isHostRef.current = isHost }, [isHost])

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
            })

            socket.on('game-updated', (game) => {
                setGame(game)
            })

            // Primary delivery for the cash-flow warning: same real-time channel
            // that already reliably delivers the approval itself. Only the host
            // acts on it. Deduped against the copy handleApprove may also show.
            socket.on('cashflow-warning', ({ warning }) => {
                if (warning && isHostRef.current) showToast(warning)
            })

            socket.on('player-deleted', ({ id: deletedId }) => {
                const wasMe = currentPlayerRef.current && currentPlayerRef.current.id === deletedId

                setPlayers(prev => prev.filter(p => p.id !== deletedId))
                setTransactions(prev => prev.filter(t => t.player_id !== deletedId))

                if (wasMe && !isHostRef.current) {
                    showToast('Your session was removed by the host')
                }
            })

            return () => {
                socket.disconnect()
            }
        }, [id])

        useEffect(() => {
            let cancelled = false

            fetch(`/api/games/${id}`, {
                headers: authHeaders()
            })
                .then(res => {
                    if (res.status === 401) {
                        setNeedsLogin(true)
                    }
                    return res.ok ? res.json() : Promise.reject(new Error('games fetch failed'))
                })
                .then(data => { if (!cancelled) setGame(data) })
                .catch(() => {})

            fetch(`/api/players/${id}`, {
                headers: authHeaders()
            })
                .then(res => (res.ok ? res.json() : Promise.reject(new Error('players fetch failed'))))
                .then(data => {
                    if (cancelled || !Array.isArray(data)) return
                    setPlayers(data)
                })
                .catch(() => {})

            fetch(`/api/transactions/${id}`, {
                headers: authHeaders()
            })
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
                headers: {'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({ game_id: id, user_id: myUserId })

            })


            const data = await response.json()
            // Optimistic local update — the 'player-added' socket event will also
            // deliver this, but the dedupe check makes that a no-op.
            setPlayers(prev => prev.some(p => p.id === data.id) ? prev : [...prev, data])



            const response2 = await fetch('/api/transactions', {
                method: 'POST',
                headers: {'Content-Type' : 'application/json', ...authHeaders() },
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

        async function handleTopOff() {
            if (isCashedOut || myPendingCashout) return
            const response = await fetch('/api/transactions', {
                method: 'POST',
                headers: {'Content-type' : 'application/json', ...authHeaders()},
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
                headers: {'Content-type' : 'application/json', ...authHeaders()},
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
                headers: {'Content-Type': 'application/json', ...authHeaders()},
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
                headers: {'Content-Type': 'application/json', ...authHeaders()},
                body: JSON.stringify({ status: 'rejected' })
            })
            showToast('Request rejected')
        }

        async function handleUpdateAmount(transactionId, amount) {
            const res = await fetch(`/api/transactions/${transactionId}`, {
                method: 'PATCH',
                headers: {'Content-Type': 'application/json', ...authHeaders()},
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

            const res = await fetch(`/api/players/${player.id}`, {
                method: 'DELETE',
                headers: authHeaders()}, )

            if (!res.ok && res.status !== 404) {
                showToast('Could not remove player')
                return
            }

            // Update locally right away (don't wait on the socket round-trip).
            setPlayers(prev => prev.filter(p => p.id !== player.id))
            setTransactions(prev => prev.filter(t => t.player_id !== player.id))
            if (historyPlayer && historyPlayer.id === player.id) setHistoryPlayer(null)

            if (isSelf) {
                showToast('You left the game')
            } else {
                showToast(`Removed ${player.name}`)
            }
        }

        async function handleEndGame() {
            const res = await fetch(`/api/games/${id}`, {
                method: 'PATCH',
                headers: {'Content-Type': 'application/json', ...authHeaders()}
            })
            const updated = await res.json()
            setGame(updated)

        }
        if (needsLogin) {
            return (
                <main className="page page--narrow page--center">
                    <div className="empty">
                        <span className="empty__icon"><IconSpade size={22} /></span>
                        <span className="empty__title">Sign in to join this game</span>
                        <span className="empty__text">
                            Rebuy uses your Google account to know which player is you, so your
                            buy-ins follow you across devices.
                        </span>
                        <a
                            className="btn btn--primary"
                            href={`https://home-game-manager-production.up.railway.app/api/auth/google?redirect=/game/${id}`}
                        >
                            Sign in with Google
                        </a>
                    </div>
                </main>
            )
        }

        if (!game) return (
            <main className="page">
                <div className="loading"><span className="spinner" />Loading table…</div>
            </main>
        )

        const toastEl = toast && <div className="toast">{toast}</div>

        if (view === 'cashOut' && (isCashedOut || myPendingCashout)) return (
            <main className="page page--narrow page--center">
                {toastEl}
                <div className="card form">
                    <div className="page__titles">
                        <h1 className="page__title">{isCashedOut ? 'Already cashed out' : 'Cash-out pending'}</h1>
                        <p className="page__sub">
                            {isCashedOut
                                ? 'Your cash-out has already been approved — your night is settled.'
                                : 'You already have a cash-out waiting for the host to approve.'}
                        </p>
                    </div>
                    <button className="btn btn--secondary btn--block" onClick={() => setView(previousView || 'main')}>Back to table</button>
                </div>
            </main>
        )

        if (view === 'cashOut') return (
            <main className="page page--narrow page--center">
                {toastEl}
                <div className="card form">
                    <div className="page__titles">
                        <h1 className="page__title">Cash out</h1>
                        <p className="page__sub">
                            Count your chips and enter the total. The host approves it before it
                            lands in the ledger.
                        </p>
                    </div>

                    <div className="amount-field">
                        <span className="amount-field__prefix">$</span>
                        <input
                            className="amount-input"
                            type="number"
                            placeholder="0"
                            name="stack"
                            aria-label="Final stack"
                            value={cashOut}
                            onChange={e => setCashOut(e.target.value)}
                        />
                    </div>

                    <div className="modal__actions">
                        <button className="btn btn--primary btn--lg btn--block" onClick={handleCashOutSubmit}>Submit cash-out</button>
                        <button className="btn btn--ghost btn--block" onClick={() => setView(previousView)}>Cancel</button>
                    </div>
                </div>
            </main>
        )

        const pendingTransactions = transactions.filter(t => t.status === 'pending')
        const feedTransactions = [...transactions].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

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
        <main className="page">
            {toastEl}

            <header className="page__head">
                <button className="page__back" onClick={() => navigate('/games')}>
                    <IconChevronLeft size={16} />
                    Games
                </button>
                <div className="page__bar">
                    <div className="page__titles">
                        <span className="page__eyebrow">
                            {game.is_active === false ? 'Finished session' : 'Live session'}
                        </span>
                        <h1 className="page__title">{game.location || 'Untitled game'}</h1>
                        <p className="page__sub">
                            {formatGameDate(game.date)}
                            {game.is_active === false
                                ? <> · <span className="tag tag--ended">Game ended</span></>
                                : <> · <span className="tag tag--live"><span className="dot dot--pulse" />Live</span></>}
                            {isHost && <> · <span className="tag tag--host">You're hosting</span></>}
                        </p>
                    </div>

                    {isHost && (
                        <div className="page__actions">
                            <button className="btn btn--secondary btn--sm" onClick={handleShare}>
                                {linkCopied ? <IconCheck size={16} /> : <IconLink size={16} />}
                                {linkCopied ? 'Copied' : 'Share'}
                            </button>
                            {game.is_active !== false && (
                                <button className="btn btn--danger btn--sm" onClick={handleEndGame}>
                                    End game
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </header>

            {isHost && (
                <div className="stat-strip">
                    <div className="stat-strip__item">
                        <span className="stat-strip__label">Buy-ins</span>
                        <span className="stat-strip__value">{formatMoney(totalIn)}</span>
                    </div>
                    <div className="stat-strip__item">
                        <span className="stat-strip__label">Cash-outs</span>
                        <span className="stat-strip__value">{formatMoney(totalOut)}</span>
                    </div>
                    <div className="stat-strip__item">
                        <span className="stat-strip__label">{netCashFlow === 0 ? 'Settled' : 'On table'}</span>
                        <span className={`stat-strip__value ${netCashFlow < 0 ? 'stat__value--up' : netCashFlow > 0 ? 'stat__value--down' : ''}`}>
                            {formatMoney(Math.abs(netCashFlow))}
                        </span>
                    </div>
                </div>
            )}

            <div className="game-grid">
                <div className="game-col">
                    {/* ---- your seat ---- */}
                    {currentPlayer ? (
                        isCashedOut ? (
                            <div className="panel panel--quiet">
                                <span className="panel__title">You're cashed out</span>
                                <p className="panel__note">
                                    Your cash-out has been approved — your night is settled. See you next game.
                                </p>
                            </div>
                        ) : myPendingCashout ? (
                            <div className="panel panel--warn">
                                <span className="panel__title">Cash-out requested</span>
                                <p className="panel__note">
                                    Waiting for the host to approve your cash-out. Top-offs are paused until they do.
                                </p>
                            </div>
                        ) : (
                            <div className="panel panel--accent">
                                <span className="panel__title">Top off your stack</span>
                                <p className="panel__note">
                                    Ask for more chips mid-game. The host approves the amount before it counts.
                                </p>
                                <div className="panel__row">
                                    <input
                                        className="input"
                                        type="number"
                                        placeholder="Amount"
                                        aria-label="Top-off amount"
                                        value={topOff}
                                        onChange={e => setTopOff(e.target.value)}
                                    />
                                </div>
                                <div className="panel__actions">
                                    <button className="btn btn--primary" type="submit" onClick={handleTopOff}>Top off</button>
                                    <button className="btn btn--danger" onClick={() => { setPreviousView(view); setView('cashOut')}}>Cash out</button>
                                </div>
                            </div>
                        )
                    ) : (
                        <form className="panel panel--accent" onSubmit={handleSubmit}>
                            <span className="panel__title">Take a seat</span>
                            <p className="panel__note">
                                You're joining as yourself — no name needed. Enter what you're buying in for
                                to get on the board.
                            </p>
                            <div className="field">
                                <label className="label" htmlFor="buyIn">Buy-in</label>
                                <input className="input" id="buyIn" type="number" name="buyIn" placeholder="0" value={playersForm.buyIn} onChange={handleChange}></input>
                            </div>
                            <button className="btn btn--primary btn--block" type="submit">Join game</button>
                        </form>
                    )}

                    {/* ---- players ---- */}
                    <section className="section">
                        <div className="section__head">
                            <h2 className="section__title">Players</h2>
                            <span className="section__count">{players.length}</span>
                        </div>

                        {players.length === 0 ? (
                            <div className="empty empty--sm">
                                <span className="empty__icon"><IconUser size={20} /></span>
                                <span className="empty__title">Nobody's sat down yet</span>
                                <span className="empty__text">
                                    {isHost
                                        ? 'Share the link — players join themselves with their own account.'
                                        : 'Buy in above to be the first.'}
                                </span>
                            </div>
                        ) : (
                            <div className="list">
                                {players.map(p => {
                                    const playerTransactions = transactions.filter(t => t.player_id === p.id && t.status === 'approved' && t.type !== 'cashout')
                                    const totalBuyIn = playerTransactions.reduce((sum,  t) => sum + Number(t.amount), 0)
                                    const approvedCashOut = transactions.find(t => t.player_id === p.id && t.status === 'approved' && t.type === 'cashout')
                                    const profit = approvedCashOut ? approvedCashOut.amount - totalBuyIn : null
                                    const isSelf = currentPlayer && p.id === currentPlayer.id

                                    return(

                                        <div key={p.id} className={`row${isSelf ? ' row--self' : ''}`}>
                                            <span className="avatar">{p.name?.[0]?.toUpperCase() || '?'}</span>
                                            <span className="row__body">
                                                <span className="row__title">
                                                    {p.name}
                                                    {isSelf && <span className="tag tag--you">You</span>}
                                                </span>
                                                <span className="row__meta">
                                                    Buy-in <span className="row__amount">{formatMoney(totalBuyIn)}</span>
                                                    {approvedCashOut && <><span className="row__dot">·</span>Cashed out</>}
                                                </span>
                                            </span>
                                            <span className="row__trail">
                                                {profit !== null && (
                                                    <span className={`pill ${profit > 0 ? 'pill--up' : profit < 0 ? 'pill--down' : 'pill--flat'}`}>
                                                        {formatSigned(profit)}
                                                    </span>
                                                )}
                                                {isHost && (
                                                    <>
                                                        <button className="iconbtn" onClick={() => setHistoryPlayer(p)} aria-label={`Edit ${p.name}'s transactions`}>
                                                            <IconEdit size={16} />
                                                        </button>
                                                        <button className="iconbtn iconbtn--danger" onClick={() => setConfirmDeletePlayer(p)} aria-label={`Remove ${p.name}`}>
                                                            <IconTrash size={16} />
                                                        </button>
                                                    </>
                                                )}
                                            </span>
                                        </div>
                                    )

                                })}
                            </div>
                        )}
                    </section>
                </div>

                <div className="game-col">
                    {/* ---- pending approvals (host) ---- */}
                    {isHost && (
                        <section className="section">
                            <div className="section__head">
                                <h2 className="section__title">Pending approvals</h2>
                                {pendingTransactions.length > 0 && (
                                    <span className="tag tag--pending">{pendingTransactions.length} waiting</span>
                                )}
                            </div>
                            <p className="hint hint--inline">
                                Top-offs and cash-outs need your sign-off before they hit the totals.
                            </p>

                            {pendingTransactions.length === 0 ? (
                                <div className="empty empty--sm">
                                    <span className="empty__icon"><IconInbox size={20} /></span>
                                    <span className="empty__title">Nothing waiting on you</span>
                                </div>
                            ) : (
                                <div className="list">
                                    {pendingTransactions.map(t => {
                                        const player = players.find(p => p.id === t.player_id)
                                        return(
                                            <div key={t.id} className="row">
                                                <span className="row__body">
                                                    <span className="row__title">{player?.name}</span>
                                                    <span className="row__meta">
                                                        <span className={`tag tag--${t.type}`}>{t.type}</span>
                                                        <span className="row__amount">{formatMoney(t.amount)}</span>
                                                    </span>
                                                </span>
                                                <span className="row__trail">
                                                    <button className="btn btn--approve btn--sm" onClick={() => handleApprove(t.id)}>Approve</button>
                                                    <button className="btn btn--reject btn--sm" onClick={() => handleReject(t.id)}>Reject</button>
                                                </span>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </section>
                    )}

                    {/* ---- transaction feed ---- */}
                    <section className="section">
                        <div className="section__head">
                            <h2 className="section__title">Activity</h2>
                            <span className="section__count">{feedTransactions.length}</span>
                        </div>

                        {feedTransactions.length === 0 ? (
                            <div className="empty empty--sm">
                                <span className="empty__icon"><IconClock size={20} /></span>
                                <span className="empty__title">No activity yet</span>
                                <span className="empty__text">
                                    Every buy-in, top-off and cash-out shows up here as it happens.
                                </span>
                            </div>
                        ) : (
                            <div className="feed">
                                {feedTransactions.map(t => {
                                    const player = players.find(p => p.id === t.player_id)
                                    const Icon = TYPE_ICON[t.type] || IconChips
                                    return (
                                        <div key={t.id} className={`feed__item feed__item--${t.status}`}>
                                            <span className="avatar avatar--sm avatar--muted"><Icon size={16} /></span>
                                            <div className="feed__body">
                                                <div className="feed__top">
                                                    <span className="feed__name">{player?.name}</span>
                                                    <span className="feed__time">{formatTime(t.created_at)}</span>
                                                </div>
                                                <div className="feed__desc">
                                                    <span className={`tag tag--${t.type}`}>{t.type}</span>
                                                    <span className="row__amount">{formatMoney(t.amount)}</span>
                                                    <span className={`tag tag--${t.status}`}>{t.status}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </section>
                </div>
            </div>

            {confirmDeletePlayer && (
                <div className="modal" onClick={() => setConfirmDeletePlayer(null)}>
                    <div className="modal__card" onClick={e => e.stopPropagation()}>
                        <div className="modal__head">
                            <div>
                                <h2 className="modal__title">Remove {confirmDeletePlayer.name}?</h2>
                                <span className="modal__sub">
                                    This also deletes their buy-ins and transactions. It can't be undone.
                                </span>
                            </div>
                        </div>
                        <div className="modal__actions">
                            <button className="btn btn--danger btn--block" onClick={confirmDelete}>Remove player</button>
                            <button className="btn btn--secondary btn--block" onClick={() => setConfirmDeletePlayer(null)}>Cancel</button>
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
        </main>

        )

    }

    export default GamePage
