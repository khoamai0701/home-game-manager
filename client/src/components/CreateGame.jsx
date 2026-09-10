import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authHeaders } from '../utils/authHeaders'
const DEFAULT_FORM = {
    date: new Date().toISOString().split('T')[0],
    location: '',
    group_id: ''
}
function CreateGame() {
    const [form, setForm] = useState(DEFAULT_FORM)
    const [groups, setGroups] = useState([])
    const navigate = useNavigate()

    useEffect(() => {
        fetch('/api/groups', {
            headers: authHeaders()
        })
        .then(res => res.json())
        .then(data => setGroups(data))
    }, [])

    function handleChange(e) {
        const { name, value } = e.target
        setForm(prev => ({...prev, [name]: value }))
    }

    async function handleSubmit(e) {
        e.preventDefault()

        const response = await fetch('/api/games', {
            method: 'POST',
            headers: {'Content-Type': 'application/json', ...authHeaders()},
            body: JSON.stringify(form)
        })

        const data = await response.json()

        navigate(`/game/${data.id}`)


    }

    return (
        <div className="screen-center">
            <div className="brand-mark">♠</div>
            <h1 className="entry-title">New Game</h1>
            <p className="entry-subtitle">Set up a table and share the link with players</p>

            <form className="form-card" style={{width: '100%'}} onSubmit={handleSubmit}>
                <div className="form-group">
                    <label className="form-label" htmlFor="date">Date</label>
                    <input className="form-input" id="date" type='date' name='date' value={form.date} onChange={handleChange}/>
                </div>

                <div className="form-group">
                    <label className="form-label" htmlFor="location">Location</label>
                    <input className="form-input" id="location" type='text' name='location' placeholder="e.g. Mike's Place" value={form.location} onChange={handleChange}/>
                    
                </div>
                
                <div className="form-group">
                    <label className="form-label" htmlFor="group_id">Group (optional)</label>
                    <select className="form-input" id="group_id" name="group_id" value={form.group_id} onChange={handleChange}>
                        <option value="">No group</option>
                        {groups.map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                    </select>
                </div>


                <button className="btn btn-primary btn-block" type='submit'>Create Game</button>
            </form>
            <button className="btn btn-secondary btn-block history-btn" onClick={() => navigate('/games')}>
                <span>🕘</span> Game History
            </button>
        </div>
    )

}
export default CreateGame
