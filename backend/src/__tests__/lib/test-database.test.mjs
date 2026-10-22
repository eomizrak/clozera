import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import mongoose from 'mongoose'
import { clearTestDatabase, connectTestDatabase } from '../../test-utils/test-database.js'

describe('integration database protection', () => {
  let connection
  let deleteMany

  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'test')
    vi.stubEnv('TEST_MONGODB_CONNECTION_STRING', 'mongodb://127.0.0.1:27017/clozera-test')
    deleteMany = vi.fn().mockResolvedValue({ deletedCount: 0 })
    connection = {
      readyState: 1,
      name: 'clozera-test',
      host: '127.0.0.1',
      port: 27017,
      collections: { sentences: { deleteMany } },
    }
    vi.spyOn(mongoose, 'connection', 'get').mockReturnValue(connection)
    vi.spyOn(mongoose, 'connect').mockResolvedValue(mongoose)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it('never falls back to the application connection string', async () => {
    vi.stubEnv('TEST_MONGODB_CONNECTION_STRING', undefined)
    vi.stubEnv('MONGODB_CONNECTION_STRING', 'mongodb://localhost:27017/clozera')
    await expect(connectTestDatabase()).rejects.toThrow('TEST_MONGODB_CONNECTION_STRING must be defined')
    expect(mongoose.connect).not.toHaveBeenCalled()
  })

  it('rejects connection and deletion outside the test environment', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    await expect(connectTestDatabase()).rejects.toThrow('NODE_ENV=test')
    await expect(clearTestDatabase()).rejects.toThrow('NODE_ENV=test')
    expect(mongoose.connect).not.toHaveBeenCalled()
    expect(deleteMany).not.toHaveBeenCalled()
  })

  it.each([
    'mongodb://localhost:27017/clozera',
    'mongodb://localhost:27017/clozera-prod',
    'mongodb://localhost:27017/',
    'mongodb://localhost:27017/%63lozera',
    'mongodb://production.example:27017/clozera-test',
    'mongodb+srv://cluster.example/clozera-test',
    'not-a-uri',
  ])('rejects unsafe targets before connecting or deleting: %s', async uri => {
    vi.stubEnv('TEST_MONGODB_CONNECTION_STRING', uri)
    await expect(connectTestDatabase()).rejects.toThrow(/local MongoDB URI/)
    await expect(clearTestDatabase()).rejects.toThrow(/local MongoDB URI/)
    expect(mongoose.connect).not.toHaveBeenCalled()
    expect(deleteMany).not.toHaveBeenCalled()
  })

  it('refuses to reuse a pre-existing application connection', async () => {
    connection.name = 'clozera'
    await expect(connectTestDatabase()).rejects.toThrow('does not match')
    await expect(clearTestDatabase()).rejects.toThrow('does not match')
    expect(mongoose.connect).not.toHaveBeenCalled()
    expect(deleteMany).not.toHaveBeenCalled()
  })

  it('checks the actual connection host before deletion', async () => {
    connection.host = 'production.example'
    await expect(clearTestDatabase()).rejects.toThrow('does not match')
    expect(deleteMany).not.toHaveBeenCalled()
  })

  it('refuses deletion on a disconnected connection', async () => {
    connection.readyState = 0
    await expect(clearTestDatabase()).rejects.toThrow('does not match')
    expect(deleteMany).not.toHaveBeenCalled()
  })

  it('rejects an existing connection on a different local server', async () => {
    connection.host = 'mongodb'
    await expect(clearTestDatabase()).rejects.toThrow('does not match')
    expect(deleteMany).not.toHaveBeenCalled()
  })

  it('rejects an existing connection on a different local port', async () => {
    connection.port = 27018
    await expect(clearTestDatabase()).rejects.toThrow('does not match')
    expect(deleteMany).not.toHaveBeenCalled()
  })

  it('clears a validated dedicated test connection', async () => {
    await connectTestDatabase()
    await clearTestDatabase()
    expect(mongoose.connect).not.toHaveBeenCalled()
    expect(deleteMany).toHaveBeenCalledExactlyOnceWith({})
  })

  it('supports isolated test database suffixes on the Compose MongoDB service', async () => {
    vi.stubEnv('TEST_MONGODB_CONNECTION_STRING', 'mongodb://mongodb:27017/clozera_test_maintenance')
    connection.readyState = 0
    mongoose.connect.mockImplementation(async () => {
      Object.assign(connection, { readyState: 1, name: 'clozera_test_maintenance', host: 'mongodb' })
      return mongoose
    })
    await connectTestDatabase()
    await clearTestDatabase()
    expect(deleteMany).toHaveBeenCalledExactlyOnceWith({})
  })
})
