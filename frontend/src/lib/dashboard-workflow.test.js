import { describe, expect, it, vi } from 'vitest'
import {
  DASHBOARD_SCROLL_KEY,
  DASHBOARD_SECTION_KEY,
  DASHBOARD_SECTIONS,
  loadDashboardSection,
  readDashboardScrollY,
  readDashboardSection,
  restoreDashboardScroll,
  saveDashboardState,
} from '@/lib/dashboard-workflow'

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial))

  return {
    getItem: vi.fn((key) => values.get(key) ?? null),
    setItem: vi.fn((key, value) => values.set(key, value)),
  }
}

describe('dashboard workflow', () => {
  it('reads and saves dashboard state', () => {
    const storage = memoryStorage({
      [DASHBOARD_SECTION_KEY]: DASHBOARD_SECTIONS.collections,
      [DASHBOARD_SCROLL_KEY]: '120',
    })

    expect(readDashboardSection(storage)).toBe(DASHBOARD_SECTIONS.collections)
    expect(readDashboardScrollY(storage)).toBe(120)

    saveDashboardState({
      section: DASHBOARD_SECTIONS.dashboard,
      scrollY: 24,
      storage,
    })

    expect(storage.setItem).toHaveBeenCalledWith(DASHBOARD_SECTION_KEY, DASHBOARD_SECTIONS.dashboard)
    expect(storage.setItem).toHaveBeenCalledWith(DASHBOARD_SCROLL_KEY, '24')
  })

  it('falls back when saved values are invalid', () => {
    const storage = memoryStorage({
      [DASHBOARD_SECTION_KEY]: 'missing',
      [DASHBOARD_SCROLL_KEY]: '-1',
    })

    expect(readDashboardSection(storage)).toBe(DASHBOARD_SECTIONS.dashboard)
    expect(readDashboardScrollY(storage)).toBe(0)
  })

  it('loads the selected section for a language pair', async () => {
    const loadDashboardCollections = vi.fn()
    const loadLibraryCollections = vi.fn()

    await loadDashboardSection({
      section: DASHBOARD_SECTIONS.dashboard,
      languagePairSlug: 'deu-eng',
      loadDashboardCollections,
      loadLibraryCollections,
    })
    await loadDashboardSection({
      section: DASHBOARD_SECTIONS.collections,
      languagePairSlug: 'deu-eng',
      loadDashboardCollections,
      loadLibraryCollections,
    })
    await loadDashboardSection({
      section: DASHBOARD_SECTIONS.dashboard,
      languagePairSlug: '',
      loadDashboardCollections,
      loadLibraryCollections,
    })

    expect(loadDashboardCollections).toHaveBeenCalledTimes(1)
    expect(loadDashboardCollections).toHaveBeenCalledWith('deu-eng')
    expect(loadLibraryCollections).toHaveBeenCalledTimes(1)
    expect(loadLibraryCollections).toHaveBeenCalledWith('deu-eng')
  })

  it('restores saved scroll once', async () => {
    const storage = memoryStorage({ [DASHBOARD_SCROLL_KEY]: '96' })
    const scrollTo = vi.fn()
    const requestAnimationFrame = vi.fn((callback) => callback())
    let restored = false

    const firstRestore = await restoreDashboardScroll({
      hasRestored: () => restored,
      markRestored: () => {
        restored = true
      },
      nextTick: () => Promise.resolve(),
      requestAnimationFrame,
      scrollTo,
      storage,
    })
    const secondRestore = await restoreDashboardScroll({
      hasRestored: () => restored,
      markRestored: () => {
        restored = true
      },
      nextTick: () => Promise.resolve(),
      requestAnimationFrame,
      scrollTo,
      storage,
    })

    expect(firstRestore).toBe(true)
    expect(secondRestore).toBe(false)
    expect(scrollTo).toHaveBeenCalledWith({ top: 96 })
  })
})
