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
    const navigate = useNavigate()

    useEffect(() => {
        fetch(`/api/groups/${id}`, {
            headers: authHeaders()
        })
        .then(res => res.json())
        .then(data => setGroup(data))
    }, [id])

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
            </div>
        </div>
    )

}
export default GroupDetails