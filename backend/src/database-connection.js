import mongoose from 'mongoose'

async function connectDatabase() {
  if (!process.env.MONGODB_CONNECTION_STRING) {
    throw new Error('MONGODB_CONNECTION_STRING must be defined.')
  }

  await mongoose.connect(process.env.MONGODB_CONNECTION_STRING, {
    serverSelectionTimeoutMS: 5000,
  })
}

function isDatabaseReady() {
  return mongoose.connection.readyState === 1
}

async function disconnectDatabase() {
  await mongoose.disconnect()
}

export { connectDatabase, disconnectDatabase, isDatabaseReady }
