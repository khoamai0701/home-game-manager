import CreateGame from './components/CreateGame'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import GamePage from './components/GamePage'
import GameList from './components/GameList'
import Dashboard from './components/Dashboard'
import AuthCallback from './components/AuthCallback'
import Login from './components/Login'
function App() {

  return (
    <BrowserRouter>
    <Routes>
      
      <Route path='/' element={<Login/>} />
      <Route path='/create' element={<CreateGame />} />
      <Route path="/game/:id" element={<GamePage />} />
      <Route path = "/games" element={<GameList />} />
      <Route path= "/home" element={<Dashboard />}/>
      <Route path ="/auth/callback" element={<AuthCallback />} />
      

    </Routes>
    </BrowserRouter>
    
    
  )
}

export default App