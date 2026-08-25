    import { useParams } from "react-router-dom"
    import { useEffect, useState } from "react"
    import GameEntry from './GameEntry.jsx'  
    import { io } from 'socket.io-client'
        
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


        useEffect(() => {
            const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3002')
            socket.emit('join-game', id)

            socket.on('transaction-added', (transaction) => {
                setTransactions(prev => [...prev, transaction])
            })

            socket.on('transaction-updated', (transaction) => {
                setTransactions(prev => prev.map(t => t.id === transaction.id ? transaction : t))
            })

            socket.on('player-added', (player) => {
                setPlayers(prev => [...prev, player])
            })

            socket.on('player-deleted', (player) => {
                setPlayers(prev => prev.filter(player => player.id !== playerId))
            })

            return () => {
                socket.disconnect()
            }
        }, [])
        useEffect(() => {
            fetch(`/api/games/${id}`)
            .then(res => res.json())
            .then(data => setGame(data) )

            fetch(`/api/players/${id}`)
            .then(res => res.json())
            .then(data => { 
                setPlayers(data)
                
                const saved = localStorage.getItem(`player_${id}`)

                const hostSaved = localStorage.getItem(`host_${id}`)
                if (saved) {

                    const parsed = JSON.parse(saved)
                    if (data.find(p => p.id === parsed.id)) { //checks to see if the player in localStorage is still in database
                         setCurrentPlayer(JSON.parse(saved))
                         setView('player')

                    } else {
                        localStorage.removeItem(`player_${id}`)
                    }
                   
                } 

                if (hostSaved) {
                    setView('host')
                }

            })

            fetch(`/api/transactions/${id}`)
            .then(res => res.json())
            .then(data => setTransactions(data) )

            



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

            const transactionData = await response2.json()
            
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

        async function handleTopOff() {
            const response = await fetch('/api/transactions', {
                method: 'POST',
                headers: {'Content-type' : 'application/json'},
                body: JSON.stringify({
                    player_id: currentPlayer.id,
                    game_id: id,
                    amount: topOff,
                    type: 'topoff',
                    status: 'pending'
                })
            })

            const data = await response.json()
            
            setTopOff('')
        }

        async function handleCashOutSubmit() {
            const response = await fetch('/api/transactions', {
                method: 'POST',
                headers: {'Content-type' : 'application/json'},
                body: JSON.stringify({
                    player_id: currentPlayer.id,
                    game_id: id,
                    amount: cashOut,
                    type: 'cashout',
                    status: 'pending'
                })
            })

            const data = await response.json()
            
            setCashOut('')
            setView(previousView)
        }
        async function handleApprove(transactionId) {
            await fetch(`/api/transactions/${transactionId}`, {method: 'PATCH'} )

            
        }

        async function handleShare() {
            const url = `${window.location.origin}/game/${id}`

            if (navigator.share) {
                try {
                    await navigator.share({ title: `${game.location} — Poker Game`, text: 'Join my poker game', url })
                } catch (err) {
                    // user dismissed the share sheet
                }
                return
            }

            await navigator.clipboard.writeText(url)
            setLinkCopied(true)
            setTimeout(() => setLinkCopied(false), 2000)
        }

        async function deletePlayer(playerId) {
            await fetch(`/api/players/${playerId}`, {method: 'DELETE'})
            
            localStorage.removeItem(`player_${id}`)
            setCurrentPlayer(null)
        }

        if (!game) return <div className="loading-screen"><span className="spinner"></span>Loading table…</div>





        if (view === 'entry') {
            return <GameEntry onSelectHost ={() => setView('pin')} onSelectPlayer = {() => setView('player')}/>
        }

        if (view === 'pin') return (
            <div className="screen-center">
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

        if (view === 'cashOut') return (
            <div className="screen-center">
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

    return (
        <div className="app-shell">
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
                {currentPlayer ? (
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
                ): (
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
                                const totalBuyIn = playerTransactions.reduce((sum,  t) => sum + t.amount, 0)
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
                                                <button className="icon-btn" onClick={() => deletePlayer(p.id)} aria-label={`Remove ${p.name}`}>✕</button>
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
                                            <button className="btn btn-approve" onClick={() => handleApprove(t.id)}>Approve</button>
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
        </div>

        )

    }

    export default GamePage