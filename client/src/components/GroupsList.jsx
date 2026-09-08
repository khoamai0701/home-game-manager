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
        return <div className="loading-screen"><span className="spinner"></span>Loading games…</div>
    }

    return (
        <div>
            <h1>Groups</h1>
            {groups.length === 0 ? (
                <h2>No groups</h2>
            ) : (
                groups.map(g => (
                    <div key={g.id} onClick={() => navigate(`/groups/${g.id}`)}>
                        <h2>{g.name}</h2>
                    </div>
                ))
             )}
        </div>
    )
}

export default GroupsList