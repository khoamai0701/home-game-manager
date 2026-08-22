import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
const DEFAULT_FORM = {
    date: new Date().toISOString().split('T')[0],
    location: '',
    pin: ''


}
function CreateGame() {
    const [form, setForm] = useState(DEFAULT_FORM)
    const navigate = useNavigate()

    function handleChange(e) {
        const { name, value } = e.target
        setForm(prev => ({...prev, [name]: value }))
    }

    async function handleSubmit(e) {
        e.preventDefault()

        const response = await fetch('/api/games', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
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
                    <label className="form-label" htmlFor="pin">Host PIN</label>
                    <input className="form-input" id="pin" type='text' name='pin' placeholder="4-digit PIN" value={form.pin} onChange={handleChange}/>
                </div>

                <button className="btn btn-primary btn-block" type='submit'>Create Game</button>
            </form>
            <button onClick={() => navigate('/games')}>Game History</button>
        </div>
    )

}
export default CreateGame
