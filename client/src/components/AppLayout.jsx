import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import Logo from './Logo'
import { IconHome, IconGames, IconGroups, IconStats, IconSignOut, IconUser } from './Icons'

const LINKS = [
    { to: '/home', label: 'Home', Icon: IconHome },
    { to: '/games', label: 'Games', Icon: IconGames },
    { to: '/groups', label: 'Groups', Icon: IconGroups },
    { to: '/stats', label: 'Stats', Icon: IconStats },
    { to: '/profile', label: 'Profile', Icon: IconUser },
]

/**
 * Chrome for every authenticated page: top bar on desktop, bottom tab bar on
 * phones. A shared game link opened by a signed-out visitor renders bare, so
 * they aren't shown nav they can't use.
 */
function AppLayout() {
    const navigate = useNavigate()
    const signedIn = Boolean(localStorage.getItem('token'))

    function handleSignOut() {
        localStorage.removeItem('token')
        navigate('/')
    }

    return (
        <div className="app-frame">
            {signedIn && (
                <header className="nav">
                    <div className="nav__inner">
                        <NavLink to="/home" className="brand" aria-label="Rebuy — home">
                            <Logo />
                        </NavLink>

                        <nav className="nav__links" aria-label="Main">
                            {LINKS.map(({ to, label, Icon }) => (
                                <NavLink
                                    key={to}
                                    to={to}
                                    className={({ isActive }) => `nav__link${isActive ? ' nav__link--active' : ''}`}
                                >
                                    <Icon size={16} />
                                    {label}
                                </NavLink>
                            ))}
                        </nav>

                        <span className="nav__spacer" />

                        <button className="btn btn--ghost btn--sm nav__signout" onClick={handleSignOut}>
                            <IconSignOut size={16} />
                            Sign out
                        </button>
                    </div>
                </header>
            )}

            <Outlet />

            {signedIn && (
                <nav className="tabbar" aria-label="Main">
                    <div className="tabbar__inner">
                        {LINKS.map(({ to, label, Icon }) => (
                            <NavLink
                                key={to}
                                to={to}
                                className={({ isActive }) => `tabbar__link${isActive ? ' tabbar__link--active' : ''}`}
                            >
                                <Icon size={20} />
                                <span className="tabbar__label">{label}</span>
                            </NavLink>
                        ))}
                        <button className="tabbar__link" onClick={handleSignOut}>
                            <IconSignOut size={20} />
                            <span className="tabbar__label">Sign out</span>
                        </button>
                    </div>
                </nav>
            )}
        </div>
    )
}

export default AppLayout
