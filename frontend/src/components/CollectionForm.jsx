import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Spinner } from '@/components/ui/spinner'

// Shared only because collection creation and editing have the same fields and validation.
export default function CollectionForm({ collection, onSubmit, busy, children }) {
  const id = useId()
  const [name, setName] = useState(collection?.name || '')
  const [description, setDescription] = useState(collection?.description || '')
  const [isPublic, setPublic] = useState(collection?.visibility === 'public')
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit({ name: name.trim(), description: description.trim(), isPublic })
      }}
      className="space-y-5"
    >
      <div className="space-y-2">
        <Label htmlFor={`${id}-name`}>Collection name</Label>
        <Input
          id={`${id}-name`}
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          autoFocus
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${id}-description`}>Description</Label>
        <Textarea
          id={`${id}-description`}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
        />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id={`${id}-public`}
          checked={isPublic}
          onCheckedChange={(value) => setPublic(value === true)}
        />
        <Label htmlFor={`${id}-public`}>Make public</Label>
      </div>
      <Button className="w-full" disabled={!name.trim() || busy}>
        {busy && <Spinner />}
        {collection ? 'Save changes' : 'Create collection'}
      </Button>
      {children}
    </form>
  )
}
