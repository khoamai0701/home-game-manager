function Login() {
  return (
    <div className="app-shell" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '1rem' }}>
      <h1>Home Game Manager</h1>
      <a href="https://home-game-manager-production.up.railway.app/api/auth/google">
        <button>Sign in with Google</button>
      </a>
    </div>
  )
}

export default Login