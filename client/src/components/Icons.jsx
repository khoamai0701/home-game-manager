/**
 * Inline stroke icons (24x24, currentColor) so the UI has no emoji and no
 * icon-font dependency. Size with the `size` prop; color via CSS `color`.
 */

function Svg({ size = 20, children, ...rest }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
            {...rest}
        >
            {children}
        </svg>
    )
}

export function IconHome(props) {
    return (
        <Svg {...props}>
            <path d="M3 9.5 12 3l9 6.5V20a1.5 1.5 0 0 1-1.5 1.5h-4v-7h-7v7h-4A1.5 1.5 0 0 1 3 20z" />
        </Svg>
    )
}

export function IconGames(props) {
    return (
        <Svg {...props}>
            <rect x="3" y="4" width="12" height="16" rx="2" />
            <path d="M17.5 6.2 20 7a2 2 0 0 1 1.3 2.5l-3.1 9.2" />
            <path d="M9 9.5h0" />
        </Svg>
    )
}

export function IconGroups(props) {
    return (
        <Svg {...props}>
            <path d="M16 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20" />
            <circle cx="9" cy="7" r="3.5" />
            <path d="M22 20v-1.5a4 4 0 0 0-3-3.87" />
            <path d="M16 3.7a4 4 0 0 1 0 7.6" />
        </Svg>
    )
}

export function IconStats(props) {
    return (
        <Svg {...props}>
            <path d="M4 20V4" />
            <path d="M4 20h16" />
            <path d="M8 20v-5" />
            <path d="M13 20V9" />
            <path d="M18 20v-8" />
        </Svg>
    )
}

export function IconSignOut(props) {
    return (
        <Svg {...props}>
            <path d="M9.5 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.5" />
            <path d="m16 16.5 4.5-4.5L16 7.5" />
            <path d="M20.5 12H10" />
        </Svg>
    )
}

export function IconChevronLeft(props) {
    return (
        <Svg {...props}>
            <path d="m15 18-6-6 6-6" />
        </Svg>
    )
}

export function IconChevronRight(props) {
    return (
        <Svg {...props}>
            <path d="m9 18 6-6-6-6" />
        </Svg>
    )
}

export function IconPlus(props) {
    return (
        <Svg {...props}>
            <path d="M12 5v14" />
            <path d="M5 12h14" />
        </Svg>
    )
}

export function IconCheck(props) {
    return (
        <Svg {...props}>
            <path d="m20 6.5-11 11-5-5" />
        </Svg>
    )
}

export function IconClose(props) {
    return (
        <Svg {...props}>
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
        </Svg>
    )
}

export function IconLink(props) {
    return (
        <Svg {...props}>
            <path d="M10.5 13.5a4.5 4.5 0 0 0 6.8.5l2.7-2.7a4.5 4.5 0 0 0-6.4-6.4l-1.5 1.5" />
            <path d="M13.5 10.5a4.5 4.5 0 0 0-6.8-.5L4 12.7a4.5 4.5 0 0 0 6.4 6.4l1.5-1.5" />
        </Svg>
    )
}

export function IconEdit(props) {
    return (
        <Svg {...props}>
            <path d="M12 20h8.5" />
            <path d="M16.5 3.9a2.1 2.1 0 0 1 3 3L8 18.4 4 19.5l1.1-4z" />
        </Svg>
    )
}

export function IconTrash(props) {
    return (
        <Svg {...props}>
            <path d="M3.5 6h17" />
            <path d="M18.5 6v13a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2V6" />
            <path d="M9 6V4.5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 4.5V6" />
        </Svg>
    )
}

export function IconClock(props) {
    return (
        <Svg {...props}>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5.2l3.2 1.9" />
        </Svg>
    )
}

export function IconTrophy(props) {
    return (
        <Svg {...props}>
            <path d="M7 4h10v5a5 5 0 0 1-10 0z" />
            <path d="M7 5.5H4.5V7a3.5 3.5 0 0 0 3 3.46" />
            <path d="M17 5.5h2.5V7a3.5 3.5 0 0 1-3 3.46" />
            <path d="M12 14v3.5" />
            <path d="M8.5 21h7l-.8-3.5h-5.4z" />
        </Svg>
    )
}

export function IconMail(props) {
    return (
        <Svg {...props}>
            <rect x="2.5" y="5" width="19" height="14" rx="2" />
            <path d="m3 6.5 9 6 9-6" />
        </Svg>
    )
}

export function IconUser(props) {
    return (
        <Svg {...props}>
            <circle cx="12" cy="8" r="3.75" />
            <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" />
        </Svg>
    )
}

export function IconChips(props) {
    return (
        <Svg {...props}>
            <circle cx="12" cy="12" r="8.5" />
            <circle cx="12" cy="12" r="3.5" />
            <path d="M12 3.5v2.2" />
            <path d="M12 18.3v2.2" />
            <path d="M3.5 12h2.2" />
            <path d="M18.3 12h2.2" />
        </Svg>
    )
}

export function IconSpade(props) {
    return (
        <Svg {...props}>
            <path d="M12 3.5c0 0-6.5 5.2-6.5 9.1a3.6 3.6 0 0 0 6.5 2.1 3.6 3.6 0 0 0 6.5-2.1c0-3.9-6.5-9.1-6.5-9.1z" />
            <path d="M12 14.7V20.5" />
            <path d="M9.5 20.5h5" />
        </Svg>
    )
}

export function IconFlag(props) {
    return (
        <Svg {...props}>
            <path d="M5 21V4" />
            <path d="M5 4.5h11l-1.8 4 1.8 4H5" />
        </Svg>
    )
}

export function IconInbox(props) {
    return (
        <Svg {...props}>
            <path d="M3.5 13h4l1.5 2.5h6L16.5 13h4" />
            <path d="M5.7 5h12.6a2 2 0 0 1 1.9 1.4L21.5 13v4a2 2 0 0 1-2 2h-15a2 2 0 0 1-2-2v-4L3.8 6.4A2 2 0 0 1 5.7 5z" />
        </Svg>
    )
}
