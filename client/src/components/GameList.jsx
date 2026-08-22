import { useEffect, useState } from "react"
import { useNavigate } from 'react-router-dom'

function GameList () {
    const [games, setGames] = useState([])
    const navigate = useNavigate()

    useEffect(() => {
        fetch('/api/games')
        .then(res => res.json())
        .then(data => setGames(data))

    }, [])

    return (
        <div>
            {games.map(g => {
                return(
                    <div key={g.id} onClick={() => navigate(`/game/${g.id}`)}>
                        {g.location} - {g.date}
                    </div>

                )
            })}
        </div>  
    )
}
export default GameList