import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Rows3, Shuffle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import {
  PRACTICE_ACTIVITY_OPTIONS,
  PRACTICE_MODE_OPTIONS,
  SESSION_LIMIT_OPTIONS,
} from '@/lib/practice-options'

export default function PracticeDialog({ collection, onClose }) {
  const [mode, setMode] = useState('typed')
  const [limit, setLimit] = useState('10')
  const navigate = useNavigate()
  const count = Math.min(Number(limit), collection?.sentenceCount || 0)
  return (
    <Dialog
      open={Boolean(collection)}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="max-h-[90dvh] gap-6 overflow-y-auto sm:max-w-xl">
        <DialogHeader className="text-left">
          <DialogTitle className="text-xl">Practice session</DialogTitle>
          <DialogDescription className="text-base">{collection?.name}</DialogDescription>
        </DialogHeader>
        <fieldset className="min-w-0 space-y-3">
          <legend className="mb-3 text-sm font-semibold">Practice type</legend>
          <RadioGroup
            value="reading"
            aria-label="Practice type"
            className="grid gap-3 sm:grid-cols-2"
          >
            {PRACTICE_ACTIVITY_OPTIONS.map(
              ({ value, label, icon: Icon, description, available }) => (
                <Label
                  key={value}
                  htmlFor={`activity-${value}`}
                  className="selection-card p-3"
                  data-selected={available}
                  data-disabled={!available}
                >
                  <RadioGroupItem
                    id={`activity-${value}`}
                    value={value}
                    aria-label={label}
                    disabled={!available}
                    className="mt-1"
                  />
                  <span className="space-y-1">
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      <Icon className="size-4" />
                      {label}
                    </span>
                    <span className="block text-xs font-normal leading-5">{description}</span>
                  </span>
                </Label>
              ),
            )}
          </RadioGroup>
        </fieldset>
        <fieldset className="min-w-0 space-y-3">
          <legend className="mb-3 text-sm font-semibold">How would you like to practice?</legend>
          <RadioGroup
            value={mode}
            onValueChange={setMode}
            aria-label="Practice mode"
            className="gap-3"
          >
            {PRACTICE_MODE_OPTIONS.map(({ value, label, icon: Icon, badge, description }) => (
              <Label
                key={value}
                htmlFor={`mode-${value}`}
                className="selection-card"
                data-selected={mode === value}
              >
                <RadioGroupItem
                  value={value}
                  id={`mode-${value}`}
                  aria-label={label}
                  aria-describedby={`mode-${value}-description`}
                  className="mt-1"
                />
                <Icon className="mt-0.5 size-5 shrink-0 text-primary" />
                <span className="min-w-0 space-y-1.5">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{label}</span>
                    <Badge variant="secondary" className="text-xs font-normal">
                      {badge}
                    </Badge>
                  </span>
                  <span
                    id={`mode-${value}-description`}
                    className="block text-sm font-normal leading-relaxed text-muted-foreground"
                  >
                    {description}
                  </span>
                </span>
              </Label>
            ))}
          </RadioGroup>
        </fieldset>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 p-4">
          <Label htmlFor="session-size" className="flex items-center gap-2">
            <Rows3 className="size-4 text-muted-foreground" />
            Sentences per session
          </Label>
          <Select value={limit} onValueChange={setLimit}>
            <SelectTrigger id="session-size" className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SESSION_LIMIT_OPTIONS.map((value) => (
                <SelectItem key={value} value={String(value)}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="flex w-full items-center gap-2 text-xs text-muted-foreground">
            <Shuffle className="size-3.5 shrink-0" />
            {count} random {count === 1 ? 'sentence' : 'sentences'} from this collection.
          </p>
        </div>
        <DialogFooter className="sticky bottom-0 bg-background pt-2">
          <Button
            className="w-full"
            size="lg"
            disabled={!count}
            onClick={() =>
              navigate(
                `/dashboard/collections/${collection.id}/practice?mode=${mode}&limit=${limit}`,
              )
            }
          >
            Start session
            <ArrowRight />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
