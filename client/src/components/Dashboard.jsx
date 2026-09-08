import { useNavigate } from "react-router-dom"


function Dashboard() {
    const navigate = useNavigate()

    return(
        <div className="screen-center">
            <div className="brand-mark">🏠</div>
            <h1 className="entry-title">Home</h1>
            <p className="entry-subtitle">What would you like to do?</p>

            <div className="entry-options">
                <button className="entry-option" onClick={() => navigate('/create')}>
                    <span className="entry-option__icon">♠</span>
                    <span className="entry-option__text">
                        <span className="entry-option__title">Start New Session</span>
                        <span className="entry-option__desc">Set up a table and invite players</span>
                    </span>
                    <span className="entry-option__chevron">›</span>
                </button>

                <button className="entry-option" onClick={() => navigate('/games')}>
                    <span className="entry-option__icon">🕘</span>
                    <span className="entry-option__text">
                        <span className="entry-option__title">View Games</span>
                        <span className="entry-option__desc">Browse your past sessions</span>
                    </span>
                    <span className="entry-option__chevron">›</span>
                </button>

                <button className="entry-option" onClick={() => navigate('/create-group')}>
                    <span className="entry-option__icon">👥</span>
                    <span className="entry-option__text">
                        <span className="entry-option__title">Create Group</span>
                        <span className="entry-option__desc">Set up a group of regulars</span>
                    </span>
                    <span className="entry-option__chevron">›</span>
                </button>

                <button className="entry-option" onClick={(() => navigate('/groups'))}>
                    <span className="entry-option__icon">📋</span>
                    <span className="entry-option__text">
                        <span className="entry-option__title">View Groups</span>
                        <span className="entry-option__desc">Manage your saved groups</span>
                    </span>
                    <span className="entry-option__chevron">›</span>
                </button>
            </div>
        </div>
    )
}
export default Dashboard