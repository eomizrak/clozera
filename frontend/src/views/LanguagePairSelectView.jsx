import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { useLanguagesStore } from '@/stores/languages'
import { useAccountStore } from '@/stores/account'

export default function LanguagePairSelectView() {
  const languages = useLanguagesStore()
  const { ensureLoaded } = languages
  const account = useAccountStore()
  const navigate = useNavigate()
  const [base, setBase] = useState('')
  const [slug, setSlug] = useState(account.selectedLanguagePairSlug)
  useEffect(() => {
    let active = true
    ensureLoaded()
      .then(() => {
        if (active)
          setBase(
            useLanguagesStore.getState().pairBySlug(account.selectedLanguagePairSlug)?.baseLanguage
              ?.code ||
              (useLanguagesStore.getState().languages.length === 1
                ? useLanguagesStore.getState().languages[0].code
                : ''),
          )
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [ensureLoaded, account.selectedLanguagePairSlug])
  const pairs = languages.languagePairs.filter((pair) => pair.baseLanguage?.code === base)
  async function save(event) {
    event.preventDefault()
    try {
      await account.updateSelectedLanguagePair(slug)
      navigate('/dashboard')
    } catch {
      /* Store displays error. */
    }
  }
  return (
    <>
      <Navbar dashboard />
      <main className="mx-auto max-w-lg px-5 py-16">
        <Card>
          <CardHeader>
            <CardTitle role="heading" aria-level={1} className="text-3xl">
              Choose your languages.
            </CardTitle>
            <CardDescription>
              Pick the language you speak and the one you want to learn.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={save} className="space-y-6">
              {languages.isLoading && <Spinner />}
              <div className="space-y-2">
                <Label htmlFor="base-language">I speak</Label>
                <Select
                  value={base}
                  onValueChange={(value) => {
                    setBase(value)
                    setSlug('')
                  }}
                >
                  <SelectTrigger id="base-language" className="w-full">
                    <SelectValue placeholder="Select your language" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.languages.map((language) => (
                      <SelectItem key={language.code} value={language.code}>
                        {language.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="target-language">I want to learn</Label>
                <Select value={slug} onValueChange={setSlug} disabled={!base || !pairs.length}>
                  <SelectTrigger id="target-language" className="w-full">
                    <SelectValue placeholder="Select a language to learn" />
                  </SelectTrigger>
                  <SelectContent>
                    {pairs.map((pair) => (
                      <SelectItem key={pair.slug} value={pair.slug}>
                        {pair.targetLanguage?.name || pair.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {base && !pairs.length && (
                  <p className="text-sm text-muted-foreground">
                    No language pairs are available for this language yet.
                  </p>
                )}
              </div>
              {(languages.error || account.error) && (
                <Alert variant="destructive">
                  <AlertDescription>{languages.error || account.error}</AlertDescription>
                </Alert>
              )}
              {languages.error && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => languages.loadLanguages().catch(() => {})}
                >
                  Retry
                </Button>
              )}
              <Button
                className="w-full"
                disabled={!slug || !pairs.some((pair) => pair.slug === slug) || account.isLoading}
              >
                {account.isLoading && <Spinner />}Continue
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </>
  )
}
