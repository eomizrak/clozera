import { useEffect, useMemo, useState } from 'react'
import api from '@/lib/api'
import { useCollectionsStore } from '@/stores/collections'
import {
  answerMatchesSentence,
  choiceSlotsForSentence,
  PRACTICE_MODES,
  sessionSentencesFromCollection,
} from '@/lib/practice-session'

// The interface is identical for every answer mode. No practice data is persisted yet.
export function usePracticeSession({ collectionId, mode, limit }) {
  const loadCollection = useCollectionsStore((state) => state.loadCollection)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const sessionKey = `${collectionId}:${mode}:${limit}:${retry}`
  const [loadedKey, setLoadedKey] = useState('')
  const [pool, setPool] = useState([])
  const [questions, setQuestions] = useState([])
  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [correct, setCorrect] = useState(0)
  useEffect(() => {
    let active = true
    async function load() {
      await loadCollection(collectionId)
      let all = [],
        page = 1,
        total
      do {
        const { data } = await api.get(`/collections/${collectionId}/sentences`, {
          params: { page, perPage: 100 },
        })
        all = all.concat(data.data.sentences)
        total = data.meta?.total || all.length
        if (!data.data.sentences.length) break
        page += 1
      } while (active && all.length < total)
      if (active) {
        setPool(all)
        setQuestions(sessionSentencesFromCollection(all, limit))
        setIndex(0)
        setCorrect(0)
        setAnswer('')
        setResult(null)
        setRevealed(false)
        setError('')
      }
    }
    load()
      .catch(() => {
        if (active) setError('Unable to load this practice session. Please try again.')
      })
      .finally(() => {
        if (active) {
          setLoadedKey(sessionKey)
          setLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [collectionId, mode, limit, loadCollection, retry, sessionKey])
  const sentence = questions[index]
  const choices = useMemo(
    () => (sentence ? choiceSlotsForSentence(sentence).filter((choice) => !choice.disabled) : []),
    [sentence],
  )
  const complete = !loading && index >= questions.length
  const attempted = Math.min(questions.length, index + (result !== null ? 1 : 0))
  function grade(matches) {
    setResult(matches)
    setRevealed(true)
    if (matches) setCorrect((value) => value + 1)
  }
  function check(value = answer) {
    if (!sentence || result !== null || mode === PRACTICE_MODES.flashcard || !String(value).trim())
      return
    setAnswer(value)
    grade(answerMatchesSentence(sentence, value))
  }
  function rateFlashcard(remembered) {
    if (!sentence || mode !== PRACTICE_MODES.flashcard || !revealed || result !== null) return
    grade(remembered)
  }
  function resetAnswer() {
    setAnswer('')
    setResult(null)
    setRevealed(false)
  }
  function next() {
    if (result === null) return
    setIndex((value) => value + 1)
    resetAnswer()
  }
  function restart() {
    setQuestions(sessionSentencesFromCollection(pool, limit))
    setIndex(0)
    setCorrect(0)
    resetAnswer()
  }
  function retryLoad() {
    setLoading(true)
    setError('')
    setRetry((value) => value + 1)
  }
  return {
    loading: loading || loadedKey !== sessionKey,
    error,
    sentence,
    choices,
    index,
    answer,
    setAnswer,
    result,
    revealed,
    correct,
    total: questions.length,
    attempted,
    complete,
    check,
    rateFlashcard,
    reveal: () => setRevealed(true),
    next,
    restart,
    retryLoad,
  }
}
