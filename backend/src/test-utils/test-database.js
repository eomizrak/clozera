const mongoose = require('mongoose')

async function connectTestDatabase() {
  if (mongoose.connection.readyState === 1) {
    return
  }

  if (!process.env.MONGODB_CONNECTION_STRING) {
    throw new Error('MONGODB_CONNECTION_STRING must be defined for integration tests.')
  }

  try {
    await mongoose.connect(process.env.MONGODB_CONNECTION_STRING, {
      serverSelectionTimeoutMS: 2000,
    })
  } catch (error) {
    throw new Error(
      `Could not connect to the integration test database at ${process.env.MONGODB_CONNECTION_STRING}. Start MongoDB or update .env.test.local. Original error: ${error.message}`,
      { cause: error }
    )
  }
}

async function clearTestDatabase() {
  const collections = Object.values(mongoose.connection.collections)

  await Promise.all(collections.map(collection => collection.deleteMany({})))
}

async function disconnectTestDatabase() {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close()
  }
}

module.exports = {
  clearTestDatabase,
  connectTestDatabase,
  disconnectTestDatabase,
}
