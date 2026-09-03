import passport from "passport"
import { Strategy as GoogleStrategy } from "passport-google-oauth20"
import pool from './db.js'

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
},
async (acessToken, refreshToken, profile, done) => {
    try {
         const user = await pool.query('SELECT * FROM users WHERE google_id = $1', [profile.id])
    
        if (user.rows[0]) { //if user has connected via google before
            done(null, user.rows[0])
        } else { //New user (need to connect a new user with their google info)
            const result = await pool.query('INSERT INTO users (google_id, email, display_name, avatar_url) VALUES ($1, $2, $3, $4) RETURNING *',[profile.id, profile.emails[0].value, profile.displayName, profile.photos[0].value])

            const newUser = result.rows[0]
            done(null, newUser)
    }
    } catch (err) {
        done(err)
    }
   
}
))

export default passport