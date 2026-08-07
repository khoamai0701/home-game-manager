import { useParams } from "react-router-dom"
import { useEffect, useState } from "react"
const DEFAULT_FORM = {
        name: '',
        buyIn: ''
    }
function GamePage() {
    const { id } = useParams()
    const [game, setGame] = useState()
    const [players, setPlayer] = useState([])
    

    const [playersForm, setPlayersForm] = useState(DEFAULT_FORM)
    const [transactions, setTransactions] =useState([])
    


    useEffect(() => {
        fetch(`/api/games/${id}`)
        .then(res => res.json())
        .then(data => setGame(data) )

        fetch(`/api/players/${id}`)
        .then(res => res.json())
        .then(data => setPlayer(data) )

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
        
        setPlayer(prev => [...prev, data])
        

        const response2 = await fetch('/api/transactions', {
            method: 'POST',
            headers: {'Content-Type' : 'application/json'},
            body: JSON.stringify({
                player_id: data.id,
                game_id: id,
                amount: playersForm.buyIn,
                type: 'buyin'
            })
        })

        const transactionData = await response2.json()
        setTransactions(prev => [...prev, transactionData])
        setPlayersForm(DEFAULT_FORM)

    }

    async function deletePlayer(playerId) {
        await fetch(`/api/players/${playerId}`, {method: 'DELETE'})
        setPlayer(prev => prev.filter(player => player.id !== playerId))
    }

    if (!game) return <div>Loading...</div>
    
  return (
    <div>
        Game Page
        <p>{game.location}
            {game.date}
        </p>
        
        <form onSubmit={handleSubmit}>
            <h2>Add a Player</h2>
            <label>Name</label>
            <input type="text" name="name" value={playersForm.name} onChange={handleChange}></input>

            <label>Buy-in</label>
            <input type="number" name="buyIn" value={playersForm.buyIn} onChange={handleChange}></input>
            
            <button type="submit">Add</button>
            
        </form>

        {players.map(p => {
            const playerTransactions = transactions.filter(t => t.player_id === p.id)
            const totalBuyIn = playerTransactions.reduce((sum,  t) => sum + t.amount, 0)

            return(
                <div key={p.id}>
                    <p>{p.name} - ${totalBuyIn}</p>
                    <button onClick={() => deletePlayer(p.id)}>Delete</button>
                
                </div>
            ) 
            
        })}
    
    </div>

    
    )

}

export default GamePage