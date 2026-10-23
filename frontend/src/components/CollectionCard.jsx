import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  Layers,
  LockKeyhole,
  Pin,
  PinOff,
  Play,
  Rows3,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useCollectionsStore } from '@/stores/collections'

const collectionTypes = {
  official: { label: 'Official', icon: BookOpen },
  owned: { label: 'My collection', icon: Layers },
  community: { label: 'Community', icon: Users },
}

export default function CollectionCard({ collection, onPractice }) {
  const { pinCollection, unpinCollection, isPinning } = useCollectionsStore()
  const { label, icon: Icon } =
    collectionTypes[collection.relationship] || collectionTypes.community
  const count = collection.sentenceCount || 0
  return (
    <Card className="group h-full gap-0 overflow-hidden py-0 transition-[border-color,box-shadow] hover:border-primary/40 hover:shadow-md">
      <CardHeader className="gap-4 pb-4 pt-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Badge variant="secondary" className="gap-1.5 font-medium">
              <Icon className="size-3.5" />
              {label}
            </Badge>
            {collection.level && (
              <Badge variant="outline">{String(collection.level).replaceAll('_', ' ')}</Badge>
            )}
          </div>
          {(collection.capabilities?.canPin || collection.capabilities?.canUnpin) && (
            <Button
              size="icon"
              variant="ghost"
              className="size-8 shrink-0 text-muted-foreground hover:text-primary"
              disabled={isPinning}
              aria-label={
                collection.isPinned
                  ? `Remove ${collection.name} from dashboard`
                  : `Add ${collection.name} to dashboard`
              }
              title={collection.isPinned ? 'Remove from dashboard' : 'Add to dashboard'}
              aria-pressed={Boolean(collection.isPinned)}
              onClick={() =>
                (collection.isPinned
                  ? unpinCollection(collection.id)
                  : pinCollection(collection.id)
                ).catch(() => {})
              }
            >
              {collection.isPinned ? <PinOff /> : <Pin />}
            </Button>
          )}
        </div>
        <Link
          to={`/dashboard/collections/${collection.id}`}
          className="min-w-0 space-y-2 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Open ${collection.name}`}
        >
          <CardTitle
            role="heading"
            aria-level={3}
            className="line-clamp-2 text-xl leading-snug transition-colors group-hover:text-primary"
          >
            {collection.name}
          </CardTitle>
          <CardDescription className="line-clamp-2 min-h-10 text-sm leading-5">
            {collection.description || 'Build your vocabulary with sentences in context.'}
          </CardDescription>
        </Link>
      </CardHeader>
      <CardContent className="flex flex-1 flex-wrap items-start justify-between gap-2 pb-5 text-sm text-muted-foreground">
        <p className="flex items-center gap-2">
          <Rows3 className="size-4" />
          {count.toLocaleString('en-US')} {count === 1 ? 'sentence' : 'sentences'}
        </p>
        {collection.relationship === 'community' && collection.creator ? (
          <p className="max-w-full truncate">by {collection.creator.displayName}</p>
        ) : (
          collection.visibility === 'private' && (
            <p className="flex items-center gap-1.5">
              <LockKeyhole className="size-3.5" />
              Private
            </p>
          )
        )}
      </CardContent>
      <CardFooter className="grid grid-cols-[1fr_auto] gap-2 border-t bg-muted/30 px-6 py-4">
        <Button
          className="w-full"
          aria-label={`Practice ${collection.name}`}
          disabled={!count}
          onClick={() => onPractice(collection)}
        >
          <Play className="size-4" />
          {count ? 'Practice' : 'No sentences yet'}
        </Button>
        <Button variant="outline" size="icon" asChild>
          <Link
            to={`/dashboard/collections/${collection.id}`}
            aria-label={`View sentences in ${collection.name}`}
            title="View sentences"
          >
            <ArrowRight />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
