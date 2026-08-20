    import { useParams } from "react-router-dom"
    import { useEffect, useState } from "react"
    import GameEntry from './GameEntry.jsx'  
        
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
            
            setPlayers(prev => [...prev, data])
            

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
            setTransactions(prev => [...prev, transactionData])
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
            setTransactions(prev => [...prev, data])
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
            setTransactions(prev => [...prev, data])
            setCashOut('')
            setView(previousView)
        }
        async function handleApprove(transactionId) {
            await fetch(`/api/transactions/${transactionId}`, {method: 'PATCH'} )

            setTransactions(prev => prev.map(t => t.id === transactionId ? {...t, status: 'approved' } :t))
        }

        async function deletePlayer(playerId) {
            await fetch(`/api/players/${playerId}`, {method: 'DELETE'})
            setPlayers(prev => prev.filter(player => player.id !== playerId))
            localStorage.removeItem(`player_${id}`)
            setCurrentPlayer(null)
        }

        if (!game) return <div>Loading...</div>



        

        if (view === 'entry') {
            return <GameEntry onSelectHost ={() => setView('pin')} onSelectPlayer = {() => setView('player')}/>
        }

        if (view === 'pin') return (
            <div>
                <h2>Enter the PIN</h2>
                <input type="text" name="pin" value={pin} onChange={e =>setPin(e.target.value)}/>
                <button onClick={handlePinSubmit}>Submit</button>
                {error && <p>{error}</p>}
            </div>
        )

        if (view === 'cashOut') return (
            <div>
                <h1>Cash Out</h1>
                <h2>Enter Stack</h2>
                <input type="number" name="stack" value={cashOut} onChange={e => setCashOut(e.target.value)}/>
                <button onClick={handleCashOutSubmit}>Submit</button>
                <button onClick={() => setView(previousView)}>Back</button>
            </div>
        )
        
        

        
        
    return (
        <div>
            {currentPlayer ? (
                <div>
                    <h2>top off</h2>
                    <input type="number" placeholder="Amount" value={topOff} onChange={e => setTopOff(e.target.value)}/>
                    <button type="submit" onClick={handleTopOff}>Submit</button>
                    <button onClick={() => { setPreviousView(view); setView('cashOut')}}>Cash Out</button>
                </div>
            ): (
                <form onSubmit={handleSubmit}>
                <h2>Add a Player</h2>
                <label>Name</label>
                <input type="text" name="name" value={playersForm.name} onChange={handleChange}></input>

                <label>Buy-in</label>
                <input type="number" name="buyIn" value={playersForm.buyIn} onChange={handleChange}></input>
                
                <button type="submit">Add</button>
                
            </form>
            )}
            Game Page
            <p>{game.location}
                {game.date}
            </p>
            
            

            {players.map(p => {
                const playerTransactions = transactions.filter(t => t.player_id === p.id && t.status === 'approved' && t.type !== 'cashout')
                const totalBuyIn = playerTransactions.reduce((sum,  t) => sum + t.amount, 0)
                const approvedCashOut = transactions.find(t => t.player_id === p.id && t.status === 'approved' && t.type === 'cashout')


                return(
                    
                    <div key={p.id}>
                        <p>{p.name} - ${totalBuyIn} {approvedCashOut ?  `profit: $${approvedCashOut.amount - totalBuyIn}` : ''}</p>
                        {view === 'host' && <button onClick={() => deletePlayer(p.id)}>Delete</button>}
                    
                    </div>
                ) 
                
            })}
            {view === 'host' && (
                <div>
                    <h2>Pending Transactions</h2>
                    {
                        transactions
                        .filter(t => t.status === 'pending')
                        .map(t => {
                            const player = players.find(p => p.id === t.player_id)
                            return(
                                <div key={t.id}>
                                    <p>{player?.name} - ${t.amount} ({t.type})</p>
                                    <button onClick={() => handleApprove(t.id)}>Approve</button>
                                </div>
                            )
                        })
                    }
                </div>
            )}
            <h2>Transaction Feed</h2>
            {transactions.map(t => {
                const player = players.find(p => p.id === t.player_id)
                return (
                    <div key={t.id}>
                        <p>{player?.name} - ${t.amount} at {new Date(t.created_at).toLocaleTimeString()} ({t.type}) {t.status}</p>
                    </div>
                )
            })}
        
        </div>

        
        )

    }

    export default GamePage