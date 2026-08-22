import express from 'express'
import gamesRouter from './routes/games.js'
import playersRouter from './routes/players.js'
import transactionsRouter from './routes/transactions.js'
import { createServer } from 'http'
import { Server } from 'socket.io'


const app = express();
const PORT = 3002
const httpServer = createServer(app)
const io = new Server(httpServer, {
    cors: { origin: 'http://localhost:5173'}
})

io.on('connection', (socket) => {

    console.log('a user connected')
    socket.on('join-game', (gameId) => {
        socket.join(gameId)
        console.log(`socket joined game ${gameId}`)
    })
    
})

app.use(express.json())
app.use('/api/games', gamesRouter)
app.use('/api/players', playersRouter(io))
app.use('/api/transactions', transactionsRouter(io))

httpServer.listen(PORT,() =>{
    console.log(`Server running on http://localhost:${PORT}`)
} )