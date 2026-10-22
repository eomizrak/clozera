import { afterAll, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import request from 'supertest'
import * as languagesService from '../services/languages-service.js'
import * as database from '../database-connection.js'
import app from '../app.js'

vi.spyOn(languagesService, 'listLanguages').mockImplementation(() => undefined)
vi.spyOn(languagesService, 'listLanguagePairs').mockImplementation(() => undefined)
vi.spyOn(database, 'isDatabaseReady').mockReturnValue(false)

afterAll(() => vi.restoreAllMocks())

describe('app routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    database.isDatabaseReady.mockReturnValue(false)
    app.locals.shuttingDown = false
  })

  it('returns 503 when MongoDB is disconnected', async () => {
    const response = await request(app).get('/health/ready')
    expect(response.status).toBe(503)
    expect(response.body).toEqual({ status: 'not_ready' })
  })

  it('reports readiness without creating a session when MongoDB is connected', async () => {
    database.isDatabaseReady.mockReturnValue(true)
    const response = await request(app).get('/health/ready')
    expect(response.status).toBe(200)
    expect(response.body).toEqual({ status: 'ready' })
    expect(response.headers['cache-control']).toBe('no-store')
    expect(response.headers['set-cookie']).toBeUndefined()
  })

  it('reports not ready while shutting down even if MongoDB is connected', async () => {
    database.isDatabaseReady.mockReturnValue(true)
    app.locals.shuttingDown = true
    const response = await request(app).get('/health/ready')
    expect(response.status).toBe(503)
    expect(response.body).toEqual({ status: 'not_ready' })
  })

  it('returns the current anonymous session', async () => {
    const response = await request(app).get('/accounts/session')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ data: null })
  })

  it('lists languages through the public languages route', async () => {
    languagesService.listLanguages.mockResolvedValue([
      {
        id: 'language-1',
        code: 'de',
        name: 'German',
      },
    ])

    const response = await request(app).get('/languages')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      data: [
        {
          id: 'language-1',
          code: 'de',
          name: 'German',
        },
      ],
    })
    expect(languagesService.listLanguages).toHaveBeenCalledTimes(1)
  })

  it('rejects protected routes when the request is not authenticated', async () => {
    const response = await request(app).get('/collections')

    expect(response.status).toBe(401)
    expect(response.body).toEqual({
      error: {
        code: 'UNAUTHENTICATED',
        message: 'Authentication is required.',
        details: [],
      },
    })
  })

  it('returns a JSON 404 for unknown routes', async () => {
    const response = await request(app).get('/does-not-exist')

    expect(response.status).toBe(404)
    expect(response.body).toEqual({
      error: {
        code: 'NOT_FOUND',
        message: 'Not Found',
        details: [],
      },
    })
  })

  it('returns service errors with the shared error response format', async () => {
    const error = new Error('Language service failed.')
    error.status = 503
    error.code = 'LANGUAGE_SERVICE_UNAVAILABLE'

    languagesService.listLanguages.mockRejectedValue(error)

    const response = await request(app).get('/languages')

    expect(response.status).toBe(503)
    expect(response.body).toEqual({
      error: {
        code: 'LANGUAGE_SERVICE_UNAVAILABLE',
        message: 'Language service failed.',
        details: [],
      },
    })
  })
})
