import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authHeaders } from '../utils/authHeaders'
import { IconChevronLeft } from './Icons'

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

    // The API hands back an error object rather than an array on 401 / outage;
    // render against a safe list so the picker just shows "No group" instead of
    // blanking the page.
    const groupList = Array.isArray(groups) ? groups : []

    return (
        <main className="page page--narrow">
            <header className="page__head">
                <button className="page__back" onClick={() => navigate('/home')}>
                    <IconChevronLeft size={16} />
                    Home
                </button>
                <div className="page__titles">
                    <h1 className="page__title">New session</h1>
                    <p className="page__sub">
                        You'll be the host — you approve every top-off and cash-out at the table.
                    </p>
                </div>
            </header>

            <form className="card form" onSubmit={handleSubmit}>
                <div className="field">
                    <label className="label" htmlFor="date">Date</label>
                    <input className="input" id="date" type='date' name='date' value={form.date} onChange={handleChange}/>
                </div>

                <div className="field">
                    <label className="label" htmlFor="location">Location</label>
                    <input className="input" id="location" type='text' name='location' placeholder="e.g. Mike's Place" value={form.location} onChange={handleChange}/>
                </div>

                <div className="field">
                    <label className="label" htmlFor="group_id">Group (optional)</label>
                    <select className="input" id="group_id" name="group_id" value={form.group_id} onChange={handleChange}>
                        <option value="">No group</option>
                        {groupList.map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                    </select>
                    <p className="field__hint">
                        Attaching a group keeps this session in that group's history and counts it
                        toward their standings. Leave it off for a one-time game.
                    </p>
                </div>

                <button className="btn btn--primary btn--lg btn--block" type='submit'>Create session</button>
            </form>

            <button className="btn btn--ghost btn--block" onClick={() => navigate('/games')}>
                View past games
            </button>
        </main>
    )

}
export default CreateGame
