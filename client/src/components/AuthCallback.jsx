import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

function AuthCallback() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()

    useEffect(() => {
        const token = searchParams.get('token')
        const redirectPath = searchParams.get('redirect') || '/home'

        // No token means the OAuth round trip failed upstream — storing the
        // literal string "null" here used to silently break every future
        // authHeaders() call, so bail out to login instead.
        if (!token) {
            navigate('/', { replace: true })
            return
        }

        localStorage.setItem('token', token)
        navigate(redirectPath, { replace: true })
        // Runs once for this one-time callback — searchParams/navigate are
        // stable enough here that re-running on their identity changing would
        // just repeat the same redirect.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <main className="page page--center">
            <div className="loading"><span className="spinner" />Signing you in…</div>
        </main>
    )
}
export default AuthCallback
