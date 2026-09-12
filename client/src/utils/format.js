/**
 * Presentation helpers. Pure formatting only — no fetching, no state.
 */

/** `$1,240` / `-$45`. Keeps the minus outside the symbol. */
export function formatMoney(value) {
    const n = Number(value) || 0
    const sign = n < 0 ? '-' : ''
    return `${sign}$${Math.abs(n).toLocaleString()}`
}

/** `+$320` / `-$45` / `$0` — for profit figures where the sign carries meaning. */
export function formatSigned(value) {
    const n = Number(value) || 0
    if (n === 0) return '$0'
    return `${n > 0 ? '+' : '-'}$${Math.abs(n).toLocaleString()}`
}

/**
 * Game dates are stored as TEXT (`YYYY-MM-DD` from a date input). Parse the
 * parts by hand — `new Date('2026-09-12')` is treated as UTC and lands on the
 * previous day for anyone west of Greenwich.
 */
export function parseDay(value) {
    if (!value) return null
    const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
}

/** `Today` / `Yesterday` / `Fri, Sep 12` / `Sep 12, 2025` for older years. */
export function formatGameDate(value) {
    const date = parseDay(value)
    if (!date) return String(value ?? '')

    const today = new Date()
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const days = Math.round((date - startOfToday) / 86400000)

    if (days === 0) return 'Today'
    if (days === -1) return 'Yesterday'
    if (days === 1) return 'Tomorrow'

    if (date.getFullYear() !== today.getFullYear()) {
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    }
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

/** `2:45 PM` from a transaction timestamp. */
export function formatTime(value) {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

/** `1 game` / `4 games` */
export function plural(count, word, suffix = 's') {
    return `${count} ${word}${count === 1 ? '' : suffix}`
}
