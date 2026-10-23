import { Button } from '@/components/ui/button'

export default function PublicFooter() {
  return (
    <footer className="mt-auto border-t bg-card/80 px-5 py-5">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <p>© 2026 Clozera · Open-source language learning</p>
        <nav aria-label="Footer" className="flex gap-1">
          <Button variant="link" size="sm" asChild>
            <a href="mailto:info@clozera.app">Contact</a>
          </Button>
          <Button variant="link" size="sm" asChild>
            <a href="/terms">Terms</a>
          </Button>
          <Button variant="link" size="sm" asChild>
            <a href="/privacy">Privacy</a>
          </Button>
        </nav>
      </div>
    </footer>
  )
}
