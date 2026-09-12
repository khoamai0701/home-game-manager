import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { authHeaders } from "../utils/authHeaders"
import { formatMoney, formatSigned, plural } from "../utils/format"
import { IconChevronLeft, IconStats, IconGroups, IconChevronRight } from './Icons'

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

    const totalBuyIn = Number(stats?.total_buy_in) || 0
    const totalCashOut = Number(stats?.total_cash_out) || 0
    const gamesPlayed = Number(stats?.games_played) || 0
    const profit = totalCashOut - totalBuyIn
    const hasPlayed = gamesPlayed > 0

    return (
        <main className="page">
            <header className="page__head">
                <button className="page__back" onClick={() => navigate('/home')}>
                    <IconChevronLeft size={16} />
                    Home
                </button>
                <div className="page__titles">
                    <h1 className="page__title">Your stats</h1>
                    <p className="page__sub">
                        {loading ? 'Loading…' : `Across ${plural(gamesPlayed, 'session')}, all time.`}
                    </p>
                </div>
            </header>

            {loading ? (
                <div className="stat-grid stat-grid--4">
                    <div className="skeleton" />
                    <div className="skeleton" />
                    <div className="skeleton" />
                    <div className="skeleton" />
                </div>
            ) : !hasPlayed ? (
                <div className="empty">
                    <span className="empty__icon"><IconStats size={22} /></span>
                    <span className="empty__title">Nothing to count yet</span>
                    <span className="empty__text">
                        Join or host a session and your buy-ins, cash-outs and running profit show up
                        here once the host approves them.
                    </span>
                    <button className="btn btn--primary btn--sm" onClick={() => navigate('/create')}>
                        Start a session
                    </button>
                </div>
            ) : (
                <>
                    <section className="section">
                        <div className="stat-grid stat-grid--4">
                            <div className="stat">
                                <span className="stat__label">Total buy-in</span>
                                <span className="stat__value">{formatMoney(totalBuyIn)}</span>
                                <span className="stat__foot">Everything you put on the table</span>
                            </div>
                            <div className="stat">
                                <span className="stat__label">Total cash-out</span>
                                <span className="stat__value">{formatMoney(totalCashOut)}</span>
                                <span className="stat__foot">Everything you took off it</span>
                            </div>
                            <div className="stat">
                                <span className="stat__label">Profit</span>
                                <span className={`stat__value ${profit > 0 ? 'stat__value--up' : profit < 0 ? 'stat__value--down' : ''}`}>
                                    {formatSigned(profit)}
                                </span>
                                <span className="stat__foot">Cash-out minus buy-in</span>
                            </div>
                            <div className="stat">
                                <span className="stat__label">Sessions</span>
                                <span className="stat__value">{gamesPlayed}</span>
                                <span className="stat__foot">Games you've bought into</span>
                            </div>
                        </div>
                        <p className="hint">
                            Only approved transactions count — anything still waiting on a host is left
                            out until they sign off on it.
                        </p>
                    </section>

                    <section className="section">
                        <div className="section__head">
                            <h2 className="section__title">Per group</h2>
                        </div>
                        <button className="row row--link" onClick={() => navigate('/groups')}>
                            <span className="avatar avatar--accent"><IconGroups size={19} /></span>
                            <span className="row__body">
                                <span className="row__title">See standings by group</span>
                                <span className="row__meta">
                                    How you stack up against each crew you play with
                                </span>
                            </span>
                            <span className="row__trail">
                                <span className="row__chevron"><IconChevronRight size={18} /></span>
                            </span>
                        </button>
                    </section>
                </>
            )}
        </main>
    )
}

export default Stats
