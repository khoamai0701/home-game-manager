import 'dotenv/config'
import express from 'express'
import gamesRouter from './routes/games.js'
import playersRouter from './routes/players.js'
import transactionsRouter from './routes/transactions.js'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'



const app = express();
app.use(cors({ origin: ['http://localhost:5173', 'https://home-game-manager.vercel.app'] }))
const PORT = process.env.PORT || 3002
const httpServer = createServer(app)
const io = new Server(httpServer, {
    cors: { origin: ['http://localhost:5173', 'https://home-game-manager.vercel.app'] }
})

io.on('connection', (socket) => {

    console.log('a user connected')
    socket.on('join-game', (gameId) => {
        // Always join as a string. Room names the server emits to are built with
        // String(game_id) (game_id comes back from Postgres as a number), so the
        // socket must join the string-typed room or io.to(...) never reaches it.
        const room = String(gameId)
        socket.join(room)
        console.log(`socket joined game ${room}`)
    })

})

app.use(express.json())
app.use('/api/games', gamesRouter)
app.use('/api/players', playersRouter(io))
app.use('/api/transactions', transactionsRouter(io))

// Fallback error handler so a thrown/rejected route handler returns JSON
// instead of a bare 500 (or crashing the process on older Express).
app.use((err, req, res, next) => {
    console.error(err)
    res.status(err.status || 500).json({ error: err.message || 'Internal server error' })
})

httpServer.listen(PORT,() =>{
    console.log(`Server running on http://localhost:${PORT}`)
} )