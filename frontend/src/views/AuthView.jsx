import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import Navbar from '@/components/Navbar'
import PublicFooter from '@/components/PublicFooter'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { useAccountStore } from '@/stores/account'
import { safeRedirect } from '@/utils/account-routing'

export default function AuthView({ signUp = false }) {
  const account = useAccountStore()
  const navigate = useNavigate()
  const [search] = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  useEffect(() => {
    useAccountStore.setState({ error: '' })
  }, [signUp])
  async function submit(event) {
    event.preventDefault()
    const payload = Object.fromEntries(new FormData(event.currentTarget))
    if (signUp) payload.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    try {
      const user = await (signUp ? account.signUp(payload) : account.login(payload))
      navigate(
        safeRedirect(search.get('redirect')) ||
          (user.selectedLanguagePair?.slug ? '/dashboard' : '/languages'),
        { replace: true },
      )
    } catch {
      /* Store error remains visible for retry. */
    }
  }
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-md flex-1 px-5 py-16">
        <Card>
          <CardHeader>
            <CardTitle role="heading" aria-level={1} className="text-3xl">
              {signUp ? 'Create your account.' : 'Welcome back.'}
            </CardTitle>
            <CardDescription>
              {signUp
                ? 'Start learning one missing word at a time.'
                : 'Log in to continue practicing.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-5">
              {(signUp
                ? [
                    ['name', 'Name', 'text', 'name'],
                    ['username', 'Username', 'text', 'username'],
                    ['email', 'Email', 'email', 'email'],
                  ]
                : [['email', 'Email', 'email', 'email']]
              ).map(([name, label, type, autocomplete]) => (
                <div key={name} className="space-y-2">
                  <Label htmlFor={name}>{label}</Label>
                  <Input id={name} name={name} type={type} autoComplete={autocomplete} required />
                </div>
              ))}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={signUp ? 'new-password' : 'current-password'}
                    className="pr-12"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    className="absolute right-0 top-0"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </Button>
                </div>
              </div>
              {account.error && (
                <Alert variant="destructive">
                  <AlertDescription>{account.error}</AlertDescription>
                </Alert>
              )}
              <Button className="w-full" disabled={account.isLoading}>
                {account.isLoading && <Spinner />}
                {signUp ? 'Create account' : 'Log in'}
              </Button>
              <p className="text-sm text-muted-foreground">
                {signUp ? 'Already have an account?' : 'New to Clozera?'}{' '}
                <Link
                  className="text-primary underline"
                  to={`${signUp ? '/login' : '/sign-up'}${search.size ? `?${search}` : ''}`}
                >
                  {signUp ? 'Log in' : 'Sign up'}
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </main>
      <PublicFooter />
    </div>
  )
}
