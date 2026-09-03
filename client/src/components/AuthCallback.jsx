import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";


function AuthCallback() {
    const [searchParams] = useSearchParams()
    const token = searchParams.get('token')
    const navigate = useNavigate()
    useEffect(() => {
        
        localStorage.setItem('token', token)
        navigate('/home')

    }, [])

    return null
}
export default AuthCallback