
function GameEntry({onSelectHost, onSelectPlayer}) {

    return (
        <div>
            
            <h1>Host or Player</h1>
            <button onClick={onSelectHost}>Host</button>
            <button onClick={onSelectPlayer}>Player</button>

        </div>
       

    )
}

export default GameEntry