/**
 * Globally handles session expiry. Every fetch in this app hits a same-origin
 * `/api/*` route, so patching `fetch` once here is far simpler than adding
 * 401-handling to every individual call site: if a request that WAS sent with
 * a token comes back 401, the token is stale or expired, so clear it and send
 * the user back to sign in (preserving where they were via `?next=`) instead
 * of leaving the page stuck on a failed fetch or looping forever.
 *
 * A 401 with NO token present is left alone — that's an anonymous visitor
 * opening a shared game link for the first time, which GamePage already
 * handles with its own contextual "sign in to join" screen.
 */
const originalFetch = window.fetch.bind(window)

window.fetch = async (...args) => {
    const response = await originalFetch(...args)

    if (response.status === 401) {
        const request = args[0]
        const url = typeof request === 'string' ? request : request?.url
        const hadToken = Boolean(localStorage.getItem('token'))

        if (hadToken && url && url.startsWith('/api/')) {
            localStorage.removeItem('token')
            if (window.location.pathname !== '/') {
                const next = `${window.location.pathname}${window.location.search}`
                window.location.assign(`/?next=${encodeURIComponent(next)}`)
            }
        }
    }

    return response
}
