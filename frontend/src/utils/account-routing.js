export function selectedLanguagePairSlugFromUser(user) {
  return user?.selectedLanguagePair?.slug || ''
}

export function authenticatedHomeTarget(user) {
  return selectedLanguagePairSlugFromUser(user) ? '/dashboard' : '/languages'
}

export function playTargetForUser(user) {
  return user ? authenticatedHomeTarget(user) : '/login?redirect=%2Fdashboard'
}

export function safeRedirect(value) {
  return typeof value === 'string' &&
    value.startsWith('/') &&
    !value.startsWith('//') &&
    !/[\\\s]/.test(value)
    ? value
    : ''
}
