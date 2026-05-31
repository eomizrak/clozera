<template>
  <footer class="public-footer">
    <div class="public-footer__inner">
      <p class="public-footer__copyright">© 2026 Clozera</p>

      <nav class="public-footer__nav" aria-label="Footer">
        <a href="mailto:info@clozera.app">Contact</a>
        <a href="/terms">Terms</a>
        <a href="/privacy">Privacy</a>
      </nav>
    </div>
  </footer>
</template>

<style scoped>
.public-footer {
  padding: 1.4rem var(--page-gutter);
  color: var(--ui-text-body);
  font-family: var(--font-sans);
  background: var(--ui-surface-muted);
  border-top: 1px solid var(--ui-border-default);
}

.public-footer__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  width: min(100%, var(--page-max-width));
  margin: 0 auto;
}

.public-footer__copyright {
  margin: 0;
  color: var(--ui-text-accent);
  font-size: var(--text-md);
  line-height: var(--leading-normal);
}

.public-footer__nav {
  display: flex;
  align-items: center;
  gap: clamp(0.85rem, 2vw, 1.25rem);
}

.public-footer__nav a {
  color: var(--ui-text-accent);
  font-size: var(--text-md);
  font-weight: var(--weight-bold);
  text-decoration: none;
  text-underline-offset: 0.22rem;
}

.public-footer__nav a:hover,
.public-footer__nav a:focus-visible {
  color: var(--ui-color-primary);
  text-decoration: underline;
}

@media (max-width: 560px) {
  .public-footer__inner {
    align-items: center;
    flex-direction: column;
    gap: 0.9rem;
    text-align: center;
  }

  .public-footer__nav {
    justify-content: center;
    flex-wrap: wrap;
  }
}
</style>
