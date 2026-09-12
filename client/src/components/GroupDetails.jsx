import { useParams, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { authHeaders } from "../utils/authHeaders"

const DEFAULT_GROUP = {
    id: '',
    name: '',
    members: []
}

function GroupDetails() {
    const { id } = useParams()

    const [group, setGroup] = useState(DEFAULT_GROUP)
    const [games, setGames] = useState([])
    const navigate = useNavigate()
    const [email, setEmail] = useState('')

    useEffect(() => {
        fetchGroup()
        fetch(`/api/games/group/${id}`, {
            headers: authHeaders()
        })
        .then(res => res.json())
        .then(data => setGames(data) )
    }, [id])
    async function handleSubmit(e) {
        e.preventDefault()

        const response = await fetch(`/api/groups/${id}/members`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json', ...authHeaders()},
            body: JSON.stringify({email: email})
        })

        if (!response.ok) {
            const errorData = await response.json()
            alert(errorData.error)
            return
        }
        const data = await response.json()
        setEmail('')
        fetchGroup()
    }

    function fetchGroup() {
        fetch(`/api/groups/${id}`, {
            headers: authHeaders()
        })
        .then(res => res.json())
        .then(data => setGroup(data))
    }

    const activeGames = games.filter(g => g.is_active)
    const pastGames = games.filter(g => !g.is_active)

    return (
        <div className="app-shell">
            <div className="game-header">
                <button className="icon-btn icon-btn--neutral" onClick={() => navigate('/groups')} aria-label="Back">←</button>
                <div className="game-header__info">
                    <span className="game-header__location">{group.name}</span>
                    <span className="game-header__date">{group.members.length} member{group.members.length === 1 ? '' : 's'}</span>
                </div>
            </div>

            <div className="page-content">
                <form onSubmit={handleSubmit}>
                    <input
                        type="email"
                        placeholder="Friend's email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                    />
                    <button type="submit">Add Member</button>
                </form>
                <div>
                    <div className="section-title">
                        <h2>🪑 Members</h2>
                        <span className="section-count">{group.members.length}</span>
                    </div>

                    {group.members.length === 0 ? (
                        <div className="empty-state">No members yet</div>
                    ) : (
                        <div className="player-list">
                            {group.members.map(m => (
                                <div key={m.email} className="player-card">
                                    <div className="player-card__avatar">{m.display_name?.[0]?.toUpperCase() || '?'}</div>
                                    <div className="player-card__info">
                                        <span className="player-card__name">{m.display_name}</span>
                                        <span className="player-card__buyin">{m.email}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div>
                    <div className="section-title">
                        <h2>🟢 Active Sessions</h2>
                        <span className="section-count">{activeGames.length}</span>
                    </div>
                    {activeGames.length === 0 ? (
                        <div className="empty-state">No active sessions</div>
                    ) : (
                        <div className="player-list">
                            {activeGames.map(g => (
                                <div key={g.id} className="player-card" onClick={() => navigate(`/game/${g.id}`)}>
                                    <div className="player-card__avatar">♠</div>
                                    <div className="player-card__info">
                                        <span className="player-card__name">{g.location}</span>
                                        <span className="player-card__buyin">{g.date}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div>
                    <div className="section-title">
                        <h2>🕘 Past Games</h2>
                        <span className="section-count">{pastGames.length}</span>
                    </div>
                    {pastGames.length === 0 ? (
                        <div className="empty-state">No past games</div>
                    ) : (
                        <div className="player-list">
                            {pastGames.map(g => (
                                <div key={g.id} className="player-card" onClick={() => navigate(`/game/${g.id}`)}>
                                    <div className="player-card__avatar">♠</div>
                                    <div className="player-card__info">
                                        <span className="player-card__name">{g.location}</span>
                                        <span className="player-card__buyin">{g.date}</span>
                                    </div>
                                    <div className="player-card__right">
                                        <span className="status-pill status-pill--rejected">Ended</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )

}
export default GroupDetails