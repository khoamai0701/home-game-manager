import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { authHeaders } from "../utils/authHeaders"

function CreateGroup() {
    const [name, setName] = useState('')
    const navigate = useNavigate()

    async function handleSubmit(e) {
        e.preventDefault()

        const response = await fetch('/api/groups', {
            method: 'POST',
            headers: {'Content-Type' : 'application/json', ...authHeaders()},
            body: JSON.stringify({name: name})
        })
        const data = await response.json()
        navigate(`/groups/${data.id}`)
    }

    return (
        <div className="screen-center">
            <div className="brand-mark">👥</div>
            <h1 className="entry-title">Create Group</h1>
            <p className="entry-subtitle">Name your group of regulars</p>

            <form className="form-card" style={{ width: '100%' }} onSubmit={handleSubmit}>
                <div className="form-group">
                    <label className="form-label" htmlFor="name">Group Name</label>
                    <input
                        className="form-input"
                        id="name"
                        type="text"
                        placeholder="e.g. Friday Crew"
                        value={name}
                        onChange={e => setName(e.target.value)}
                    />
                </div>

                <button className="btn btn-primary btn-block" type="submit">Create Group</button>
            </form>
        </div>
    )
}

export default CreateGroup