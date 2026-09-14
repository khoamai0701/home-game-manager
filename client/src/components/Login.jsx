import { useSearchParams } from 'react-router-dom'
import { LogoMark } from './Logo'
import { IconChips, IconGroups, IconStats } from './Icons'

const API_ORIGIN = 'https://home-game-manager-production.up.railway.app'

function Login() {
  const [searchParams] = useSearchParams()
  // RequireAuth and the session-expiry guard both send visitors here with
  // `?next=` set to wherever they were headed, so signing in lands them back
  // there instead of always dropping them on the dashboard.
  const redirectPath = searchParams.get('next') || '/home'
  const signInHref = `${API_ORIGIN}/api/auth/google?redirect=${encodeURIComponent(redirectPath)}`

  return (
    <div className="login">
      <div className="login__inner">
        <div className="brand brand--xl">
          <LogoMark size={46} />
          <span className="brand__word">Rebuy</span>
        </div>

        <p className="login__tagline">
          Track buy-ins, top-offs and cash-outs for your poker home game — and settle up
          without the argument.
        </p>

        <a className="btn btn--primary btn--lg btn--block" href={signInHref}>
          Sign in with Google
        </a>

        <div className="login__points">
          <div className="login__point">
            <span className="login__point-icon"><IconChips size={16} /></span>
            Run the table live — players request, the host approves.
          </div>
          <div className="login__point">
            <span className="login__point-icon"><IconGroups size={16} /></span>
            Keep a group of regulars and share every game with them.
          </div>
          <div className="login__point">
            <span className="login__point-icon"><IconStats size={16} /></span>
            See who's actually up over the whole season.
          </div>
        </div>

        <p className="login__foot">Free for your home game. No chips required.</p>
      </div>
    </div>
  )
}

export default Login
