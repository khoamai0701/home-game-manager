import { useEffect, useState } from "react"
import { useNavigate } from 'react-router-dom'
import { authHeaders } from "../utils/authHeaders"
import { formatGameDate, plural } from "../utils/format"
import { IconChevronLeft, IconChevronRight, IconSpade, IconGames } from './Icons'

function GameList () {
    const [games, setGames] = useState([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        fetch('/api/games', {
            headers: authHeaders()
        })
        .then(res => res.json())
        .then(data => setGames(data))
        .finally(() => setLoading(false))

    }, [])

    // The API hands back an error object rather than an array on 401 / outage;
    // render against a safe list so that degrades to an empty state, not a
    // blank screen.
    const gameList = Array.isArray(games) ? games : []
    const liveCount = gameList.filter(g => g.is_active).length

    return (
        <main className="page">
            <header className="page__head">
                <button className="page__back" onClick={() => navigate('/home')}>
                    <IconChevronLeft size={16} />
                    Home
                </button>
                <div className="page__bar">
                    <div className="page__titles">
                        <h1 className="page__title">Games</h1>
                        <p className="page__sub">
                            {loading
                                ? 'Loading…'
                                : `${plural(gameList.length, 'session')}${liveCount ? ` · ${liveCount} still live` : ''}`}
                        </p>
                    </div>
                    <div className="page__actions">
                        <button className="btn btn--primary btn--sm" onClick={() => navigate('/create')}>
                            New session
                        </button>
                    </div>
                </div>
            </header>

            {loading ? (
                <div className="list--grid">
                    <div className="skeleton" />
                    <div className="skeleton" />
                    <div className="skeleton" />
                    <div className="skeleton" />
                </div>
            ) : gameList.length === 0 ? (
                <div className="empty">
                    <span className="empty__icon"><IconGames size={22} /></span>
                    <span className="empty__title">No games yet</span>
                    <span className="empty__text">
                        Start a session and share the link — every buy-in and cash-out gets tracked
                        here.
                    </span>
                    <button className="btn btn--primary btn--sm" onClick={() => navigate('/create')}>
                        Start a session
                    </button>
                </div>
            ) : (
                <div className="list--grid">
                    {gameList.map(g => (
                        <button
                            key={g.id}
                            className={`row row--link${g.is_active ? '' : ' row--muted'}`}
                            onClick={() => navigate(`/game/${g.id}`)}
                        >
                            <span className="avatar avatar--square"><IconSpade size={20} /></span>
                            <span className="row__body">
                                <span className="row__title">{g.location || 'Untitled game'}</span>
                                <span className="row__meta">
                                    {formatGameDate(g.date)}
                                    <span className="row__dot">·</span>
                                    {g.is_active
                                        ? <span className="tag tag--live"><span className="dot dot--pulse" />Live</span>
                                        : <span className="tag tag--ended">Ended</span>}
                                </span>
                            </span>
                            <span className="row__trail">
                                <span className="row__chevron"><IconChevronRight size={18} /></span>
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </main>
    )
}
export default GameList
