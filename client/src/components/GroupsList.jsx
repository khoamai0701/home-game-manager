import { useEffect, useState } from "react"
import { useNavigate } from 'react-router-dom'
import { authHeaders } from "../utils/authHeaders"

function GroupsList() {

    const [groups, setGroups] = useState([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()


    useEffect(() => {
        fetch('/api/groups', {
            headers: authHeaders()
        })
        .then(res => res.json())
        .then(data => setGroups(data))
        .finally(() => setLoading(false))
    }, [])

    if (loading) {
        return <div className="loading-screen"><span className="spinner"></span>Loading groups…</div>
    }

    return (
        <div className="app-shell">
            <div className="game-header">
                <button className="icon-btn icon-btn--neutral" onClick={() => navigate('/home')} aria-label="Back">←</button>
                <div className="game-header__info">
                    <span className="game-header__location">Groups</span>
                    <span className="game-header__date">{groups.length} group{groups.length === 1 ? '' : 's'}</span>
                </div>
            </div>

            <div className="page-content">
                {groups.length === 0 ? (
                    <div className="empty-state">No groups yet</div>
                ) : (
                    <div className="history-list">
                        {groups.map(g => (
                            <div key={g.id} className="history-item" onClick={() => navigate(`/groups/${g.id}`)}>
                                <div className="history-item__icon">👥</div>
                                <div className="history-item__info">
                                    <span className="history-item__location">{g.name}</span>
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

export default GroupsList