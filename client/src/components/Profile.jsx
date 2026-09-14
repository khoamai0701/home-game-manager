import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { authHeaders } from "../utils/authHeaders"
import { IconChevronLeft, IconSignOut, IconMail, IconUser } from './Icons'

function Profile() {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        fetch('/api/users/me', { headers: authHeaders() })
            .then(res => (res.ok ? res.json() : Promise.reject(new Error('profile fetch failed'))))
            .then(data => setUser(data))
            .catch(() => setError(true))
            .finally(() => setLoading(false))
    }, [])

    function handleSignOut() {
        localStorage.removeItem('token')
        navigate('/')
    }

    return (
        <main className="page page--narrow">
            <header className="page__head">
                <button className="page__back" onClick={() => navigate('/home')}>
                    <IconChevronLeft size={16} />
                    Home
                </button>
                <div className="page__titles">
                    <h1 className="page__title">Profile</h1>
                </div>
            </header>

            {loading ? (
                <div className="loading"><span className="spinner" />Loading…</div>
            ) : error || !user ? (
                <div className="empty">
                    <span className="empty__icon"><IconUser size={22} /></span>
                    <span className="empty__title">Couldn't load your profile</span>
                    <button className="btn btn--primary btn--sm" onClick={() => window.location.reload()}>
                        Try again
                    </button>
                </div>
            ) : (
                <div className="card">
                    <div className="profile-head">
                        {user.avatar_url ? (
                            <img className="profile-avatar" src={user.avatar_url} alt="" />
                        ) : (
                            <span className="avatar profile-avatar">
                                {user.display_name?.[0]?.toUpperCase() || '?'}
                            </span>
                        )}
                        <div className="profile-head__info">
                            <span className="profile-head__name">{user.display_name}</span>
                            <span className="profile-head__email">
                                <IconMail size={14} />
                                {user.email}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            <button className="btn btn--danger btn--block" onClick={handleSignOut}>
                <IconSignOut size={16} />
                Sign out
            </button>
        </main>
    )
}

export default Profile
