import { useNavigate } from "react-router-dom"


function Dashboard() {
    const navigate = useNavigate()

    return(
        <div>
            <h1>Home</h1>
            <button onClick={() => navigate('/create')}>Create Game</button>
            <button onClick={() => navigate('/games')}>View Games</button>
            <button onClick={() => navigate('/create-group')}>Create Group</button>
        </div>
    )
}
export default Dashboard