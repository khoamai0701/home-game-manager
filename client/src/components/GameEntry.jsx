
function GameEntry({onSelectHost, onSelectPlayer}) {

    return (
        <div className="screen-center">
            <div className="brand-mark">♠</div>
            <h1 className="entry-title">Join the Game</h1>
            <p className="entry-subtitle">Are you running the table or taking a seat?</p>

            <div className="entry-options">
                <button className="entry-option entry-option--host" onClick={onSelectHost}>
                    <span className="entry-option__icon">👑</span>
                    <span className="entry-option__text">
                        <span className="entry-option__title">Host</span>
                        <span className="entry-option__desc">Manage buy-ins, approvals &amp; cash-outs</span>
                    </span>
                    <span className="entry-option__chevron">›</span>
                </button>

                <button className="entry-option entry-option--player" onClick={onSelectPlayer}>
                    <span className="entry-option__icon">🂡</span>
                    <span className="entry-option__text">
                        <span className="entry-option__title">Player</span>
                        <span className="entry-option__desc">Buy in, top off &amp; track your stack</span>
                    </span>
                    <span className="entry-option__chevron">›</span>
                </button>
            </div>
        </div>

    )
}

export default GameEntry
