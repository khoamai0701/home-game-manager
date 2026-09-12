import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { authHeaders } from "../utils/authHeaders"

function Stats() {
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        fetch('/api/stats', {
            headers: authHeaders()
        })
        .then(res => res.json())
        .then(data => setStats(data))
        .finally(() => setLoading(false))
    }, [])

    if (loading) {
        return <div className="loading-screen"><span className="spinner"></span>Loading stats…</div>
    }

    const formatMoney = n => `$${Number(n).toLocaleString()}`
    const totalBuyIn = Number(stats?.total_buy_in) || 0
    const totalCashOut = Number(stats?.total_cash_out) || 0
    const gamesPlayed = Number(stats?.games_played) || 0
    const profit = totalCashOut - totalBuyIn

    return (
        <div className="app-shell">
            <div className="game-header">
                <button className="icon-btn icon-btn--neutral" onClick={() => navigate('/home')} aria-label="Back">←</button>
                <div className="game-header__info">
                    <span className="game-header__location">Your Stats</span>
                    <span className="game-header__date">{gamesPlayed} game{gamesPlayed === 1 ? '' : 's'} played</span>
                </div>
            </div>

            <div className="page-content">
                <div className="summary-bar">
                    <div className="summary-stat">
                        <span className="summary-stat__label">Buy-ins</span>
                        <span className="summary-stat__value">{formatMoney(totalBuyIn)}</span>
                    </div>
                    <div className="summary-stat">
                        <span className="summary-stat__label">Cash-outs</span>
                        <span className="summary-stat__value">{formatMoney(totalCashOut)}</span>
                    </div>
                    <div className="summary-stat">
                        <span className="summary-stat__label">Profit</span>
                        <span className={`summary-stat__value ${profit > 0 ? 'summary-stat__value--positive' : profit < 0 ? 'summary-stat__value--negative' : ''}`}>
                            {profit > 0 ? '+' : ''}{formatMoney(profit)}
                        </span>
                    </div>
                    <div className="summary-stat">
                        <span className="summary-stat__label">Games</span>
                        <span className="summary-stat__value">{gamesPlayed}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Stats
