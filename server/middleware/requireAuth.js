import jwt from 'jsonwebtoken'

function requireAuth(req, res, next) {
    
    const header = req.headers.authorization
    if (header) {
        const token = header.split(' ')[1]
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET)
            req.user = decoded
            next()
        } catch (error) {
            res.status(401).json({ error: 'Invalid or expired token' })
        }
       
    } else {
        res.status(401).json({ error: 'No token provided '})
    }
    
}
export default requireAuth