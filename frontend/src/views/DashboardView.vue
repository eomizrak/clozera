<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import SelectButton from 'primevue/selectbutton'
import Textarea from 'primevue/textarea'
import { Plus, Search } from '@lucide/vue'
import CollectionCard from '@/components/CollectionCard.vue'
import CollectionGroup from '@/components/CollectionGroup.vue'
import DashboardNavbar from '@/components/DashboardNavbar.vue'
import { filterCollectionShelves } from '@/lib/collection-shelves'
import {
  DASHBOARD_SECTIONS,
  loadDashboardSection,
  readDashboardSection,
  restoreDashboardScroll,
  saveDashboardState as persistDashboardState,
} from '@/lib/dashboard-workflow'
import { useAccountStore } from '@/stores/account'
import { useCollectionsStore } from '@/stores/collections'
import { useLanguagesStore } from '@/stores/languages'

const account = useAccountStore()
const collections = useCollectionsStore()
const languages = useLanguagesStore()

const createDialogVisible = ref(false)
const searchVisible = ref(false)
const searchQuery = ref('')
const activeSection = ref(readDashboardSection())
const hasRestoredScroll = ref(false)
const sectionOptions = [
  { label: 'Dashboard', value: DASHBOARD_SECTIONS.dashboard },
  { label: 'Collections', value: DASHBOARD_SECTIONS.collections },
]

const newCollection = reactive({
  name: '',
  description: '',
  isPublic: false,
})

const filteredShelves = computed(() => filterCollectionShelves(collections.collectionShelves, searchQuery.value))

function saveDashboardState() {
  persistDashboardState({ section: activeSection.value })
}

async function restoreScroll() {
  await restoreDashboardScroll({
    hasRestored: () => hasRestoredScroll.value,
    markRestored: () => {
      hasRestoredScroll.value = true
    },
    nextTick,
  })
}

async function loadDashboardCollections(slug = account.selectedLanguagePairSlug) {
  if (!slug) return
  await collections.loadDashboardCollections({ languagePair: slug })
}

async function loadLibraryCollections(slug = account.selectedLanguagePairSlug) {
  if (!slug) return
  await collections.loadCollections({ languagePair: slug, perPage: 100 })
}

async function loadActiveSection(slug = account.selectedLanguagePairSlug) {
  await loadDashboardSection({
    section: activeSection.value,
    languagePairSlug: slug,
    loadDashboardCollections,
    loadLibraryCollections,
  })

  await restoreScroll()
}

async function selectSection(section) {
  activeSection.value = section
  saveDashboardState()

  await loadDashboardSection({
    section,
    languagePairSlug: account.selectedLanguagePairSlug,
    loadDashboardCollections,
    loadLibraryCollections,
  })
}

function resetCreateForm() {
  newCollection.name = ''
  newCollection.description = ''
  newCollection.isPublic = false
}

async function submitCreateCollection() {
  const name = newCollection.name.trim()

  if (!name || !account.selectedLanguagePairSlug) return

  try {
    await collections.createCollection({
      name,
      description: newCollection.description.trim() || undefined,
      type: 'topic',
      languagePairSlug: account.selectedLanguagePairSlug,
      isPublic: newCollection.isPublic,
    })

    resetCreateForm()
    createDialogVisible.value = false
    await Promise.all([
      loadDashboardCollections(),
      activeSection.value === DASHBOARD_SECTIONS.collections ? loadLibraryCollections() : Promise.resolve(),
    ])
  } catch {
    // Keep the dialog open so the user can adjust and try again.
  }
}

async function pinCollection(collection) {
  await collections.pinCollection(collection.id)
}

async function unpinCollection(collection) {
  await collections.unpinCollection(collection.id)
}

onMounted(async () => {
  window.addEventListener('scroll', saveDashboardState, { passive: true })
  await languages.ensureLoaded()
  await loadActiveSection()
})

onBeforeUnmount(() => {
  saveDashboardState()
  window.removeEventListener('scroll', saveDashboardState)
})
</script>

