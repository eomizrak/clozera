import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAccountStore } from '@/stores/account'

const api = vi.hoisted(() => ({
  delete: vi.fn(),
  get: vi.fn(),
  patch: vi.fn(),
  post: vi.fn(),
}))

vi.mock('@/lib/api', () => ({
  default: api,
}))

describe('account store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('restores the current session', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        data: {
          id: 'user-1',
          name: 'Ada Lovelace',
          selectedLanguagePair: { slug: 'deu-eng', name: 'German from English' },
        },
      },
    })

    const account = useAccountStore()
    await account.refreshSession()

    expect(api.get).toHaveBeenCalledWith('/accounts/session')
    expect(account.hasLoaded).toBe(true)
    expect(account.selectedLanguagePairSlug).toBe('deu-eng')
    expect(account.initials).toBe('AL')
  })

  it('logs in and logs out', async () => {
    api.post.mockResolvedValueOnce({
      data: {
        data: {
          id: 'user-1',
          name: 'Ada',
        },
      },
    })
    api.delete.mockResolvedValueOnce({})

    const account = useAccountStore()
    await account.login({ email: 'ada@example.com', password: 'secret' })

    expect(api.post).toHaveBeenCalledWith('/accounts/session', {
      email: 'ada@example.com',
      password: 'secret',
    })
    expect(account.user.name).toBe('Ada')

    await account.logout()

    expect(api.delete).toHaveBeenCalledWith('/accounts/session')
    expect(account.user).toBeNull()
  })

  it('updates the selected language pair through the profile endpoint', async () => {
    api.patch.mockResolvedValueOnce({
      data: {
        data: {
          id: 'user-1',
          selectedLanguagePair: { slug: 'spa-eng', name: 'Spanish from English' },
        },
      },
    })

    const account = useAccountStore()
    await account.updateSelectedLanguagePair('spa-eng')

    expect(api.patch).toHaveBeenCalledWith('/users/me', {
      selectedLanguagePairSlug: 'spa-eng',
    })
    expect(account.selectedLanguagePairSlug).toBe('spa-eng')
  })
})
