import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAccountStore } from '@/stores/account'
import { useLanguagesStore } from '@/stores/languages'

export default function Navbar({ dashboard = false }) {
  const account = useAccountStore()
  const { ensureLoaded, languagePairs } = useLanguagesStore()
  const navigate = useNavigate()
  const [info, setInfo] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    if (dashboard) ensureLoaded().catch(() => {})
  }, [dashboard, ensureLoaded])
  const slugs = new Set((account.user?.languagePairs || []).map((pair) => pair.slug))
  const fullPairs = languagePairs.filter((pair) => slugs.has(pair.slug))
  const pairs = fullPairs.length ? fullPairs : account.user?.languagePairs || []
  return (
    <header className="border-b bg-card/80">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-5 py-4 sm:gap-3"
      >
        <Link
          to={dashboard ? '/dashboard' : '/'}
          aria-label={dashboard ? 'Clozera dashboard' : 'Clozera home'}
          className="shrink-0 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4"
        >
          <img
            src={`${import.meta.env.BASE_URL}brand/clozera-wordmark.png`}
            alt="Clozera"
            width="480"
            height="160"
            className="block h-10 w-30 object-contain"
          />
        </Link>
        <div className="flex items-center gap-2">
          {dashboard && account.user ? (
            <>
              {pairs.length > 0 && (
                <Select
                  value={account.selectedLanguagePairSlug}
                  disabled={account.isLoading}
                  onValueChange={async (slug) => {
                    try {
                      await account.updateSelectedLanguagePair(slug)
                      navigate('/dashboard')
                    } catch {
                      setError('Unable to switch language. Please try again.')
                    }
                  }}
                >
                  <SelectTrigger aria-label="Language pair" className="max-w-40 sm:max-w-56">
                    <SelectValue placeholder="Language pair" />
                  </SelectTrigger>
                  <SelectContent>
                    {pairs.map((pair) => (
                      <SelectItem key={pair.slug} value={pair.slug}>
                        {pair.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="Account">
                    <User />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setInfo(true)}>Account info</DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/languages">Add language pair</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled>Settings</DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={async () => {
                      try {
                        await account.logout()
                        navigate('/')
                      } catch {
                        setError('Unable to end your server session. Please try again.')
                      }
                    }}
                  >
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link to={account.user ? '/dashboard' : '/login'}>
                  {account.user ? 'Dashboard' : 'Log in'}
                </Link>
              </Button>
              <Button asChild>
                <Link to={account.user ? '/dashboard' : '/sign-up'}>Start practicing</Link>
              </Button>
            </>
          )}
        </div>
      </nav>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Dialog open={info} onOpenChange={setInfo}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Account info</DialogTitle>
            <DialogDescription>{account.user?.email}</DialogDescription>
          </DialogHeader>
          <p>{account.user?.name}</p>
          <p>{account.user?.selectedLanguagePair?.name || 'No language pair selected yet.'}</p>
        </DialogContent>
      </Dialog>
    </header>
  )
}
