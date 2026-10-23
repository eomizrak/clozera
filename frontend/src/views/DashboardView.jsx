import { useEffect, useRef, useState } from 'react'
import { ArrowRight, BookOpen, LayoutDashboard, Library, Plus, Search, X } from 'lucide-react'
import Navbar from '@/components/Navbar'
import CollectionCard from '@/components/CollectionCard'
import CollectionForm from '@/components/CollectionForm'
import PracticeDialog from '@/components/PracticeDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
import { Card, CardContent } from '@/components/ui/card'
import { useAccountStore } from '@/stores/account'
import { useCollectionsStore } from '@/stores/collections'
import { filterCollectionShelves } from '@/lib/collection-shelves'
import {
  readDashboardScrollY,
  readDashboardSection,
  saveDashboardState,
} from '@/lib/dashboard-workflow'

export default function DashboardView() {
  const collections = useCollectionsStore()
  const slug = useAccountStore((state) => state.selectedLanguagePairSlug)
  const [section, setSection] = useState(readDashboardSection)
  const [sort, setSort] = useState('name')
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const [practice, setPractice] = useState(null)
  const restored = useRef(false)
  const savedScroll = useRef(readDashboardScrollY())
  const sectionRef = useRef(section)
  useEffect(() => {
    sectionRef.current = section
  }, [section])
  const load =
    section === 'collections' ? collections.loadCollections : collections.loadDashboardCollections
  useEffect(() => {
    let active = true
    load({ languagePair: slug })
      .then(() => {
        if (active && !restored.current) {
          restored.current = true
          requestAnimationFrame(() => window.scrollTo({ top: savedScroll.current }))
        }
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [load, slug])
  useEffect(() => {
    const save = () => saveDashboardState({ section: sectionRef.current })
    window.addEventListener('scroll', save, { passive: true })
    return () => {
      save()
      window.removeEventListener('scroll', save)
    }
  }, [])
  const sortItems = (items) =>
    [...items].sort((left, right) => {
      if (sort === 'sentences')
        return (
          (right.sentenceCount || 0) - (left.sentenceCount || 0) ||
          left.name.localeCompare(right.name)
        )
      return left.name.localeCompare(right.name)
    })
  const shelves = filterCollectionShelves(collections.collectionShelves, query)
  const pinned = sortItems(
    collections.dashboardCollections.filter((collection) =>
      collection.name.toLowerCase().includes(query.trim().toLowerCase()),
    ),
  )
  const visibleCount =
    section === 'dashboard'
      ? pinned.length
      : shelves.reduce(
          (total, shelf) =>
            total + shelf.groups.reduce((count, group) => count + group.collections.length, 0),
          0,
        )
  const loading = section === 'collections' ? collections.isLoading : collections.isLoadingDashboard
  const cards = (items) => (
    <ul className="collection-grid">
      {sortItems(items).map((collection) => (
        <li key={collection.id}>
          <CollectionCard collection={collection} onPractice={setPractice} />
        </li>
      ))}
    </ul>
  )
  async function create(payload) {
    try {
      await collections.createCollection({ ...payload, type: 'topic', languagePairSlug: slug })
      setCreating(false)
      await load({ languagePair: slug })
    } catch {
      /* Keep the form open for retry. */
    }
  }
  return (
    <>
      <Navbar dashboard />
      <main className="page-shell space-y-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Your learning space
            </p>
            <h1 className="text-3xl font-bold tracking-tight">
              {section === 'dashboard' ? 'Your dashboard' : 'Collections'}
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
              {section === 'dashboard'
                ? 'Your pinned collections, ready for a quick practice session.'
                : 'Find a collection, explore its sentences, and choose how to practice.'}
            </p>
          </div>
          <Button
            onClick={() => {
              useCollectionsStore.setState({ error: '' })
              setCreating(true)
            }}
          >
            <Plus />
            New collection
          </Button>
        </header>
        <Tabs
          value={section}
          onValueChange={(value) => {
            setSection(value)
            saveDashboardState({ section: value })
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-5">
            <TabsList aria-label="Dashboard sections" className="h-10">
              <TabsTrigger value="dashboard" className="gap-2">
                <LayoutDashboard className="size-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="collections" className="gap-2">
                <Library className="size-4" />
                Collections
              </TabsTrigger>
            </TabsList>
            <p className="text-sm text-muted-foreground">
              {loading
                ? 'Loading collections…'
                : `${visibleCount} ${visibleCount === 1 ? 'collection' : 'collections'}${query.trim() ? ' found' : ''}`}
            </p>
          </div>
          <TabsContent value={section} className="space-y-6 pt-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground"
                />
                <Input
                  aria-label="Search collections"
                  placeholder="Search collections…"
                  className="h-10 pl-9 pr-10"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
                {query && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1 size-8"
                    aria-label="Clear search"
                    onClick={() => setQuery('')}
                  >
                    <X />
                  </Button>
                )}
              </div>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger aria-label="Sort collections" className="h-10 w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name: A–Z</SelectItem>
                  <SelectItem value="sentences">Most sentences</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {collections.error && (
              <Alert variant="destructive">
                <AlertDescription>
                  {collections.error}
                  <Button
                    variant="link"
                    onClick={() => load({ languagePair: slug }).catch(() => {})}
                  >
                    Retry
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            {loading ? (
              <div role="status" className="flex items-center gap-2 py-10">
                <Spinner />
                Loading collections…
              </div>
            ) : section === 'dashboard' ? (
              pinned.length ? (
                cards(pinned)
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
                    <BookOpen className="mb-1 size-8 text-primary/70" aria-hidden="true" />
                    <h2 className="text-xl font-semibold">
                      {query ? 'No matches found.' : 'No pinned collections yet.'}
                    </h2>
                    <p className="text-muted-foreground">
                      {query
                        ? 'Try a different collection name.'
                        : 'Add collections to your dashboard from the Collections tab.'}
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (query) setQuery('')
                        else {
                          setSection('collections')
                          saveDashboardState({ section: 'collections' })
                        }
                      }}
                    >
                      {query ? 'Clear search' : 'Explore collections'}
                      <ArrowRight />
                    </Button>
                  </CardContent>
                </Card>
              )
            ) : shelves.length ? (
              shelves.map((shelf) => (
                <section key={shelf.id} className="space-y-4" aria-label={shelf.name}>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold">{shelf.name}</h2>
                    <Badge variant="outline">
                      {shelf.groups.reduce((count, group) => count + group.collections.length, 0)}
                    </Badge>
                  </div>
                  {shelf.relationship === 'official' ? (
                    <Accordion
                      type="multiple"
                      value={[...collections.expandedGroupIds]}
                      onValueChange={(ids) =>
                        useCollectionsStore.setState({ expandedGroupIds: new Set(ids) })
                      }
                    >
                      {shelf.groups.map((group) => (
                        <AccordionItem key={group.id} value={group.id}>
                          <AccordionTrigger>
                            <span>
                              {group.name}
                              <span className="ml-3 text-sm font-normal text-muted-foreground">
                                {group.collections.length} collections ·{' '}
                                {group.collections.reduce(
                                  (total, collection) => total + (collection.sentenceCount || 0),
                                  0,
                                )}{' '}
                                sentences
                              </span>
                            </span>
                          </AccordionTrigger>
                          <AccordionContent>{cards(group.collections)}</AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  ) : (
                    cards(shelf.groups.flatMap((group) => group.collections))
                  )}
                </section>
              ))
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
                  <BookOpen className="mb-1 size-8 text-primary/70" aria-hidden="true" />
                  <h2 className="text-xl font-semibold">
                    {query ? 'No matches found.' : 'No collections yet.'}
                  </h2>
                  <p className="text-muted-foreground">
                    {query
                      ? 'Try a different collection name.'
                      : 'Create the first collection for this language pair.'}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (query) setQuery('')
                      else {
                        useCollectionsStore.setState({ error: '' })
                        setCreating(true)
                      }
                    }}
                  >
                    {query ? 'Clear search' : 'Create a collection'}
                    <ArrowRight />
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
      <PracticeDialog
        key={practice?.id || 'closed'}
        collection={practice}
        onClose={() => setPractice(null)}
      />
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New collection</DialogTitle>
            <DialogDescription>
              Create a collection for your selected language pair.
            </DialogDescription>
          </DialogHeader>
          {collections.error && (
            <Alert variant="destructive">
              <AlertDescription>{collections.error}</AlertDescription>
            </Alert>
          )}
          <CollectionForm onSubmit={create} busy={collections.isCreating} />
        </DialogContent>
      </Dialog>
    </>
  )
}
