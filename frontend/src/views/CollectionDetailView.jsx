import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Pin, PinOff, Play, Plus, Trash2 } from 'lucide-react'
import Navbar from '@/components/Navbar'
import CollectionForm from '@/components/CollectionForm'
import SentenceForm from '@/components/SentenceForm'
import PracticeDialog from '@/components/PracticeDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Spinner } from '@/components/ui/spinner'
import { useCollectionsStore } from '@/stores/collections'
import { sentenceParts } from '@/lib/sentence-authoring'

export default function CollectionDetailView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const collections = useCollectionsStore()
  const collection = collections.activeCollection?.id === id ? collections.activeCollection : null
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [dialog, setDialog] = useState(null)
  const [sentence, setSentence] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [practice, setPractice] = useState(false)
  const [page, setPage] = useState(1)
  const { loadCollection, loadCollectionSentences } = collections
  useEffect(() => {
    let active = true
    loadCollection(id)
      .then(() => loadCollectionSentences({ collectionId: id, page }))
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [id, page, loadCollection, loadCollectionSentences])
  const sentences = collections.activeCollectionSentences.filter((item) =>
    [
      item.text,
      item.translation,
      item.cloze,
      item.hint,
      item.notes,
      ...(item.alternativeAnswers || []),
      ...(item.multipleChoiceOptions || []),
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query.trim().toLowerCase())),
  )
  function open(value, item = null) {
    useCollectionsStore.setState({ error: '' })
    setSentence(item)
    setDialog(value)
  }
  async function saveSentence(payload) {
    try {
      if (sentence) await collections.updateSentence(id, sentence.id, payload)
      else await collections.createSentence(id, payload)
      setDialog(null)
      await loadCollection(id)
      await loadCollectionSentences({ collectionId: id, page })
    } catch {
      /* The store displays the error. */
    }
  }
  async function saveCollection({ name, description, isPublic }) {
    setSaving(true)
    try {
      await collections.updateCollection(id, {
        name,
        description,
        visibility: isPublic ? 'public' : 'private',
      })
      setDialog(null)
    } catch {
      /* Keep the form open for retry. */
    } finally {
      setSaving(false)
    }
  }
  async function remove(event) {
    event.preventDefault()
    setSaving(true)
    try {
      await collections.deleteCollection(id)
      navigate('/dashboard')
    } catch {
      /* Keep confirmation open for retry. */
    } finally {
      setSaving(false)
    }
  }
  return (
    <>
      <Navbar dashboard />
      <main className="page-shell space-y-7">
        <Button variant="ghost" asChild>
          <Link to="/dashboard">
            <ArrowLeft />
            Back to dashboard
          </Link>
        </Button>
        {collections.error && (
          <Alert variant="destructive">
            <AlertDescription>{collections.error}</AlertDescription>
          </Alert>
        )}
        {loading ? (
          <div role="status" className="flex gap-2">
            <Spinner />
            Loading collection…
          </div>
        ) : collection ? (
          <>
            <Card>
              <CardHeader className="gap-4 sm:flex-row sm:justify-between">
                <div className="space-y-3">
                  {collection.level && <Badge variant="secondary">{collection.level}</Badge>}
                  <CardTitle role="heading" aria-level={1} className="text-3xl">
                    {collection.name}
                  </CardTitle>
                  <CardDescription>
                    {collection.description || 'Focused cloze practice collection.'}
                  </CardDescription>
                  <p className="text-sm text-muted-foreground">
                    {collection.sentenceCount || 0} sentences
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button disabled={!collection.sentenceCount} onClick={() => setPractice(true)}>
                    <Play />
                    Practice
                  </Button>
                  {(collection.capabilities?.canPin || collection.capabilities?.canUnpin) && (
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={collections.isPinning}
                      aria-label={
                        collection.isPinned ? 'Remove from dashboard' : 'Add to dashboard'
                      }
                      onClick={() =>
                        (collection.isPinned
                          ? collections.unpinCollection(id)
                          : collections.pinCollection(id)
                        ).catch(() => {})
                      }
                    >
                      {collection.isPinned ? <PinOff /> : <Pin />}
                    </Button>
                  )}
                  {collection.capabilities?.canEdit && (
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Edit collection"
                      onClick={() => open('collection')}
                    >
                      <Pencil />
                    </Button>
                  )}
                </div>
              </CardHeader>
            </Card>
            <section aria-label="Collection sentences" className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Input
                  className="max-w-sm"
                  aria-label="Search sentences on this page"
                  placeholder="Search sentences on this page"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
                {collection.capabilities?.canEdit && (
                  <Button onClick={() => open('sentence')}>
                    <Plus />
                    Add sentence
                  </Button>
                )}
              </div>
              <ol className="space-y-3">
                {sentences.map((item, index) => (
                  <li key={item.id}>
                    <Card>
                      <CardContent className="flex items-start gap-4">
                        <span className="text-sm text-muted-foreground">
                          {(page - 1) * 100 + index + 1}
                        </span>
                        <div className="flex-1 space-y-2">
                          <p className="text-lg leading-relaxed">
                            {sentenceParts(item).map((part, partIndex) =>
                              part.isCloze ? (
                                <Badge variant="secondary" className="text-base" key={partIndex}>
                                  {part.text}
                                </Badge>
                              ) : (
                                <span key={partIndex}>{part.text}</span>
                              ),
                            )}
                          </p>
                          <p className="text-muted-foreground">{item.translation}</p>
                        </div>
                        {collection.capabilities?.canEdit && (
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label="Edit sentence"
                            onClick={() => open('sentence', item)}
                          >
                            <Pencil />
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ol>
              {!sentences.length && (
                <p className="py-8 text-muted-foreground">
                  {query ? 'No matches found.' : 'No sentences yet.'}
                </p>
              )}
              {collections.sentencesMeta.total > 100 && (
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    disabled={page === 1}
                    onClick={() => {
                      setLoading(true)
                      setPage(page - 1)
                    }}
                  >
                    Previous
                  </Button>
                  <p>
                    Page {page} / {Math.ceil(collections.sentencesMeta.total / 100)}
                  </p>
                  <Button
                    variant="outline"
                    disabled={page * 100 >= collections.sentencesMeta.total}
                    onClick={() => {
                      setLoading(true)
                      setPage(page + 1)
                    }}
                  >
                    Next
                  </Button>
                </div>
              )}
            </section>
          </>
        ) : (
          !collections.error && <p>Collection not found.</p>
        )}
      </main>
      <PracticeDialog
        key={practice ? id : 'closed'}
        collection={practice ? collection : null}
        onClose={() => setPractice(false)}
      />
      <Dialog
        open={Boolean(dialog)}
        onOpenChange={(value) => {
          if (!value) setDialog(null)
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialog === 'collection'
                ? 'Edit collection'
                : sentence
                  ? 'Edit sentence'
                  : 'New sentence'}
            </DialogTitle>
            <DialogDescription>
              {dialog === 'collection'
                ? 'Update the collection details and visibility.'
                : 'Write a sentence and mark one answer with double braces.'}
            </DialogDescription>
          </DialogHeader>
          {collections.error && (
            <Alert variant="destructive">
              <AlertDescription>{collections.error}</AlertDescription>
            </Alert>
          )}
          {dialog === 'collection' ? (
            <CollectionForm collection={collection} onSubmit={saveCollection} busy={saving}>
              {collection?.capabilities?.canDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  className="w-full"
                  onClick={() => setDeleting(true)}
                >
                  <Trash2 />
                  Delete collection
                </Button>
              )}
            </CollectionForm>
          ) : (
            dialog === 'sentence' && (
              <SentenceForm
                key={sentence?.id || 'new'}
                sentence={sentence}
                onSubmit={saveSentence}
                busy={collections.isCreatingSentence || collections.isUpdatingSentence}
              />
            )
          )}
        </DialogContent>
      </Dialog>
      <AlertDialog open={deleting} onOpenChange={setDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this collection?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {collection?.name} and its sentences. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {collections.error && (
            <Alert variant="destructive">
              <AlertDescription>{collections.error}</AlertDescription>
            </Alert>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={saving} onClick={remove}>
              {saving && <Spinner />}Delete collection
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
