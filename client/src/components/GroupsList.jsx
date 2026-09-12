import { useEffect, useState } from "react"
import { useNavigate } from 'react-router-dom'
import { authHeaders } from "../utils/authHeaders"
import { plural } from "../utils/format"
import { IconChevronLeft, IconChevronRight, IconGroups } from './Icons'

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

    // The API hands back an error object rather than an array on 401 / outage;
    // render against a safe list so that degrades to an empty state, not a
    // blank screen.
    const groupList = Array.isArray(groups) ? groups : []

    return (
        <main className="page">
            <header className="page__head">
                <button className="page__back" onClick={() => navigate('/home')}>
                    <IconChevronLeft size={16} />
                    Home
                </button>
                <div className="page__bar">
                    <div className="page__titles">
                        <h1 className="page__title">Groups</h1>
                        <p className="page__sub">
                            {loading ? 'Loading…' : plural(groupList.length, 'group')}
                        </p>
                    </div>
                    <div className="page__actions">
                        <button className="btn btn--primary btn--sm" onClick={() => navigate('/create-group')}>
                            New group
                        </button>
                    </div>
                </div>
            </header>

            {loading ? (
                <div className="list--grid">
                    <div className="skeleton" />
                    <div className="skeleton" />
                </div>
            ) : groupList.length === 0 ? (
                <div className="empty">
                    <span className="empty__icon"><IconGroups size={22} /></span>
                    <span className="empty__title">No groups yet</span>
                    <span className="empty__text">
                        A group is your regular crew. Attach sessions to one and Rebuy keeps their
                        shared history and season standings.
                    </span>
                    <button className="btn btn--primary btn--sm" onClick={() => navigate('/create-group')}>
                        Create a group
                    </button>
                </div>
            ) : (
                <div className="list--grid">
                    {groupList.map(g => (
                        <button
                            key={g.id}
                            className="row row--link"
                            onClick={() => navigate(`/groups/${g.id}`)}
                        >
                            <span className="avatar avatar--accent"><IconGroups size={19} /></span>
                            <span className="row__body">
                                <span className="row__title">{g.name}</span>
                                <span className="row__meta">Members, sessions &amp; standings</span>
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

export default GroupsList
