import { useParams, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { authHeaders, getCurrentUserId } from "../utils/authHeaders"
import { formatMoney, formatSigned, formatGameDate, plural } from "../utils/format"
import { computeSettlements } from "../utils/settleUp"
import {
    IconChevronLeft, IconChevronRight, IconSpade, IconUser,
    IconTrophy, IconGames, IconMail, IconClock, IconTrash, IconCheck,
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
    const [memberError, setMemberError] = useState('')
    const [renaming, setRenaming] = useState(false)
    const [nameDraft, setNameDraft] = useState('')
    const [renameError, setRenameError] = useState('')
    const [confirmAction, setConfirmAction] = useState(null) // null | 'delete' | 'leave'
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
        setMemberError('')

        const response = await fetch(`/api/groups/${id}/members`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json', ...authHeaders()},
            body: JSON.stringify({email: email})
        })

        if (!response.ok) {
            const errorData = await response.json()
            setMemberError(errorData.error || 'Could not add member')
            return
        }
        await response.json()
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

    function startRename() {
        setNameDraft(group.name)
        setRenameError('')
        setRenaming(true)
    }

    async function handleRename(e) {
        e.preventDefault()
        setRenameError('')

        const response = await fetch(`/api/groups/${id}`, {
            method: 'PATCH',
            headers: {'Content-Type': 'application/json', ...authHeaders()},
            body: JSON.stringify({ name: nameDraft })
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            setRenameError(errorData.error || 'Could not rename group')
            return
        }
        const updated = await response.json()
        setGroup(prev => ({ ...prev, name: updated.name }))
        setRenaming(false)
    }

    async function handleConfirmAction() {
        if (confirmAction === 'delete') {
            const response = await fetch(`/api/groups/${id}`, { method: 'DELETE', headers: authHeaders() })
            setConfirmAction(null)
            if (response.ok || response.status === 204) navigate('/groups')
        } else if (confirmAction === 'leave') {
            const response = await fetch(`/api/groups/${id}/members/${myUserId}`, { method: 'DELETE', headers: authHeaders() })
            setConfirmAction(null)
            if (response.ok || response.status === 204) navigate('/groups')
        }
    }

    async function handleRemoveMember(userId) {
        const response = await fetch(`/api/groups/${id}/members/${userId}`, {
            method: 'DELETE',
            headers: authHeaders()
        })
        if (response.ok || response.status === 204) {
            setGroup(prev => ({ ...prev, members: prev.members.filter(m => m.user_id !== userId) }))
        }
    }

    // These endpoints hand back an error object rather than an array on 401 /
    // outage; render against safe lists so that degrades to empty states rather
    // than a blank screen.
    const gameList = Array.isArray(games) ? games : []
    const memberList = Array.isArray(group.members) ? group.members : []
    const standingList = Array.isArray(standings) ? standings : []

    const isCreator = group.created_by_user_id === myUserId
    const activeGames = gameList.filter(g => g.is_active)
    const pastGames = gameList.filter(g => !g.is_active)
    const rankedStandings = [...standingList].sort((a, b) =>
        (Number(b.total_cash_out) - Number(b.total_buy_in)) - (Number(a.total_cash_out) - Number(a.total_buy_in))
    )
    const groupSettlements = computeSettlements(
        rankedStandings.map(s => ({ name: s.display_name, amount: Number(s.total_cash_out) - Number(s.total_buy_in) }))
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
                        {renaming ? (
                            <form className="inline-form" onSubmit={handleRename}>
                                <input
                                    className="input"
                                    value={nameDraft}
                                    onChange={e => setNameDraft(e.target.value)}
                                    aria-label="Group name"
                                    autoFocus
                                />
                                <button className="btn btn--primary btn--sm" type="submit">Save</button>
                                <button className="btn btn--ghost btn--sm" type="button" onClick={() => setRenaming(false)}>Cancel</button>
                            </form>
                        ) : (
                            <h1 className="page__title">{group.name}</h1>
                        )}
                        {renameError && <p className="form__error">{renameError}</p>}
                        <p className="page__sub">
                            {plural(memberList.length, 'member')}
                            {gameList.length > 0 && ` · ${plural(gameList.length, 'session')}`}
                        </p>
                    </div>
                    <div className="page__actions">
                        <button className="btn btn--primary btn--sm" onClick={() => navigate('/create')}>
                            New session
                        </button>
                        {isCreator ? (
                            <>
                                <button className="btn btn--secondary btn--sm" onClick={startRename}>Rename</button>
                                <button className="btn btn--danger btn--sm" onClick={() => setConfirmAction('delete')}>Delete</button>
                            </>
                        ) : (
                            <button className="btn btn--danger btn--sm" onClick={() => setConfirmAction('leave')}>Leave</button>
                        )}
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
                {memberError && <p className="form__error">{memberError}</p>}

                {memberList.length === 0 ? (
                    <div className="empty empty--sm">
                        <span className="empty__icon"><IconUser size={20} /></span>
                        <span className="empty__title">No members yet</span>
                    </div>
                ) : (
                    <div className="list">
                        {memberList.map(m => (
                            <div key={m.user_id ?? m.email} className="row">
                                <span className="avatar avatar--sm">{m.display_name?.[0]?.toUpperCase() || '?'}</span>
                                <span className="row__body">
                                    <span className="row__title">
                                        {m.display_name}
                                        {m.user_id === myUserId && <span className="tag tag--you">You</span>}
                                    </span>
                                    <span className="row__meta">{m.email}</span>
                                </span>
                                {isCreator && m.user_id !== myUserId && (
                                    <span className="row__trail">
                                        <button
                                            className="iconbtn iconbtn--danger"
                                            onClick={() => handleRemoveMember(m.user_id)}
                                            aria-label={`Remove ${m.display_name}`}
                                        >
                                            <IconTrash size={16} />
                                        </button>
                                    </span>
                                )}
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
                            const gamesPlayed = Number(s.games_played) || 0
                            const played = gamesPlayed > 0
                            return (
                                <div key={s.user_id} className="row">
                                    <span className={`rank${i === 0 && played ? ' rank--1' : ''}`}>{i + 1}</span>
                                    <span className="avatar avatar--sm">{s.display_name?.[0]?.toUpperCase() || '?'}</span>
                                    <span className="row__body">
                                        <span className="row__title">{s.display_name}</span>
                                        <span className="row__meta">
                                            {played
                                                ? <>
                                                    {plural(gamesPlayed, 'game')}
                                                    <span className="row__dot">·</span>
                                                    In {formatMoney(s.total_buy_in)}
                                                    <span className="row__dot">·</span>
                                                    Out {formatMoney(s.total_cash_out)}
                                                </>
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

            {/* ---- settle up ---- */}
            <section className="section">
                <div className="section__head">
                    <h2 className="section__title">Settle up</h2>
                </div>
                <p className="hint hint--inline">
                    The smallest set of payments that settles this group's balance sheet, based on
                    approved transactions across all of its games.
                </p>

                {groupSettlements.length === 0 ? (
                    <div className="empty empty--sm">
                        <span className="empty__icon"><IconCheck size={20} /></span>
                        <span className="empty__title">Already settled</span>
                    </div>
                ) : (
                    <div className="list">
                        {groupSettlements.map((s, i) => (
                            <div key={i} className="row">
                                <span className="row__body">
                                    <span className="row__title">{s.from} → {s.to}</span>
                                </span>
                                <span className="row__trail">
                                    <span className="pill pill--flat">{formatMoney(s.amount)}</span>
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {confirmAction && (
                <div className="modal" onClick={() => setConfirmAction(null)}>
                    <div className="modal__card" onClick={e => e.stopPropagation()}>
                        <div className="modal__head">
                            <div>
                                <h2 className="modal__title">
                                    {confirmAction === 'delete' ? `Delete ${group.name}?` : `Leave ${group.name}?`}
                                </h2>
                                <span className="modal__sub">
                                    {confirmAction === 'delete'
                                        ? "This removes the group for everyone. Games already played stay in each player's own history."
                                        : "You'll need a new invite to rejoin."}
                                </span>
                            </div>
                        </div>
                        <div className="modal__actions">
                            <button className="btn btn--danger btn--block" onClick={handleConfirmAction}>
                                {confirmAction === 'delete' ? 'Delete group' : 'Leave group'}
                            </button>
                            <button className="btn btn--secondary btn--block" onClick={() => setConfirmAction(null)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    )

}
export default GroupDetails
