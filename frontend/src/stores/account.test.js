import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
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
    useAccountStore.setState(useAccountStore.getInitialState(), true)
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

    await useAccountStore.getState().refreshSession()

    expect(api.get).toHaveBeenCalledWith('/accounts/session')
    expect(useAccountStore.getState().hasLoaded).toBe(true)
    expect(useAccountStore.getState().selectedLanguagePairSlug).toBe('deu-eng')
    expect(useAccountStore.getState().initials).toBe('AL')
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

    await useAccountStore.getState().login({ email: 'ada@example.com', password: 'secret' })

    expect(api.post).toHaveBeenCalledWith('/accounts/session', {
      email: 'ada@example.com',
      password: 'secret',
    })
    expect(useAccountStore.getState().user.name).toBe('Ada')

    await useAccountStore.getState().logout()

    expect(api.delete).toHaveBeenCalledWith('/accounts/session')
    expect(useAccountStore.getState().user).toBeNull()
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

    await useAccountStore.getState().updateSelectedLanguagePair('spa-eng')

    expect(api.patch).toHaveBeenCalledWith('/users/me', {
      selectedLanguagePairSlug: 'spa-eng',
    })
    expect(useAccountStore.getState().selectedLanguagePairSlug).toBe('spa-eng')
  })
})
