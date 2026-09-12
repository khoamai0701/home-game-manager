import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { authHeaders } from "../utils/authHeaders"
import { IconChevronLeft } from './Icons'

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
        <main className="page page--narrow">
            <header className="page__head">
                <button className="page__back" onClick={() => navigate('/groups')}>
                    <IconChevronLeft size={16} />
                    Groups
                </button>
                <div className="page__titles">
                    <h1 className="page__title">New group</h1>
                    <p className="page__sub">
                        A group is your regular crew. Sessions you attach to it stack up into shared
                        history and season standings.
                    </p>
                </div>
            </header>

            <form className="card form" onSubmit={handleSubmit}>
                <div className="field">
                    <label className="label" htmlFor="name">Group name</label>
                    <input
                        className="input"
                        id="name"
                        type="text"
                        placeholder="e.g. Friday Crew"
                        value={name}
                        onChange={e => setName(e.target.value)}
                    />
                    <p className="field__hint">
                        You'll be added automatically. Invite the rest by email on the next screen.
                    </p>
                </div>

                <button className="btn btn--primary btn--lg btn--block" type="submit">Create group</button>
            </form>
        </main>
    )
}

export default CreateGroup
