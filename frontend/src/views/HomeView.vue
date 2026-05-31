<script setup>
import PublicFooter from '@/components/PublicFooter.vue'
import PublicNavbar from '@/components/PublicNavbar.vue'
</script>

<template>
  <div class="home-view">
    <PublicNavbar />

    <main class="home-view__main" aria-labelledby="landing-title">
      <section class="home-view__hero">
        <div class="home-view__content">
          <div class="home-view__copy">
            <p class="home-view__eyebrow">Cloze-based learning</p>
            <h1 id="landing-title">Learn languages through active recall.</h1>
            <p class="home-view__lead">
              Cloze-based learning removes one meaningful word from a sentence and asks you to bring
              it back from memory.
            </p>
            <p>
              The surrounding context stays visible, so each prompt trains vocabulary, grammar, and
              comprehension together in a short, repeatable loop.
            </p>
          </div>

          <div class="home-view__panel" aria-label="Cloze example">
            <span class="home-view__panel-label">Example prompt</span>
            <p class="home-view__sentence">
              Ich <span aria-label="missing word">____</span> jeden Morgen Kaffee.
            </p>
            <div class="home-view__steps">
              <span>Read</span>
              <span>Recall</span>
              <span>Repeat</span>
            </div>
          </div>
        </div>
      </section>
    </main>

    <PublicFooter />
  </div>
</template>

<style scoped>
.home-view {
  min-height: 100vh;
  font-family: var(--font-sans);
  background:
    radial-gradient(circle at 84% 18%, var(--public-glow-strong), transparent 28rem),
    var(--public-page-bg);
}

.home-view__main {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 166px);
  padding: clamp(2.5rem, 6vw, 5rem) var(--page-gutter);
}

.home-view__hero {
  position: relative;
  width: min(100%, var(--page-max-width));
}

.home-view__hero::before {
  position: absolute;
  inset: -2rem -1.75rem;
  z-index: -1;
  content: '';
  background:
    linear-gradient(var(--public-grid-line) 1px, transparent 1px),
    linear-gradient(90deg, var(--public-grid-line) 1px, transparent 1px);
  background-size: 4.5rem 4.5rem;
  mask-image: linear-gradient(90deg, black, transparent 72%);
  opacity: 0.58;
}

.home-view__content {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(18rem, 0.78fr);
  align-items: center;
  gap: clamp(2rem, 5vw, 4rem);
  padding: clamp(1.25rem, 3vw, 2rem);
  background: var(--public-surface);
  border: 1px solid var(--ui-border-soft);
  border-radius: var(--ui-radius-hero);
}

.home-view__copy {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 660px;
}

.home-view__eyebrow {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  margin: 0;
  padding: 0.45rem 0.75rem;
  color: var(--ui-color-primary-active);
  font-size: var(--text-xs);
  font-weight: var(--weight-extrabold);
  letter-spacing: 0;
  background: var(--public-chip-bg);
  border: 1px solid var(--ui-border-accent);
  border-radius: 999px;
  text-transform: uppercase;
}

.home-view__hero h1 {
  max-width: 13ch;
  margin: 0;
  color: var(--ui-text-strong);
  font-family: var(--font-display);
  font-size: var(--text-hero);
  font-weight: var(--weight-bold);
  line-height: var(--leading-tight);
  letter-spacing: 0;
}

.home-view__hero p {
  max-width: 62ch;
  margin: 0;
  color: var(--ui-text-body);
  font-size: var(--text-body);
  line-height: var(--leading-relaxed);
}

.home-view__lead {
  color: var(--public-copy);
  font-size: var(--text-lead);
}

.home-view__panel {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: clamp(1.25rem, 2.5vw, 1.75rem);
  color: var(--ui-text-strong);
  background:
    linear-gradient(180deg, var(--ui-surface-card), var(--ui-surface-muted)),
    var(--public-cream);
  border: 1px solid var(--ui-border-strong);
  border-radius: var(--ui-radius-shell);
  box-shadow: var(--ui-shadow-raised);
}

.home-view__panel-label {
  color: var(--ui-color-primary-active);
  font-size: var(--text-xs);
  font-weight: var(--weight-extrabold);
  letter-spacing: 0;
  text-transform: uppercase;
}

.home-view__sentence {
  margin: 0;
  color: var(--ui-text-strong);
  font-size: var(--text-panel);
  font-weight: var(--weight-extrabold);
  line-height: var(--leading-snug);
}

.home-view__sentence span {
  display: inline-flex;
  min-width: 4.5ch;
  justify-content: center;
  color: var(--ui-surface-base);
  background: var(--ui-color-primary);
  border-radius: var(--ui-radius-card);
  box-shadow: var(--public-inset-shadow);
}

.home-view__steps {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.55rem;
}

.home-view__steps span {
  display: inline-flex;
  justify-content: center;
  padding: 0.7rem 0.45rem;
  color: var(--ui-text-accent);
  font-size: var(--text-sm);
  font-weight: var(--weight-extrabold);
  background: var(--ui-surface-chip);
  border: 1px solid var(--ui-border-strong);
  border-radius: var(--ui-radius-card);
}

@media (max-width: 820px) {
  .home-view__content {
    grid-template-columns: 1fr;
    align-items: start;
  }

  .home-view__hero h1 {
    max-width: 14ch;
  }
}

@media (max-width: 560px) {
  .home-view__main {
    align-items: flex-start;
    min-height: auto;
    padding-top: 2rem;
  }

  .home-view__content {
    padding: 0;
    background: transparent;
    border: 0;
  }

  .home-view__hero h1 {
    font-size: var(--text-hero-mobile);
  }

  .home-view__panel {
    border-radius: var(--ui-radius-panel);
  }

  .home-view__steps {
    grid-template-columns: 1fr;
  }
}
</style>
