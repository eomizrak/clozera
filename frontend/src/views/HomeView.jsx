import { Link } from 'react-router-dom'
import { ArrowRight, Play } from 'lucide-react'
import Navbar from '@/components/Navbar'
import PublicFooter from '@/components/PublicFooter'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useAccountStore } from '@/stores/account'

export default function HomeView() {
  const { user, selectedLanguagePairSlug } = useAccountStore()
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-5 py-16 lg:grid-cols-2">
        <section className="space-y-6">
          <Badge variant="secondary">Cloze practice for language learners</Badge>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-5xl lg:text-6xl">
            Practice languages one missing word at a time.
          </h1>
          <p className="text-lg text-muted-foreground">
            Clozera turns sentence collections into quick recall sessions. Fill the missing word,
            check yourself, and keep the full context in view.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link
                to={user ? (selectedLanguagePairSlug ? '/dashboard' : '/languages') : '/sign-up'}
              >
                <Play />
                Start practicing
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to={user ? '/dashboard' : '/login'}>
                {user ? 'Open dashboard' : 'Log in'}
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </section>
        <Card aria-label="Practice preview" className="shadow-xl shadow-orange-950/5">
          <CardHeader>
            <CardDescription>Practice preview</CardDescription>
            <CardTitle>German Basics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-7">
            <Progress value={20} aria-label="Example progress" />
            <p className="text-sm text-muted-foreground">Sentence 3 / 10</p>
            <p className="text-3xl font-semibold">
              Ich trinke jeden Morgen{' '}
              <span className="cloze-blank">
                <span className="sr-only">missing word</span>
              </span>
              .
            </p>
            <p className="text-muted-foreground">I drink coffee every morning.</p>
            <div className="grid grid-cols-2 gap-3">
              {['Kaffee', 'Tee', 'Wasser', 'Milch'].map((word) => (
                <Badge
                  key={word}
                  variant="outline"
                  className="w-full justify-center rounded-md py-4 text-base"
                >
                  {word}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
      <PublicFooter />
    </div>
  )
}
