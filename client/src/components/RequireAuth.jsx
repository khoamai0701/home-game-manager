import { Navigate, Outlet, useLocation } from 'react-router-dom'

/**
 * Guards every route nested under it. With no token, bounce straight to login
 * instead of letting the page render and its fetches fail one by one — and
 * remember where the user was headed via `?next=` so they land back there
 * after signing in.
 */
function RequireAuth() {
    const location = useLocation()
    const hasToken = Boolean(localStorage.getItem('token'))

    if (!hasToken) {
        const next = `${location.pathname}${location.search}`
        return <Navigate to={`/?next=${encodeURIComponent(next)}`} replace />
    }

    return <Outlet />
}

export default RequireAuth
