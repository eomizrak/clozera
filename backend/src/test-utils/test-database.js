import mongoose from 'mongoose'

const localHosts = new Set(['localhost', '127.0.0.1', '[::1]', '::1', 'mongodb', 'mongo', 'host.docker.internal'])

function normalizedHost(host) {
  return ['localhost', '127.0.0.1', '[::1]', '::1'].includes(host) ? 'loopback' : host
}

function testDatabaseTarget() {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Test database operations require NODE_ENV=test.')
  }

  const uri = process.env.TEST_MONGODB_CONNECTION_STRING
  if (!uri) {
    throw new Error('TEST_MONGODB_CONNECTION_STRING must be defined for integration tests.')
  }

  let target
  let databaseName
  try {
    target = new URL(uri)
    databaseName = decodeURIComponent(target.pathname.slice(1))
  } catch {
    throw new Error('TEST_MONGODB_CONNECTION_STRING must be a valid local MongoDB URI.')
  }

  if (
    target.protocol !== 'mongodb:' ||
    !localHosts.has(target.hostname) ||
    !/^clozera[-_]test(?:[-_][a-z0-9_-]+)?$/.test(databaseName)
  ) {
    throw new Error('Integration tests require a local MongoDB URI with a clozera-test or clozera_test database name.')
  }

  return { uri, databaseName, host: normalizedHost(target.hostname), port: Number(target.port || 27017) }
}

function assertTestConnection(target) {
  const { connection } = mongoose
  if (
    connection.readyState !== 1 ||
    connection.name !== target.databaseName ||
    normalizedHost(connection.host) !== target.host ||
    connection.port !== target.port
  ) {
    throw new Error('Refusing to clear or reuse a MongoDB connection that does not match the validated test target.')
  }
}

async function connectTestDatabase() {
  const target = testDatabaseTarget()
  if (mongoose.connection.readyState === 1) {
    assertTestConnection(target)
    return
  }

  try {
    await mongoose.connect(target.uri, {
      serverSelectionTimeoutMS: 2000,
    })
  } catch {
    throw new Error(
      'Could not connect to the integration test database. Start local MongoDB or update TEST_MONGODB_CONNECTION_STRING.'
    )
  }
  assertTestConnection(target)
}

async function clearTestDatabase() {
  const target = testDatabaseTarget()
  assertTestConnection(target)
  const collections = Object.values(mongoose.connection.collections)

  await Promise.all(collections.map(collection => collection.deleteMany({})))
}

async function disconnectTestDatabase() {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close()
  }
}

export { clearTestDatabase, connectTestDatabase, disconnectTestDatabase }
