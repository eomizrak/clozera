import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useLanguagesStore } from '@/stores/languages'

const api = vi.hoisted(() => ({
  get: vi.fn(),
}))

vi.mock('@/lib/api', () => ({
  default: api,
}))

describe('languages store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('loads language pair options', async () => {
    api.get
      .mockResolvedValueOnce({ data: { data: [{ code: 'de', name: 'German' }] } })
      .mockResolvedValueOnce({
        data: {
          data: [{ slug: 'deu-eng', name: 'German from English' }],
        },
      })

    const languages = useLanguagesStore()
    await languages.loadLanguages()

    expect(api.get).toHaveBeenNthCalledWith(1, '/languages')
    expect(api.get).toHaveBeenNthCalledWith(2, '/language-pairs')
    expect(languages.pairOptions).toEqual([
      {
        label: 'German from English',
        value: 'deu-eng',
        pair: { slug: 'deu-eng', name: 'German from English' },
      },
    ])
  })
})
