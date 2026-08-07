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
        <form onSubmit={handleSubmit}>
            <h2>Create a Game</h2>
            <label>
                Date
                <input type='date' name='date' value={form.date} onChange={handleChange}/> 
            </label>

            <label>
                Location
                <input type='text' name='location' value={form.location} onChange={handleChange}/>
            </label>

            <label>
                Pin
                <input type='text' name='pin' value={form.pin} onChange={handleChange}/>
            </label>

            <div>
                <button type='submit'>Submit</button>
            </div>

        </form>
    )
    
}
export default CreateGame

