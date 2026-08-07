import CreateGame from './components/CreateGame'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import GamePage from './components/GamePage'

function App() {

  return (
    <BrowserRouter>
    <Routes>
      
      <Route path='/' element={<CreateGame />} />
      <Route path="/game/:id" element={<GamePage />} />
      

    </Routes>
    </BrowserRouter>
    
    
  )
}

export default App