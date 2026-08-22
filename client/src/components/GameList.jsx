import { useEffect, useState } from "react"
import { useNavigate } from 'react-router-dom'

function GameList () {
    const [games, setGames] = useState([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        fetch('/api/games')
        .then(res => res.json())
        .then(data => setGames(data))
        .finally(() => setLoading(false))

    }, [])

    if (loading) {
        return <div className="loading-screen"><span className="spinner"></span>Loading games…</div>
    }

    return (
        <div className="app-shell">
            <div className="game-header">
                <button className="icon-btn icon-btn--neutral" onClick={() => navigate('/')} aria-label="Back">←</button>
                <div className="game-header__info">
                    <span className="game-header__location">Game History</span>
                    <span className="game-header__date">{games.length} past game{games.length === 1 ? '' : 's'}</span>
                </div>
            </div>

            <div className="page-content">
                {games.length === 0 ? (
                    <div className="empty-state">No games yet</div>
                ) : (
                    <div className="history-list">
                        {games.map(g => (
                            <div key={g.id} className="history-item" onClick={() => navigate(`/game/${g.id}`)}>
                                <div className="history-item__icon">♠</div>
                                <div className="history-item__info">
                                    <span className="history-item__location">{g.location}</span>
                                    <span className="history-item__date">{g.date}</span>
                                </div>
                                <span className="history-item__chevron">›</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
export default GameList
