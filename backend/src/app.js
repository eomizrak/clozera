import './config/environment.js'
import createError from 'http-errors'
import express from 'express'
import path from 'node:path'
import cookieParser from 'cookie-parser'
import logger from 'morgan'
import cors from 'cors'
import session from 'express-session'
import MongoStore from 'connect-mongo'
import mongoose from 'mongoose'
import passport from 'passport'
import './database-connection.js'
import accountsRouter from './routes/accounts.js'
import adminRouter from './routes/admin.js'
import collectionsRouter from './routes/collections.js'
import languagesRouter from './routes/languages.js'
import usersRouter from './routes/users.js'
import User from './models/user.js'

passport.use(User.createStrategy())
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

const app = express()
const isProduction = process.env.NODE_ENV === 'production'
const isTest = process.env.NODE_ENV === 'test'
const frontendUrl = process.env.FRONTEND_URL
const sessionSecret = process.env.SESSION_SECRET

if (isProduction && !sessionSecret) {
  throw new Error('SESSION_SECRET must be defined in production.')
}

if (isProduction && !frontendUrl) {
  throw new Error('FRONTEND_URL must be defined in production.')
}

if (isProduction) {
  app.set('trust proxy', 1)
}

app.use(
  cors({
    origin: frontendUrl || true,
    credentials: true,
  })
)

const clientPromise = isTest ? null : mongoose.connection.asPromise().then(connection => connection.getClient())

const sessionMiddleware = session({
  secret: sessionSecret || 'development-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction,
    maxAge: 1000 * 60 * 60 * 24 * 15, // 15 days
  },
  store: isTest ? undefined : MongoStore.create({ clientPromise, stringify: false }),
})

if (!isTest) {
  app.use(logger('dev'))
}
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(sessionMiddleware)
app.use(passport.initialize())
app.use(passport.session())
app.use(express.static(path.join(import.meta.dirname, 'public')))

app.use('/accounts', accountsRouter)
app.use(languagesRouter)
app.use(usersRouter)
app.use(collectionsRouter)
app.use(adminRouter)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404))
})

// error handler
// oxlint-disable-next-line no-unused-vars
app.use(function (err, req, res, next) {
  if (!isTest) {
    console.log(err)
  }

  res.status(err.status || 500)
  res.json({
    error: {
      code: err.code || (err.status === 404 ? 'NOT_FOUND' : 'INTERNAL_SERVER_ERROR'),
      message: isProduction ? 'Unexpected server error.' : err.message,
      details: err.details || [],
    },
  })
})

export default app
