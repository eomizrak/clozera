import { useEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Eye, Lightbulb, RotateCcw, X } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Spinner } from '@/components/ui/spinner'
import { useCollectionsStore } from '@/stores/collections'
import { usePracticeSession } from '@/hooks/use-practice-session'
import {
  PRACTICE_MODES,
  practiceModeFromValue,
  sessionLimitFromValue,
} from '@/lib/practice-session'
import { practiceModeOption } from '@/lib/practice-options'
import { sentenceParts } from '@/lib/sentence-authoring'
import { cn } from '@/lib/utils'

export default function PracticeSessionView() {
  const { id } = useParams()
  const [search] = useSearchParams()
  const mode = practiceModeFromValue(search.get('mode'))
  const limit = sessionLimitFromValue(search.get('limit'))
  const flashcard = mode === PRACTICE_MODES.flashcard
  const choiceMode = mode === PRACTICE_MODES.choice
  const typed = mode === PRACTICE_MODES.typed
  const option = practiceModeOption(mode)
  const ModeIcon = option.icon
  const collection = useCollectionsStore((state) => state.activeCollection)
  const session = usePracticeSession({ collectionId: id, mode, limit })
  const { sentence, result, revealed, complete } = session
  const [hintVisible, setHintVisible] = useState(false)
  const nextButton = useRef(null)
  const ratingButton = useRef(null)
  useEffect(() => {
    if (result !== null) nextButton.current?.focus()
    else if (flashcard && revealed) ratingButton.current?.focus()
  }, [result, revealed, flashcard])
  function next() {
    setHintVisible(false)
    session.next()
  }
  function restart() {
    setHintVisible(false)
    session.restart()
  }
  useEffect(() => {
    function onKeyDown(event) {
      if (
        !choiceMode ||
        session.loading ||
        session.error ||
        result !== null ||
        complete ||
        event.defaultPrevented ||
        event.repeat ||
        event.isComposing ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.target.closest?.(
          'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="combobox"], [role="textbox"], [role="spinbutton"], [role="slider"]',
        ) ||
        document.querySelector(
          '[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"]',
        )
      )
        return
      const choice = session.choices[Number(event.key) - 1]
      if (/^[1-4]$/.test(event.key) && choice) {
        event.preventDefault()
        session.check(choice.label)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [choiceMode, result, complete, session])
  return (
    <>
      <Navbar dashboard />
      <main className="page-shell space-y-6" data-width="practice">
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/dashboard/collections/${id}`}>
            <ArrowLeft />
            Back to collection
          </Link>
        </Button>
        {session.loading ? (
          <div role="status" className="flex items-center gap-2 py-12">
            <Spinner />
            Loading practice…
          </div>
        ) : session.error ? (
          <Alert variant="destructive">
            <AlertDescription>
              {session.error}
              <Button variant="link" onClick={session.retryLoad}>
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <header className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <Badge variant="secondary" className="gap-1.5">
                    <ModeIcon className="size-3.5" />
                    {option.label}
                  </Badge>
                  <h1 className="text-2xl font-bold tracking-tight">{collection?.name}</h1>
                </div>
                <p
                  aria-label={`${session.correct} ${flashcard ? 'remembered' : 'correct'}, ${session.attempted - session.correct} ${flashcard ? 'to practice' : 'incorrect'}`}
                  className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2 text-sm tabular-nums"
                >
                  <span className="flex items-center gap-1.5 text-success">
                    <Check className="size-4" />
                    {session.correct}
                  </span>
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    {flashcard ? <RotateCcw className="size-4" /> : <X className="size-4" />}
                    {session.attempted - session.correct}
                  </span>
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Session progress</span>
                  <span>
                    {session.attempted} / {session.total} completed
                  </span>
                </div>
                <Progress
                  className="h-2"
                  value={
                    complete ? 100 : session.total ? (session.attempted / session.total) * 100 : 0
                  }
                  aria-label="Practice progress"
                />
              </div>
            </header>
            {complete ? (
              <Card className="text-center">
                <CardHeader className="gap-3">
                  <div className="mx-auto grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
                    <Check />
                  </div>
                  <CardDescription>Session complete</CardDescription>
                  <CardTitle role="heading" aria-level={2} className="text-3xl">
                    {session.correct} / {session.total} {flashcard ? 'remembered' : 'correct'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-muted-foreground">
                    {session.total
                      ? 'A little practice goes a long way. Try a fresh set or return to your collection.'
                      : 'This collection has no sentences yet.'}
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <Button disabled={!session.total} onClick={restart}>
                      <RotateCcw />
                      Practice again
                    </Button>
                    <Button variant="outline" asChild>
                      <Link to={`/dashboard/collections/${id}`}>
                        Back to collection
                        <ArrowRight />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              sentence && (
                <Card className="gap-0 overflow-hidden">
                  <CardHeader className="space-y-4 pb-6 sm:pb-8">
                    <div className="flex items-center justify-between gap-3">
                      <CardDescription>
                        Sentence {session.index + 1} / {session.total}
                      </CardDescription>
                      <Badge variant="outline">{option.badge}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{option.instruction}</p>
                    <CardTitle
                      className="pt-2 text-2xl leading-relaxed sm:text-3xl"
                      aria-label="Practice sentence"
                    >
                      {sentenceParts(sentence).map((part, partIndex) =>
                        part.isCloze ? (
                          typed && result === null ? (
                            <Input
                              key={`${session.index}-${partIndex}`}
                              form="typed-answer"
                              name="answer"
                              aria-label="Missing word"
                              autoFocus
                              autoComplete="off"
                              autoCapitalize="none"
                              spellCheck={false}
                              className="cloze-input"
                              style={{
                                width: `${Math.min(24, Math.max(4, [...session.answer].length + 1))}ch`,
                              }}
                              value={session.answer}
                              onChange={(event) => session.setAnswer(event.target.value)}
                              onKeyDown={(event) => {
                                if (
                                  event.key === 'Enter' &&
                                  (event.nativeEvent.isComposing ||
                                    event.nativeEvent.keyCode === 229)
                                )
                                  event.preventDefault()
                              }}
                            />
                          ) : (
                            <span
                              key={partIndex}
                              className={revealed ? 'cloze-answer' : 'cloze-blank'}
                              data-result={
                                result === true
                                  ? 'correct'
                                  : result === false
                                    ? 'incorrect'
                                    : 'revealed'
                              }
                            >
                              {revealed ? (
                                typed && result === true ? (
                                  session.answer.trim()
                                ) : (
                                  part.text
                                )
                              ) : (
                                <span className="sr-only">missing word</span>
                              )}
                            </span>
                          )
                        ) : (
                          <span key={partIndex}>{part.text}</span>
                        ),
                      )}
                    </CardTitle>
                    <p className="text-base leading-relaxed text-muted-foreground">
                      {sentence.translation}
                    </p>
                    {result !== null && (
                      <div
                        role="status"
                        aria-live="polite"
                        className={cn(
                          'flex flex-wrap items-center gap-x-3 gap-y-1 text-sm',
                          result
                            ? 'text-success'
                            : flashcard
                              ? 'text-muted-foreground'
                              : 'text-destructive',
                        )}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          {result ? (
                            <Check className="size-4" aria-hidden="true" />
                          ) : flashcard ? (
                            <RotateCcw className="size-4" aria-hidden="true" />
                          ) : (
                            <X className="size-4" aria-hidden="true" />
                          )}
                          <span>
                            {flashcard
                              ? result
                                ? 'Remembered'
                                : 'Keep practicing'
                              : result
                                ? 'Correct'
                                : 'Correct answer'}
                          </span>
                        </span>
                        {!flashcard && result === false && (
                          <span className="text-muted-foreground">
                            Your answer: {session.answer}
                          </span>
                        )}
                        {!flashcard && result === false && (
                          <span className="sr-only">Correct answer: {sentence.cloze}</span>
                        )}
                      </div>
                    )}
                    {sentence.hint && !revealed && (
                      <div>
                        {hintVisible ? (
                          <p className="rounded-md bg-muted p-3 text-sm">
                            <Lightbulb className="mr-2 inline size-4 text-primary" />
                            {sentence.hint}
                          </p>
                        ) : (
                          <Button size="sm" variant="ghost" onClick={() => setHintVisible(true)}>
                            <Lightbulb />
                            Show hint
                          </Button>
                        )}
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-5 border-t bg-muted/20 pt-6">
                    {flashcard ? (
                      !revealed ? (
                        <Button className="w-full" size="lg" onClick={session.reveal}>
                          <Eye />
                          Reveal answer
                        </Button>
                      ) : (
                        result === null && (
                          <div className="space-y-3" aria-live="polite">
                            <p className="text-center text-sm text-muted-foreground">
                              Did you remember the missing word?
                            </p>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              <Button
                                variant="outline"
                                size="lg"
                                onClick={() => session.rateFlashcard(false)}
                              >
                                <RotateCcw />
                                Need more practice
                              </Button>
                              <Button
                                ref={ratingButton}
                                size="lg"
                                onClick={() => session.rateFlashcard(true)}
                              >
                                <Check />I remembered
                              </Button>
                            </div>
                          </div>
                        )
                      )
                    ) : choiceMode ? (
                      <div className="space-y-3">
                        <div
                          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                          aria-label="Answer choices"
                        >
                          {session.choices.map((choice, index) => (
                            <Button
                              key={choice.id}
                              variant="outline"
                              size="lg"
                              className={cn(
                                'h-auto min-h-14 justify-start gap-3 whitespace-normal text-left text-base disabled:opacity-100',
                                result !== null &&
                                  choice.isCorrect &&
                                  'border-success bg-success/10 text-success',
                                result === false &&
                                  session.answer === choice.label &&
                                  'border-destructive bg-destructive/5 text-destructive',
                              )}
                              disabled={result !== null}
                              onClick={() => session.check(choice.label)}
                              aria-label={choice.label}
                            >
                              <span
                                aria-hidden="true"
                                className="grid size-6 shrink-0 place-items-center rounded border bg-background text-xs text-muted-foreground"
                              >
                                {index + 1}
                              </span>
                              <span className="flex-1">{choice.label}</span>
                              {result !== null && choice.isCorrect && <Check className="size-4" />}
                              {result === false && session.answer === choice.label && (
                                <X className="size-4" />
                              )}
                            </Button>
                          ))}
                        </div>
                        {session.choices.length < 2 ? (
                          <p className="text-xs text-muted-foreground">
                            This sentence has no other answer choices. Try typed answers or
                            flashcards for a stronger challenge.
                          </p>
                        ) : (
                          <p className="hidden text-xs text-muted-foreground sm:block">
                            Press 1–{session.choices.length} to choose an answer, or select an
                            option.
                          </p>
                        )}
                      </div>
                    ) : (
                      <form
                        id="typed-answer"
                        onSubmit={(event) => {
                          event.preventDefault()
                          if (result === null) session.check()
                          else next()
                        }}
                      >
                        <Button
                          ref={nextButton}
                          className="w-full"
                          size="lg"
                          disabled={result === null && !session.answer.trim()}
                        >
                          {result === null
                            ? 'Check answer'
                            : session.index + 1 === session.total
                              ? 'Finish session'
                              : 'Next sentence'}
                          <ArrowRight />
                        </Button>
                      </form>
                    )}
                    {revealed && sentence.notes && (
                      <p className="rounded-md bg-muted p-3 text-sm leading-relaxed text-muted-foreground">
                        {sentence.notes}
                      </p>
                    )}
                    {!typed && result !== null && (
                      <Button ref={nextButton} className="w-full" size="lg" onClick={next}>
                        {session.index + 1 === session.total ? 'Finish session' : 'Next sentence'}
                        <ArrowRight />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            )}
          </>
        )}
      </main>
    </>
  )
}
