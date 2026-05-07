#!/usr/bin/env node

const mongoose = require('mongoose')

const dotenvOptions = { quiet: true }

if (process.env.DOTENV_CONFIG_PATH) {
  dotenvOptions.path = process.env.DOTENV_CONFIG_PATH
}

require('dotenv').config(dotenvOptions)

const User = require('../src/models/user')

async function connectDatabase() {
  if (!process.env.MONGODB_CONNECTION_STRING) {
    throw new Error('MONGODB_CONNECTION_STRING must be defined.')
  }

  await mongoose.connect(process.env.MONGODB_CONNECTION_STRING)
}

function requireValue(name) {
  const value = process.env[name]

  if (!value) {
    throw new Error(`${name} must be defined.`)
  }

  return value
}

async function upsertAdmin() {
  const email = requireValue('ADMIN_EMAIL').trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD
  const username = (process.env.ADMIN_USERNAME || email.split('@')[0]).trim().toLowerCase()
  const name = (process.env.ADMIN_NAME || username).trim()
  const timezone = (process.env.ADMIN_TIMEZONE || 'UTC').trim()
  const existingUser = await User.findOne({ email })

  if (!existingUser && !password) {
    throw new Error('ADMIN_PASSWORD must be defined when creating a new admin user.')
  }

  if (existingUser) {
    existingUser.set({
      name,
      username,
      role: 'admin',
      timezone,
    })

    if (password) {
      await existingUser.setPassword(password)
    }

    await existingUser.save()
    return { user: existingUser, created: false, passwordChanged: Boolean(password) }
  }

  const user = new User({
    name,
    username,
    email,
    role: 'admin',
    timezone,
  })
  const registeredUser = await User.register(user, password)

  return { user: registeredUser, created: true, passwordChanged: true }
}

async function main() {
  await connectDatabase()

  const result = await upsertAdmin()
  console.log(`${result.created ? 'Created' : 'Updated'} admin user: ${result.user.email}`)

  if (result.passwordChanged) {
    console.log('Password set from ADMIN_PASSWORD.')
  } else {
    console.log('Password unchanged. Set ADMIN_PASSWORD to change it.')
  }
}

main()
  .catch(error => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await mongoose.disconnect()
  })
