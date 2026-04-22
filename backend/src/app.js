const createError = require('http-errors')
const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const logger = require('morgan')
const cors = require('cors')
const session = require('express-session')
const MongoStore = require('connect-mongo').default
const mongoose = require('mongoose')
const passport = require('passport')

const dotenvOptions = { quiet: process.env.NODE_ENV === 'test' }

if (process.env.DOTENV_CONFIG_PATH) {
  dotenvOptions.path = process.env.DOTENV_CONFIG_PATH
}

require('dotenv').config(dotenvOptions)

require('./database-connection')

const accountsRouter = require('./routes/accounts')
const adminRouter = require('./routes/admin')
const collectionsRouter = require('./routes/collections')
const dashboardRouter = require('./routes/dashboard')
const languagesRouter = require('./routes/languages')

const User = require('./models/user')

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
    maxAge: 1000 * 60 * 60 * 24 * 15,
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
app.use(express.static(path.join(__dirname, 'public')))

app.use('/accounts', accountsRouter)
app.use(languagesRouter)
app.use(collectionsRouter)
app.use(dashboardRouter)
app.use(adminRouter)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404))
})

// error handler
// eslint-disable-next-line no-unused-vars
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

module.exports = app
