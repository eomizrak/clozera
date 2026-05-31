export function selectedLanguagePairSlugFromUser(user) {
  return user?.selectedLanguagePair?.slug || ''
}

export function authenticatedHomeTarget(user) {
  if (!selectedLanguagePairSlugFromUser(user)) {
    return { name: 'languages' }
  }

  return { name: 'dashboard' }
}

export function playTargetForUser(user) {
  if (!user) {
    return { name: 'login', query: { redirect: '/dashboard' } }
  }

  return authenticatedHomeTarget(user)
}
