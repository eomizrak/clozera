import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '@/App'
import { useAccountStore } from '@/stores/account'
import { useLanguagesStore } from '@/stores/languages'
import { useCollectionsStore } from '@/stores/collections'

const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() }))
vi.mock('@/lib/api', () => ({ default: api }))

const pair = {
  slug: 'deu-eng',
  name: 'German from English',
  baseLanguage: { code: 'en', name: 'English' },
  targetLanguage: { code: 'de', name: 'German' },
}
const user = {
  id: 'user-1',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  languagePairs: [pair],
  selectedLanguagePair: pair,
}
const collection = {
  id: 'collection-1',
  name: 'German Basics',
  sentenceCount: 1,
  relationship: 'owned',
  visibility: 'private',
  isPinned: true,
  capabilities: { canEdit: true, canDelete: true, canUnpin: true },
}
const sentence = {
  id: 'sentence-1',
  text: 'Ich {{lerne}}.',
  translation: 'I learn.',
  cloze: 'lerne',
  alternativeAnswers: ['studiere'],
  multipleChoiceOptions: ['lese', 'trinke', 'spiele'],
}
const response = (data, meta) => ({ data: { data, meta } })

function open(path = '/dashboard', currentUser = user) {
  api.get.mockImplementation(async (url) => {
    if (url === '/accounts/session') return response(currentUser)
    if (url === '/languages') return response([{ code: 'en', name: 'English' }])
    if (url === '/language-pairs') return response([pair])
    if (url === '/dashboard/collections' || url === '/collections')
      return response({ collections: [collection] })
    if (url === '/collections/collection-1') return response(collection)
    if (url === '/collections/collection-1/sentences')
      return response({ sentences: [sentence] }, { total: 1, page: 1, perPage: 100 })
    throw new Error(`Unexpected URL: ${url}`)
  })
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  for (const store of [useAccountStore, useCollectionsStore, useLanguagesStore])
    store.setState(store.getInitialState(), true)
  window.sessionStorage.clear()
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  HTMLElement.prototype.scrollIntoView = vi.fn()
  HTMLElement.prototype.hasPointerCapture = () => false
  HTMLElement.prototype.setPointerCapture = vi.fn()
  HTMLElement.prototype.releasePointerCapture = vi.fn()
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('React application workflows', () => {
  it('restores a cookie session and loads the selected language dashboard', async () => {
    open()
    expect(await screen.findByRole('heading', { name: 'Your dashboard' })).toBeTruthy()
    expect(await screen.findByRole('link', { name: 'Open German Basics' })).toBeTruthy()
    expect(api.get).toHaveBeenCalledWith('/dashboard/collections', {
      params: { languagePair: 'deu-eng' },
    })
  })

  it('redirects guests to login and preserves the practice destination and mode', async () => {
    const events = userEvent.setup()
    api.post.mockResolvedValue(response(user))
    open('/dashboard/collections/collection-1/practice?mode=choice', null)
    await events.type(await screen.findByLabelText('Email'), 'ada@example.com')
    await events.type(screen.getByLabelText('Password'), 'secret')
    await events.click(screen.getByRole('button', { name: 'Log in' }))
    expect(await screen.findByRole('button', { name: 'lerne' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'lerne' })).toBeTruthy()
    expect(api.post).toHaveBeenCalledWith('/accounts/session', {
      email: 'ada@example.com',
      password: 'secret',
    })
  })

  it('requires language selection for accounts without a selected pair', async () => {
    const events = userEvent.setup()
    api.patch.mockResolvedValue(response(user))
    open('/dashboard', { ...user, selectedLanguagePair: null })
    expect(await screen.findByRole('heading', { name: 'Choose your languages.' })).toBeTruthy()
    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: 'I speak' }).textContent).toContain('English'),
    )
    await events.click(screen.getByRole('combobox', { name: 'I want to learn' }))
    await events.click(await screen.findByRole('option', { name: 'German' }))
    await events.click(screen.getByRole('button', { name: 'Continue' }))
    expect(await screen.findByRole('heading', { name: 'Your dashboard' })).toBeTruthy()
    expect(api.patch).toHaveBeenCalledWith('/users/me', { selectedLanguagePairSlug: 'deu-eng' })
  })

  it('keeps failed login errors visible and allows retry', async () => {
    const events = userEvent.setup()
    api.post.mockRejectedValueOnce({
      response: { data: { error: { message: 'Invalid credentials' } } },
    })
    open('/login', null)
    await events.type(await screen.findByLabelText('Email'), 'ada@example.com')
    await events.type(screen.getByLabelText('Password'), 'wrong')
    await events.click(screen.getByRole('button', { name: 'Log in' }))
    expect(await screen.findByText('Invalid credentials')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Log in' }).disabled).toBe(false)
  })

  it('creates a collection with the existing API payload', async () => {
    const events = userEvent.setup()
    api.post.mockResolvedValue(response({ ...collection, name: 'Travel' }))
    open()
    await events.click(await screen.findByRole('button', { name: 'New collection' }))
    const dialog = await screen.findByRole('dialog', { name: 'New collection' })
    await events.type(within(dialog).getByLabelText('Collection name'), 'Travel')
    await events.type(within(dialog).getByLabelText('Description'), 'Useful phrases')
    await events.click(within(dialog).getByLabelText('Make public'))
    await events.click(within(dialog).getByRole('button', { name: 'Create collection' }))
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/collections', {
        name: 'Travel',
        description: 'Useful phrases',
        isPublic: true,
        type: 'topic',
        languagePairSlug: 'deu-eng',
      }),
    )
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('opens official groups and searches the library', async () => {
    const events = userEvent.setup()
    open()
    await screen.findByRole('heading', { name: 'Your dashboard' })
    api.get.mockImplementation(async (url) => {
      if (url === '/collections')
        return response({
          collections: [
            {
              ...collection,
              relationship: 'official',
              group: { id: 'basics', name: 'Basics', order: 1 },
            },
          ],
        })
      return response([])
    })
    await events.click(screen.getByRole('tab', { name: 'Collections' }))
    await events.click(await screen.findByRole('button', { name: /Basics.*collections/ }))
    expect(await screen.findByRole('link', { name: 'Open German Basics' })).toBeTruthy()
    await events.type(screen.getByRole('textbox', { name: 'Search collections' }), 'unmatched')
    expect(await screen.findByText('No matches found.')).toBeTruthy()
  })

  it('authors a cloze sentence with alternatives and choices', async () => {
    const events = userEvent.setup()
    api.post.mockResolvedValue(response(sentence))
    open('/dashboard/collections/collection-1')
    await events.click(await screen.findByRole('button', { name: 'Add sentence' }))
    const dialog = await screen.findByRole('dialog', { name: 'New sentence' })
    await events.click(within(dialog).getByLabelText('Sentence'))
    await events.paste('Ich {{lerne}}.')
    await events.type(within(dialog).getByLabelText('Translation'), 'I learn.')
    await events.type(within(dialog).getByLabelText('Alternative answers'), 'studiere, übe')
    await events.type(within(dialog).getByLabelText('Multiple choice options'), 'lese, trinke')
    await events.click(within(dialog).getByRole('button', { name: 'Add sentence' }))
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/collections/collection-1/sentences', {
        text: 'Ich {{lerne}}.',
        translation: 'I learn.',
        alternativeAnswers: ['studiere', 'übe'],
        multipleChoiceOptions: ['lese', 'trinke'],
        hint: '',
        notes: '',
      }),
    )
  })

  it('hides collection editing controls when the server denies capabilities', async () => {
    open('/dashboard/collections/collection-1')
    api.get.mockImplementation(async (url) => {
      if (url === '/accounts/session') return response(user)
      if (url === '/collections/collection-1') return response({ ...collection, capabilities: {} })
      if (url.endsWith('/sentences')) return response({ sentences: [sentence] }, { total: 1 })
      return response([])
    })
    await screen.findByRole('heading', { name: 'German Basics' })
    expect(screen.queryByRole('button', { name: 'Edit collection' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Add sentence' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Edit sentence' })).toBeNull()
  })

  it('accepts an alternative typed answer, completes and restarts practice', async () => {
    const events = userEvent.setup()
    open('/dashboard/collections/collection-1/practice?mode=typed')
    await events.type(await screen.findByLabelText('Missing word'), 'studiere')
    await events.click(screen.getByRole('button', { name: 'Check answer' }))
    expect(await screen.findByText('Correct')).toBeTruthy()
    await events.click(screen.getByRole('button', { name: 'Finish session' }))
    expect(await screen.findByText('1 / 1 correct')).toBeTruthy()
    await events.click(screen.getByRole('button', { name: 'Practice again' }))
    expect(await screen.findByLabelText('Missing word')).toBeTruthy()
    expect(screen.queryByText('Correct')).toBeNull()
  })

  it('checks a multiple-choice answer and displays the correct answer on failure', async () => {
    const events = userEvent.setup()
    open('/dashboard/collections/collection-1/practice?mode=choice')
    await events.click(await screen.findByRole('button', { name: 'trinke' }))
    expect(await screen.findByText('Correct answer')).toBeTruthy()
    await events.click(screen.getByRole('button', { name: 'Finish session' }))
    expect(await screen.findByText('0 / 1 correct')).toBeTruthy()
  })
  it('signs up with profile fields and the local timezone', async () => {
    const events = userEvent.setup()
    api.post.mockResolvedValue(response(user))
    open('/sign-up', null)
    await events.type(await screen.findByLabelText('Name'), 'Ada Lovelace')
    await events.type(screen.getByLabelText('Username'), 'ada')
    await events.type(screen.getByLabelText('Email'), 'ada@example.com')
    await events.type(screen.getByLabelText('Password'), 'secret')
    await events.click(screen.getByRole('button', { name: 'Create account' }))
    expect(await screen.findByRole('heading', { name: 'Your dashboard' })).toBeTruthy()
    expect(api.post).toHaveBeenCalledWith('/users', {
      name: 'Ada Lovelace',
      username: 'ada',
      email: 'ada@example.com',
      password: 'secret',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    })
  })

  it('edits collection metadata and requires confirmation before deleting', async () => {
    const events = userEvent.setup()
    api.patch.mockResolvedValue(
      response({ ...collection, name: 'Updated Basics', visibility: 'public' }),
    )
    api.delete.mockResolvedValue(response(null))
    open('/dashboard/collections/collection-1')
    await events.click(await screen.findByRole('button', { name: 'Edit collection' }))
    let dialog = await screen.findByRole('dialog', { name: 'Edit collection' })
    await events.clear(within(dialog).getByLabelText('Collection name'))
    await events.type(within(dialog).getByLabelText('Collection name'), 'Updated Basics')
    await events.click(within(dialog).getByLabelText('Make public'))
    await events.click(within(dialog).getByRole('button', { name: 'Save changes' }))
    expect(await screen.findByRole('heading', { name: 'Updated Basics' })).toBeTruthy()
    expect(api.patch).toHaveBeenCalledWith('/collections/collection-1', {
      name: 'Updated Basics',
      description: '',
      visibility: 'public',
    })
    await events.click(screen.getByRole('button', { name: 'Edit collection' }))
    dialog = await screen.findByRole('dialog', { name: 'Edit collection' })
    await events.click(within(dialog).getByRole('button', { name: 'Delete collection' }))
    const confirmation = await screen.findByRole('alertdialog')
    expect(api.delete).not.toHaveBeenCalled()
    await events.click(within(confirmation).getByRole('button', { name: 'Delete collection' }))
    expect(await screen.findByRole('heading', { name: 'Your dashboard' })).toBeTruthy()
    expect(api.delete).toHaveBeenCalledWith('/collections/collection-1')
  })

  it('samples practice from all pages of a large collection', async () => {
    open('/dashboard/collections/collection-1/practice')
    api.get.mockImplementation(async (url, options) => {
      if (url === '/accounts/session') return response(user)
      if (url === '/collections/collection-1')
        return response({ ...collection, sentenceCount: 101 })
      if (url.endsWith('/sentences'))
        return response(
          {
            sentences:
              options.params.page === 1
                ? Array.from({ length: 100 }, (_, index) => ({
                    ...sentence,
                    id: `sentence-${index}`,
                  }))
                : [{ ...sentence, id: 'last-sentence' }],
          },
          { total: 101 },
        )
      return response([])
    })
    expect(await screen.findByLabelText('Missing word')).toBeTruthy()
    expect(api.get).toHaveBeenCalledWith('/collections/collection-1/sentences', {
      params: { page: 2, perPage: 100 },
    })
    expect(screen.getByText('Sentence 1 / 10')).toBeTruthy()
  })
  it('sets up flashcards, keeps listening disabled, and starts the selected mode', async () => {
    const events = userEvent.setup()
    open()
    await events.click(await screen.findByRole('button', { name: 'Practice German Basics' }))
    const dialog = await screen.findByRole('dialog', { name: 'Practice session' })
    expect(within(dialog).getByRole('radio', { name: 'Listening' }).disabled).toBe(true)
    expect(
      within(dialog).getByRole('radio', { name: 'Vocabulary' }).getAttribute('data-state'),
    ).toBe('checked')
    await events.click(within(dialog).getByRole('radio', { name: 'Flashcards' }))
    await events.click(within(dialog).getByRole('combobox', { name: 'Sentences per session' }))
    await events.click(await screen.findByRole('option', { name: '5', exact: true }))
    await events.click(within(dialog).getByRole('button', { name: 'Start session' }))
    expect(await screen.findByRole('button', { name: 'Reveal answer' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'I remembered' })).toBeNull()
  })

  it('reveals a flashcard before rating, finishes, and resets when restarting', async () => {
    const events = userEvent.setup()
    open('/dashboard/collections/collection-1/practice?mode=flashcard')
    await events.click(await screen.findByRole('button', { name: 'Reveal answer' }))
    expect(screen.getByLabelText('Practice sentence').textContent).toContain('lerne')
    await events.click(screen.getByRole('button', { name: 'I remembered' }))
    expect(await screen.findByText('Remembered')).toBeTruthy()
    await events.click(screen.getByRole('button', { name: 'Finish session' }))
    expect(await screen.findByText('1 / 1 remembered')).toBeTruthy()
    await events.click(screen.getByRole('button', { name: 'Practice again' }))
    expect(await screen.findByRole('button', { name: 'Reveal answer' })).toBeTruthy()
    expect(screen.getByLabelText('Practice sentence').textContent).not.toContain('lerne')
    await events.click(screen.getByRole('button', { name: 'Reveal answer' }))
    await events.click(screen.getByRole('button', { name: 'Need more practice' }))
    await events.click(screen.getByRole('button', { name: 'Finish session' }))
    expect(await screen.findByText('0 / 1 remembered')).toBeTruthy()
    expect(api.post).not.toHaveBeenCalled()
  })

  it('honors the selected sentence limit', async () => {
    open('/dashboard/collections/collection-1/practice?limit=5')
    api.get.mockImplementation(async (url) => {
      if (url === '/accounts/session') return response(user)
      if (url === '/collections/collection-1') return response({ ...collection, sentenceCount: 12 })
      if (url.endsWith('/sentences'))
        return response(
          {
            sentences: Array.from({ length: 12 }, (_, index) => ({
              ...sentence,
              id: `sentence-${index}`,
            })),
          },
          { total: 12 },
        )
      return response([])
    })
    expect(await screen.findByText('Sentence 1 / 5')).toBeTruthy()
  })

  it('supports keyboard answers and moves focus to the next action', async () => {
    const events = userEvent.setup()
    open('/dashboard/collections/collection-1/practice?mode=choice')
    const correctChoice = await screen.findByRole('button', { name: 'lerne', exact: true })
    expect(document.activeElement).toBe(document.body)
    const choices = within(screen.getByLabelText('Answer choices')).getAllByRole('button')
    await events.keyboard(String(choices.indexOf(correctChoice) + 1))
    expect(await screen.findByText('Correct')).toBeTruthy()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Finish session' }))
  })

  it('sorts collection cards and clears search without hiding the field', async () => {
    const events = userEvent.setup()
    open()
    api.get.mockImplementation(async (url) => {
      if (url === '/accounts/session') return response(user)
      if (url === '/dashboard/collections')
        return response({
          collections: [
            { ...collection, name: 'Alpha', id: 'a', sentenceCount: 2 },
            { ...collection, name: 'Zeta', id: 'z', sentenceCount: 20 },
          ],
        })
      return response([])
    })
    await screen.findByRole('link', { name: 'Open Alpha' })
    await events.click(screen.getByRole('combobox', { name: 'Sort collections' }))
    await events.click(await screen.findByRole('option', { name: 'Most sentences' }))
    const links = screen.getAllByRole('link', { name: /^Open / })
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/dashboard/collections/z',
      '/dashboard/collections/a',
    ])
    await events.type(screen.getByRole('textbox', { name: 'Search collections' }), 'Alpha')
    expect(screen.queryByRole('link', { name: 'Open Zeta' })).toBeNull()
    await events.click(screen.getByRole('button', { name: 'Clear search' }))
    expect(await screen.findByRole('link', { name: 'Open Zeta' })).toBeTruthy()
  })
  it('types inside the sentence and reuses one action button for checking and advancing', async () => {
    const events = userEvent.setup()
    open('/dashboard/collections/collection-1/practice?mode=typed')
    api.get.mockImplementation(async (url) => {
      if (url === '/accounts/session') return response(user)
      if (url === '/collections/collection-1') return response({ ...collection, sentenceCount: 2 })
      if (url.endsWith('/sentences'))
        return response({ sentences: [sentence, { ...sentence, id: 'sentence-2' }] }, { total: 2 })
      return response([])
    })
    const input = await screen.findByRole('textbox', { name: 'Missing word' })
    expect(screen.getByLabelText('Practice sentence').contains(input)).toBe(true)
    const action = screen.getByRole('button', { name: 'Check answer' })
    expect(action.disabled).toBe(true)
    await events.type(input, 'lerne{enter}')
    expect(await screen.findByRole('button', { name: 'Next sentence' })).toBe(action)
    expect(screen.queryByRole('button', { name: 'Check answer' })).toBeNull()
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.getByRole('status').textContent).toContain('Correct')
    expect(
      screen.getByLabelText('Practice sentence').querySelector('[data-result="correct"]')
        .textContent,
    ).toBe('lerne')
    await events.keyboard('{enter}')
    const nextInput = await screen.findByRole('textbox', { name: 'Missing word' })
    expect(nextInput.value).toBe('')
    expect(document.activeElement).toBe(nextInput)
    expect(screen.getByRole('button', { name: 'Check answer' })).toBe(action)
  })

  it('shows a wrong typed answer as an inline correction without a duplicate feedback box', async () => {
    const events = userEvent.setup()
    open('/dashboard/collections/collection-1/practice?mode=typed')
    await events.type(await screen.findByRole('textbox', { name: 'Missing word' }), 'wrong')
    await events.click(screen.getByRole('button', { name: 'Check answer' }))
    expect(await screen.findByText('Your answer: wrong')).toBeTruthy()
    const correction = screen
      .getByLabelText('Practice sentence')
      .querySelector('[data-result="incorrect"]')
    expect(correction.textContent).toBe('lerne')
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.queryByRole('textbox')).toBeNull()
    expect(screen.getByRole('button', { name: 'Finish session' })).toBeTruthy()
  })
  it('keeps number shortcuts working after advancing and does not grade twice', async () => {
    const events = userEvent.setup()
    open('/dashboard/collections/collection-1/practice?mode=choice')
    api.get.mockImplementation(async (url) => {
      if (url === '/accounts/session') return response(user)
      if (url === '/collections/collection-1') return response({ ...collection, sentenceCount: 2 })
      if (url.endsWith('/sentences'))
        return response({ sentences: [sentence, { ...sentence, id: 'sentence-2' }] }, { total: 2 })
      return response([])
    })
    await screen.findByRole('button', { name: 'lerne', exact: true })
    await events.keyboard('1')
    expect(await screen.findByRole('button', { name: 'Next sentence' })).toBeTruthy()
    await events.keyboard('2')
    expect(screen.getByText('1 / 2 completed')).toBeTruthy()
    await events.keyboard('{enter}')
    await screen.findByText('Sentence 2 / 2')
    expect(document.activeElement).toBe(document.body)
    await events.keyboard('1')
    expect(await screen.findByRole('button', { name: 'Finish session' })).toBeTruthy()
    expect(screen.getByText('2 / 2 completed')).toBeTruthy()
  })

  it('ignores number keys in open menus and resumes after the menu closes', async () => {
    const events = userEvent.setup()
    open('/dashboard/collections/collection-1/practice?mode=choice')
    await screen.findByRole('button', { name: 'lerne', exact: true })
    await events.click(screen.getByRole('button', { name: 'Account' }))
    await screen.findByRole('menu')
    await events.keyboard('1')
    expect(screen.queryByRole('button', { name: 'Finish session' })).toBeNull()
    await events.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull())
    await events.keyboard('1')
    expect(await screen.findByRole('button', { name: 'Finish session' })).toBeTruthy()
  })

  it('preserves modifier shortcuts instead of submitting a choice', async () => {
    const events = userEvent.setup()
    open('/dashboard/collections/collection-1/practice?mode=choice')
    await screen.findByRole('button', { name: 'lerne', exact: true })
    await events.keyboard('{Control>}1{/Control}{Alt>}2{/Alt}{Meta>}3{/Meta}')
    expect(screen.queryByRole('button', { name: 'Finish session' })).toBeNull()
    expect(screen.getByText('0 / 1 completed')).toBeTruthy()
    await events.keyboard('1')
    expect(await screen.findByRole('button', { name: 'Finish session' })).toBeTruthy()
  })
})
