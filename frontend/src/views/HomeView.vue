<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowRight, Check, Play } from '@lucide/vue'
import PublicFooter from '@/components/PublicFooter.vue'
import PublicNavbar from '@/components/PublicNavbar.vue'
import { useAccountStore } from '@/stores/account'
import { playTargetForUser } from '@/utils/account-routing'

const account = useAccountStore()

const startTarget = computed(() => (account.user ? playTargetForUser(account.user) : { name: 'sign-up' }))
const secondaryTarget = computed(() => (account.user ? { name: 'dashboard' } : { name: 'login' }))
const secondaryLabel = computed(() => (account.user ? 'Open dashboard' : 'Log in'))
</script>

<template>
  <div class="home-view">
    <PublicNavbar />

    <main class="home-view__main" aria-labelledby="landing-title">
      <section class="home-view__hero">
        <div class="home-view__content">
          <div class="home-view__copy">
            <p class="home-view__eyebrow">Cloze practice for language learners</p>
            <h1 id="landing-title">Practice languages one missing word at a time.</h1>
            <p class="home-view__lead">
              Clozera turns sentence collections into quick recall sessions. Fill the missing word,
              check yourself, and keep the full context in view.
            </p>
            <div class="home-view__actions">
              <RouterLink class="ui-button ui-button--primary home-view__primary-action" :to="startTarget">
                <Play :size="18" fill="currentColor" aria-hidden="true" />
                <span>Start practicing</span>
              </RouterLink>
              <RouterLink class="ui-button home-view__secondary-action" :to="secondaryTarget">
                <span>{{ secondaryLabel }}</span>
                <ArrowRight :size="18" aria-hidden="true" />
              </RouterLink>
            </div>
          </div>

          <div class="home-view__panel" aria-label="Practice preview">
            <div class="home-view__panel-top">
              <div>
                <span class="home-view__panel-label">Practice preview</span>
                <p>German Basics</p>
              </div>
              <div class="home-view__score" aria-label="Example score">
                <Check :size="17" stroke-width="3" aria-hidden="true" />
                <span>2</span>
              </div>
            </div>
            <div class="home-view__progress" aria-hidden="true">
              <span></span>
            </div>
            <div class="home-view__prompt">
              <span>Sentence 3 / 10</span>
              <p class="home-view__sentence">
                Ich trinke jeden Morgen <span aria-label="missing word">____</span>.
              </p>
              <p class="home-view__translation">I drink coffee every morning.</p>
            </div>
            <div class="home-view__choices" aria-label="Example answer choices">
              <span>Kaffee</span>
              <span>Tee</span>
              <span>Wasser</span>
              <span>Milch</span>
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
  padding: clamp(1.75rem, 5vw, 4.25rem) var(--page-gutter);
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
  grid-template-columns: minmax(0, 0.96fr) minmax(20rem, 0.86fr);
  align-items: center;
  gap: clamp(2rem, 5vw, 4rem);
  padding: clamp(1.25rem, 3.5vw, 2.5rem);
  background: rgba(255, 255, 255, 0.74);
  border: 1px solid var(--ui-border-strong);
  border-radius: var(--ui-radius-hero);
  box-shadow: var(--ui-shadow-soft);
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
  max-width: 14ch;
  margin: 0;
  color: var(--ui-text-strong);
  font-family: var(--font-display);
  font-size: var(--text-hero);
  font-weight: var(--weight-bold);
  line-height: var(--leading-tight);
  letter-spacing: 0;
}

.home-view__hero p {
  max-width: 50ch;
  margin: 0;
  color: var(--ui-text-body);
  font-size: var(--text-body);
  line-height: var(--leading-relaxed);
}

.home-view__lead {
  color: var(--public-copy);
  font-size: var(--text-lead);
}

.home-view__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding-top: 0.25rem;
}

.home-view__primary-action,
.home-view__secondary-action {
  min-width: 10rem;
  padding: 0 1rem;
  text-decoration: none;
}

.home-view__panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: clamp(1.25rem, 2.5vw, 1.75rem);
  color: var(--ui-text-strong);
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid var(--ui-border-strong);
  border-radius: var(--ui-radius-shell);
  box-shadow: var(--ui-shadow-raised);
}

.home-view__panel-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.home-view__panel-top > div:first-child {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.home-view__panel-label {
  color: var(--ui-color-primary-active);
  font-size: var(--text-xs);
  font-weight: var(--weight-extrabold);
  letter-spacing: 0;
  text-transform: uppercase;
}

.home-view__panel-top p {
  margin: 0;
  color: var(--ui-text-strong);
  font-family: var(--font-display);
  font-size: var(--heading-card);
  font-weight: var(--weight-bold);
  line-height: var(--leading-title);
}

.home-view__score {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--ui-text-strong);
  font-weight: var(--weight-black);
}

.home-view__score svg {
  color: #3b8f43;
}

.home-view__progress {
  overflow: hidden;
  height: 0.5rem;
  background: rgba(255, 247, 237, 0.92);
  border: 1px solid var(--ui-border-input);
  border-radius: 999px;
}

.home-view__progress span {
  display: block;
  width: 34%;
  height: 100%;
  background: #68ad5b;
  border-radius: inherit;
}

.home-view__prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  padding: 0.9rem 0.2rem 0.4rem;
  text-align: center;
}

.home-view__prompt > span {
  color: var(--ui-color-primary-active);
  font-size: var(--text-xs);
  font-weight: var(--weight-black);
  text-transform: uppercase;
}

.home-view__sentence {
  margin: 0;
  color: var(--ui-text-strong);
  font-family: var(--font-display);
  font-size: clamp(1.75rem, 4vw, 2.8rem);
  font-weight: var(--weight-bold);
  line-height: var(--leading-tight);
}

.home-view__sentence span {
  display: inline-flex;
  min-width: 3.8ch;
  justify-content: center;
  color: var(--ui-color-primary-active);
  background: transparent;
  border-bottom: 0.16em solid currentColor;
}

.home-view__translation {
  margin: 0;
  color: var(--ui-text-strong);
  font-size: var(--text-md);
  font-weight: var(--weight-bold);
  line-height: var(--leading-snug);
}

.home-view__choices {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.55rem;
}

.home-view__choices span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 3rem;
  padding: 0.7rem 0.45rem;
  color: var(--ui-text-accent);
  font-size: var(--text-sm);
  font-weight: var(--weight-extrabold);
  background: rgba(255, 247, 237, 0.82);
  border: 1px solid var(--ui-border-soft);
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
    box-shadow: none;
  }

  .home-view__hero h1 {
    font-size: var(--text-hero-mobile);
  }

  .home-view__panel {
    border-radius: var(--ui-radius-panel);
  }

  .home-view__choices {
    grid-template-columns: 1fr;
  }
}
</style>
