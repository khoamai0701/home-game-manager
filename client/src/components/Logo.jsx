/**
 * Rebuy wordmark. The mark is a poker chip — an outer ring of six edge spots
 * around a plain centre — drawn in currentColor so it inherits the accent.
 */

export function LogoMark({ size = 26 }) {
    return (
        <svg
            className="brand__mark"
            width={size}
            height={size}
            viewBox="0 0 32 32"
            fill="none"
            aria-hidden="true"
            focusable="false"
        >
            <circle cx="16" cy="16" r="15" fill="currentColor" opacity="0.14" />
            {/* six chip edge spots: circumference 2*pi*11.5 ~= 72.3, six 12.05 steps */}
            <circle
                cx="16"
                cy="16"
                r="11.5"
                stroke="currentColor"
                strokeWidth="3.2"
                strokeDasharray="4.2 7.85"
                strokeLinecap="round"
            />
            <circle cx="16" cy="16" r="7.4" stroke="currentColor" strokeWidth="2.1" />
            <circle cx="16" cy="16" r="2.7" fill="currentColor" />
        </svg>
    )
}

function Logo({ size = 26, showWord = true }) {
    return (
        <>
            <LogoMark size={size} />
            {showWord && <span className="brand__word">Rebuy</span>}
        </>
    )
}

export default Logo
