import { useParams, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { authHeaders, getCurrentUserId } from "../utils/authHeaders"
import { formatMoney, formatSigned, formatGameDate, plural } from "../utils/format"
import {
    IconChevronLeft, IconChevronRight, IconSpade, IconUser,
    IconTrophy, IconGames, IconMail, IconClock,
} from './Icons'

const DEFAULT_GROUP = {
    id: '',
    name: '',
    members: []
}

function GroupDetails() {
    const { id } = useParams()

    const [group, setGroup] = useState(DEFAULT_GROUP)
    const [games, setGames] = useState([])
    const [standings, setStandings] = useState([])
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const myUserId = getCurrentUserId()

    useEffect(() => {
        fetchGroup()
        fetch(`/api/games/group/${id}`, {
            headers: authHeaders()
        })
        .then(res => res.json())
        .then(data => setGames(data) )

        fetch(`/api/stats/${id}`, {
            headers: authHeaders()
        })
        .then(res => res.json())
        .then(data => setStandings(data))
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

    // These endpoints hand back an error object rather than an array on 401 /
    // outage; render against safe lists so that degrades to empty states rather
    // than a blank screen.
    const gameList = Array.isArray(games) ? games : []
    const memberList = Array.isArray(group.members) ? group.members : []
    const standingList = Array.isArray(standings) ? standings : []

    const activeGames = gameList.filter(g => g.is_active)
    const pastGames = gameList.filter(g => !g.is_active)
    const rankedStandings = [...standingList].sort((a, b) =>
        (Number(b.total_cash_out) - Number(b.total_buy_in)) - (Number(a.total_cash_out) - Number(a.total_buy_in))
    )

    function renderGame(g) {
        const mine = g.created_by_user_id === myUserId
        return (
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
                        {mine && <><span className="row__dot">·</span><span className="tag tag--host">You hosted</span></>}
                        {!g.is_active && <><span className="row__dot">·</span><span className="tag tag--ended">Ended</span></>}
                    </span>
                </span>
                <span className="row__trail">
                    <span className="row__chevron"><IconChevronRight size={18} /></span>
                </span>
            </button>
        )
    }

    return (
        <main className="page">
            <header className="page__head">
                <button className="page__back" onClick={() => navigate('/groups')}>
                    <IconChevronLeft size={16} />
                    Groups
                </button>
                <div className="page__bar">
                    <div className="page__titles">
                        <span className="page__eyebrow">Group</span>
                        <h1 className="page__title">{group.name}</h1>
                        <p className="page__sub">
                            {plural(memberList.length, 'member')}
                            {gameList.length > 0 && ` · ${plural(gameList.length, 'session')}`}
                        </p>
                    </div>
                    <div className="page__actions">
                        <button className="btn btn--primary btn--sm" onClick={() => navigate('/create')}>
                            New session
                        </button>
                    </div>
                </div>
            </header>

            {/* ---- members ---- */}
            <section className="section">
                <div className="section__head">
                    <h2 className="section__title">Members</h2>
                    <span className="section__count">{memberList.length}</span>
                </div>
                <p className="hint hint--inline">
                    Anyone here can open this group's sessions. Add someone by the email on their
                    Google account — they need to have signed in to Rebuy at least once.
                </p>

                <form className="inline-form" onSubmit={handleSubmit}>
                    <input
                        className="input"
                        type="email"
                        placeholder="friend@example.com"
                        aria-label="Member email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                    />
                    <button className="btn btn--secondary" type="submit">
                        <IconMail size={16} />
                        Add
                    </button>
                </form>

                {memberList.length === 0 ? (
                    <div className="empty empty--sm">
                        <span className="empty__icon"><IconUser size={20} /></span>
                        <span className="empty__title">No members yet</span>
                    </div>
                ) : (
                    <div className="list">
                        {memberList.map(m => (
                            <div key={m.email} className="row">
                                <span className="avatar avatar--sm">{m.display_name?.[0]?.toUpperCase() || '?'}</span>
                                <span className="row__body">
                                    <span className="row__title">{m.display_name}</span>
                                    <span className="row__meta">{m.email}</span>
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* ---- active sessions ---- */}
            <section className="section">
                <div className="section__head">
                    <h2 className="section__title">Active sessions</h2>
                    <span className="section__count">{activeGames.length}</span>
                </div>
                {activeGames.length === 0 ? (
                    <div className="empty empty--sm">
                        <span className="empty__icon"><IconClock size={20} /></span>
                        <span className="empty__title">Nothing running right now</span>
                        <span className="empty__text">
                            Start a session and attach it to this group to see it here.
                        </span>
                    </div>
                ) : (
                    <div className="list--grid">{activeGames.map(renderGame)}</div>
                )}
            </section>

            {/* ---- past games ---- */}
            <section className="section">
                <div className="section__head">
                    <h2 className="section__title">Past games</h2>
                    <span className="section__count">{pastGames.length}</span>
                </div>
                {pastGames.length === 0 ? (
                    <div className="empty empty--sm">
                        <span className="empty__icon"><IconGames size={20} /></span>
                        <span className="empty__title">No finished games yet</span>
                    </div>
                ) : (
                    <div className="list--grid">{pastGames.map(renderGame)}</div>
                )}
            </section>

            {/* ---- standings ---- */}
            <section className="section">
                <div className="section__head">
                    <h2 className="section__title">Standings</h2>
                    <span className="section__count">{rankedStandings.length}</span>
                </div>
                <p className="hint hint--inline">
                    Every approved buy-in and cash-out from this group's sessions, added up per
                    member. Games outside this group don't count.
                </p>

                {rankedStandings.length === 0 ? (
                    <div className="empty empty--sm">
                        <span className="empty__icon"><IconTrophy size={20} /></span>
                        <span className="empty__title">No results yet</span>
                        <span className="empty__text">
                            Standings appear once a session in this group has approved transactions.
                        </span>
                    </div>
                ) : (
                    <div className="list">
                        {rankedStandings.map((s, i) => {
                            const profit = Number(s.total_cash_out) - Number(s.total_buy_in)
                            const played = Number(s.total_buy_in) > 0 || Number(s.total_cash_out) > 0
                            return (
                                <div key={s.user_id} className="row">
                                    <span className={`rank${i === 0 && played ? ' rank--1' : ''}`}>{i + 1}</span>
                                    <span className="avatar avatar--sm">{s.display_name?.[0]?.toUpperCase() || '?'}</span>
                                    <span className="row__body">
                                        <span className="row__title">{s.display_name}</span>
                                        <span className="row__meta">
                                            {played
                                                ? <>In {formatMoney(s.total_buy_in)}<span className="row__dot">·</span>Out {formatMoney(s.total_cash_out)}</>
                                                : 'Hasn’t played a session yet'}
                                        </span>
                                    </span>
                                    <span className="row__trail">
                                        <span className={`pill ${profit > 0 ? 'pill--up' : profit < 0 ? 'pill--down' : 'pill--flat'}`}>
                                            {formatSigned(profit)}
                                        </span>
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                )}
            </section>
        </main>
    )

}
export default GroupDetails
