export const DASHBOARD_SECTIONS = {
  dashboard: 'dashboard',
  collections: 'collections',
}

export const DASHBOARD_SECTION_KEY = 'clozera.dashboard.activeSection'
export const DASHBOARD_SCROLL_KEY = 'clozera.dashboard.scrollY'

const validSections = new Set(Object.values(DASHBOARD_SECTIONS))

export function readDashboardSection(storage = window.sessionStorage) {
  const savedSection = storage.getItem(DASHBOARD_SECTION_KEY)

  return validSections.has(savedSection) ? savedSection : DASHBOARD_SECTIONS.dashboard
}

export function saveDashboardState({
  section,
  scrollY = window.scrollY,
  storage = window.sessionStorage,
}) {
  storage.setItem(DASHBOARD_SECTION_KEY, section)
  storage.setItem(DASHBOARD_SCROLL_KEY, String(scrollY))
}

export function readDashboardScrollY(storage = window.sessionStorage) {
  const savedScroll = Number(storage.getItem(DASHBOARD_SCROLL_KEY) || 0)

  return Number.isFinite(savedScroll) && savedScroll > 0 ? savedScroll : 0
}

export async function loadDashboardSection({
  section,
  languagePairSlug,
  loadDashboardCollections,
  loadLibraryCollections,
}) {
  if (!languagePairSlug) return

  if (section === DASHBOARD_SECTIONS.collections) {
    await loadLibraryCollections(languagePairSlug)
    return
  }

  await loadDashboardCollections(languagePairSlug)
}

export async function restoreDashboardScroll({
  hasRestored,
  markRestored,
  nextTick,
  requestAnimationFrame = window.requestAnimationFrame.bind(window),
  scrollTo = window.scrollTo.bind(window),
  storage = window.sessionStorage,
}) {
  if (hasRestored()) return false

  markRestored()
  await nextTick()

  const savedScroll = readDashboardScrollY(storage)

  if (savedScroll > 0) {
    requestAnimationFrame(() => scrollTo({ top: savedScroll }))
  }

  return true
}
