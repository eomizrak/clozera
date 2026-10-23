import { describe, expect, it } from 'vite-plus/test'
import { safeRedirect } from './account-routing'

describe('login redirects', () => {
  it('preserves internal destinations including practice mode', () => {
    expect(safeRedirect('/dashboard/collections/one/practice?mode=choice')).toBe(
      '/dashboard/collections/one/practice?mode=choice',
    )
  })
  it.each(['https://example.com', '//example.com', '/\\example.com', '/\n/example.com', null])(
    'rejects non-local or ambiguous destination %s',
    (destination) => {
      expect(safeRedirect(destination)).toBe('')
    },
  )
})
