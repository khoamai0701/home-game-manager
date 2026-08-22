import CreateGame from './components/CreateGame'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import GamePage from './components/GamePage'
import GameList from './components/GameList'

function App() {

  return (
    <BrowserRouter>
    <Routes>
      
      <Route path='/' element={<CreateGame />} />
      <Route path="/game/:id" element={<GamePage />} />
      <Route path = "/games" element={<GameList />} />
      

    </Routes>
    </BrowserRouter>
    
    
  )
}

export default App