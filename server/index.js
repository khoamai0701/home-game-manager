import express from 'express'
import gamesRouter from './routes/games.js'
import playersRouter from './routes/players.js'
import transactionsRouter from './routes/transactions.js'


const app = express();
const PORT = 3002

app.use(express.json())
app.use('/api/games', gamesRouter)
app.use('/api/players', playersRouter)
app.use('/api/transactions', transactionsRouter)

app.listen(PORT,() =>{
    console.log(`Server running on http://localhost:${PORT}`)
} )