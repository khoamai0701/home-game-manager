import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";


function AuthCallback() {
    const [searchParams] = useSearchParams()
    const token = searchParams.get('token')
    const state = searchParams.get('state')
    const navigate = useNavigate()
    useEffect(() => {
        
        localStorage.setItem('token', token)
        navigate(state)

    }, [])

    return null
}
export default AuthCallback