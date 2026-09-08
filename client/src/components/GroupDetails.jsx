import { useParams } from "react-router-dom"
import { useEffect, useState } from "react"
import { authHeaders } from "../utils/authHeaders"

const DEFAULT_GROUP = {
    id: '',
    name: '',
    members: []
}

function GroupDetails() {
    const { id } = useParams()
    const [group, setGroup] = useState(DEFAULT_GROUP)

    useEffect(() => {
        fetch(`/api/groups/${id}`, {
            headers: authHeaders()
        })
        .then(res => res.json())
        .then(data => setGroup(data))
    }, [id])

    return (
        <div>
            <h2>{group.name}</h2>
            {group.members.map(g => (
                <div key={g.email}>{g.display_name}</div>
            ))}
        </div>
    )

}
export default GroupDetails