<template>
  <div class="dashboard-view">
    <DashboardNavbar @language-pair-change="loadActiveSection" />

    <main class="dashboard-view__main" aria-label="Dashboard collections">
      <section class="dashboard-view__toolbar" aria-label="Dashboard sections">
        <SelectButton
          class="dashboard-view__tabs"
          :model-value="activeSection"
          :options="sectionOptions"
          option-label="label"
          option-value="value"
          :allow-empty="false"
          aria-label="Dashboard sections"
          @update:model-value="selectSection"
        />

        <div class="dashboard-view__actions">
          <button
            class="ui-button ui-button--icon dashboard-view__icon-button"
            :class="{ 'ui-button--active': searchVisible }"
            type="button"
            aria-label="Search collections"
            :aria-pressed="searchVisible"
            @click="searchVisible = !searchVisible"
          >
            <Search :size="20" stroke-width="2.5" />
          </button>
          <button
            class="ui-button ui-button--icon ui-button--primary dashboard-view__icon-button"
            type="button"
            aria-label="Create collection"
            @click="createDialogVisible = true"
          >
            <Plus :size="20" stroke-width="2.6" />
          </button>
        </div>
      </section>

      <section v-if="searchVisible" class="dashboard-view__search" aria-label="Search collections">
        <InputText v-model="searchQuery" placeholder="Search collections" />
      </section>

      <section
        v-if="activeSection === 'dashboard'"
        class="dashboard-view__collections"
        aria-label="Dashboard collections"
      >
        <ProgressSpinner v-if="collections.isLoadingDashboard" class="dashboard-view__loading" />
        <Message v-else-if="collections.error" severity="error" :closable="false">
          {{ collections.error }}
        </Message>
        <div v-else-if="collections.dashboardCollections.length === 0" class="dashboard-view__empty">
          <h2>No pinned collections yet.</h2>
          <p>Add collections to your dashboard from the Collections tab.</p>
        </div>
        <ul v-else class="dashboard-view__card-grid" aria-label="Pinned dashboard collections">
          <li
            v-for="collection in collections.dashboardCollections"
            :key="collection.id"
            class="collection-group__card-item"
          >
            <CollectionCard
              :collection="collection"
              @pin="pinCollection"
              @unpin="unpinCollection"
            />
          </li>
        </ul>
      </section>

      <section v-else class="dashboard-view__collections" aria-label="Collections">
        <ProgressSpinner v-if="collections.isLoading" class="dashboard-view__loading" />
        <Message v-else-if="collections.error" severity="error" :closable="false">
          {{ collections.error }}
        </Message>
        <div v-else-if="collections.collectionShelves.length === 0" class="dashboard-view__empty">
          <h2>No collections yet.</h2>
          <p>Create the first collection for this language pair.</p>
          <Button
            class="ui-button ui-button--primary"
            label="New collection"
            @click="createDialogVisible = true"
          />
        </div>
        <div v-else-if="filteredShelves.length === 0" class="dashboard-view__empty">
          <h2>No matches found.</h2>
          <p>Try a different collection name.</p>
        </div>
        <div v-else class="dashboard-view__shelves">
          <section
            v-for="shelf in filteredShelves"
            :key="shelf.id"
            class="dashboard-view__shelf"
            :aria-label="shelf.name"
          >
            <h2>{{ shelf.name }}</h2>
            <CollectionGroup :groups="shelf.groups" @pin="pinCollection" @unpin="unpinCollection" />
          </section>
        </div>
      </section>
    </main>

    <Dialog
      v-model:visible="createDialogVisible"
      class="ui-dialog"
      modal
      header="New collection"
      :draggable="false"
    >
      <form class="dashboard-view__create-form" @submit.prevent="submitCreateCollection">
        <label class="dashboard-view__field">
          Collection name
          <InputText v-model="newCollection.name" autofocus />
        </label>

        <label class="dashboard-view__field">
          Description
          <Textarea v-model="newCollection.description" auto-resize rows="3" />
        </label>

        <label class="dashboard-view__check-field">
          <Checkbox v-model="newCollection.isPublic" binary input-id="new-collection-public" />
          <span>Make public</span>
        </label>

        <Button
          class="ui-button ui-button--primary dashboard-view__create-submit"
          type="submit"
          label="Create collection"
          :disabled="!newCollection.name.trim() || !account.selectedLanguagePairSlug"
          :loading="collections.isCreating"
        />
      </form>
    </Dialog>
  </div>
</template>
