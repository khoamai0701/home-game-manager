import { useNavigate } from "react-router-dom"
import { IconSpade, IconGames, IconGroups, IconPlus, IconStats, IconChevronRight } from './Icons'

const ACTIONS = [
    {
        to: '/create',
        title: 'Start New Session',
        desc: 'Set up a table and share the link with players',
        Icon: IconSpade,
        primary: true,
    },
    {
        to: '/games',
        title: 'View Games',
        desc: 'Every session you’ve hosted or played in',
        Icon: IconGames,
    },
    {
        to: '/create-group',
        title: 'Create Group',
        desc: 'Set up a crew of regulars you play with often',
        Icon: IconPlus,
    },
    {
        to: '/groups',
        title: 'View Groups',
        desc: 'Members, sessions and standings per group',
        Icon: IconGroups,
    },
    {
        to: '/stats',
        title: 'Your Stats',
        desc: 'Lifetime buy-ins, cash-outs and profit',
        Icon: IconStats,
    },
]

function Dashboard() {
    const navigate = useNavigate()

    return (
        <main className="page">
            <header className="page__head">
                <div className="page__bar">
                    <div className="page__titles">
                        <span className="page__eyebrow">Rebuy</span>
                        <h1 className="page__title">Home</h1>
                        <p className="page__sub">Start a session, or pick up where you left off.</p>
                    </div>
                </div>
            </header>

            <section className="section">
                <div className="section__head">
                    <h2 className="section__title">Quick actions</h2>
                </div>
                <p className="hint hint--inline">
                    Hosting? Start a session and send the link — anyone who opens it joins with their
                    own account, so you never have to type names in.
                </p>

                <div className="actions-grid">
                    {ACTIONS.map(({ to, title, desc, Icon, primary }) => (
                        <button
                            key={to}
                            className={`action-card${primary ? ' action-card--primary' : ''}`}
                            onClick={() => navigate(to)}
                        >
                            <span className="action-card__icon"><Icon size={21} /></span>
                            <span className="action-card__body">
                                <span className="action-card__title">{title}</span>
                                <span className="action-card__desc">{desc}</span>
                            </span>
                            <span className="row__chevron"><IconChevronRight size={18} /></span>
                        </button>
                    ))}
                </div>
            </section>
        </main>
    )
}
export default Dashboard
