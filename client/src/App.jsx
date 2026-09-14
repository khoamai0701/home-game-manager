import CreateGame from './components/CreateGame'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import GamePage from './components/GamePage'
import GameList from './components/GameList'
import Dashboard from './components/Dashboard'
import AuthCallback from './components/AuthCallback'
import Login from './components/Login'
import CreateGroups from './components/CreateGroups'
import GroupsList from './components/GroupsList'
import GroupDetails from './components/GroupDetails'
import Stats from './components/Stats'
import Profile from './components/Profile'
import AppLayout from './components/AppLayout'
import RequireAuth from './components/RequireAuth'


function App() {

  return (
    <BrowserRouter>
    <Routes>

      {/* Bare routes: no app chrome. */}
      <Route path='/' element={<Login/>} />
      <Route path ="/auth/callback" element={<AuthCallback />} />

      {/* Everything else shares the nav / tab bar. */}
      <Route element={<AppLayout />}>
        {/* Public-ish: has its own sign-in prompt for an anonymous visitor
            opening a shared link, so it isn't forced through RequireAuth. */}
        <Route path="/game/:id" element={<GamePage />} />

        <Route element={<RequireAuth />}>
          <Route path='/create' element={<CreateGame />} />
          <Route path = "/games" element={<GameList />} />
          <Route path= "/home" element={<Dashboard />}/>
          <Route path = '/create-group' element={<CreateGroups />} />
          <Route path = '/groups' element={<GroupsList />} />
          <Route path = '/groups/:id' element={<GroupDetails />} />
          <Route path = '/stats' element={<Stats />} />
          <Route path = '/profile' element={<Profile />} />
        </Route>
      </Route>

    </Routes>
    </BrowserRouter>


  )
}

export default App
