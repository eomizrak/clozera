<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import Textarea from 'primevue/textarea'
import { ArrowLeft, Keyboard, ListChecks, Pencil, Pin, PinOff, Play, Plus, Rows3, Search, Trash2 } from '@lucide/vue'
import DashboardNavbar from '@/components/DashboardNavbar.vue'
import { PRACTICE_MODES } from '@/lib/practice-session'
import {
  inferClozeFromText,
  sentenceParts,
  sentencePayloadFromForm,
  textFromList,
} from '@/lib/sentence-authoring'
import { useCollectionsStore } from '@/stores/collections'

const route = useRoute()
const router = useRouter()
const collections = useCollectionsStore()

const collectionId = computed(() => route.params.id)
const collection = computed(() => collections.activeCollection)
const sentences = computed(() => collections.activeCollectionSentences)
const canEditCollection = computed(() => Boolean(collection.value?.capabilities?.canEdit))
const createDialogVisible = ref(false)
const editDialogVisible = ref(false)
const editCollectionDialogVisible = ref(false)
const deleteCollectionDialogVisible = ref(false)
const practiceDialogVisible = ref(false)
const activeEditSentenceId = ref('')
const searchVisible = ref(false)
const searchQuery = ref('')
const practiceMode = ref(PRACTICE_MODES.typed)
const clozeOpenMarker = '{{'
const clozeCloseMarker = '}}'
const clozeExampleText = 'A {{missing}} word.'
const practiceModeOptions = [
  {
    value: PRACTICE_MODES.typed,
    label: 'Typed answer',
    icon: Keyboard,
  },
  {
    value: PRACTICE_MODES.choice,
    label: 'Multiple choice',
    icon: ListChecks,
  },
]
const newSentence = reactive({
  text: '',
  translation: '',
  alternativeAnswers: '',
  multipleChoiceOptions: '',
  hint: '',
  notes: '',
})
const editSentence = reactive({
  text: '',
  translation: '',
  alternativeAnswers: '',
  multipleChoiceOptions: '',
  hint: '',
  notes: '',
})
const editCollection = reactive({
  name: '',
  description: '',
  isPublic: false,
})

const filteredSentences = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  if (!query) return sentences.value

  return sentences.value.filter((sentence) =>
    [
      sentence.text,
      sentence.translation,
      sentence.cloze,
      sentence.hint,
      sentence.notes,
      ...(sentence.alternativeAnswers || []),
      ...(sentence.multipleChoiceOptions || []),
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query)),
  )
})

const newSentencePreviewParts = computed(() =>
  sentenceParts({
    text: newSentence.text,
  }),
)

const inferredCloze = computed(() => {
  return inferClozeFromText(newSentence.text)
})

const editInferredCloze = computed(() => {
  return inferClozeFromText(editSentence.text)
})

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(value || 0)
}

function resetCreateSentenceForm() {
  newSentence.text = ''
  newSentence.translation = ''
  newSentence.alternativeAnswers = ''
  newSentence.multipleChoiceOptions = ''
  newSentence.hint = ''
  newSentence.notes = ''
}

function resetEditSentenceForm() {
  activeEditSentenceId.value = ''
  editSentence.text = ''
  editSentence.translation = ''
  editSentence.alternativeAnswers = ''
  editSentence.multipleChoiceOptions = ''
  editSentence.hint = ''
  editSentence.notes = ''
}

function openEditSentenceDialog(sentence) {
  activeEditSentenceId.value = sentence.id
  editSentence.text = sentence.text || ''
  editSentence.translation = sentence.translation || ''
  editSentence.alternativeAnswers = textFromList(sentence.alternativeAnswers)
  editSentence.multipleChoiceOptions = textFromList(sentence.multipleChoiceOptions)
  editSentence.hint = sentence.hint || ''
  editSentence.notes = sentence.notes || ''
  editDialogVisible.value = true
}

function openEditCollectionDialog() {
  if (!collection.value) return

  editCollection.name = collection.value.name || ''
  editCollection.description = collection.value.description || ''
  editCollection.isPublic = collection.value.visibility === 'public'
  editCollectionDialogVisible.value = true
}

async function submitCreateSentence() {
  if (!newSentence.text.trim() || !newSentence.translation.trim() || !inferredCloze.value) {
    return
  }

  try {
    await collections.createSentence(collectionId.value, {
      ...sentencePayloadFromForm(newSentence),
    })
    resetCreateSentenceForm()
    createDialogVisible.value = false
    await collections.loadCollection(collectionId.value)
    await collections.loadCollectionSentences({ collectionId: collectionId.value })
  } catch {
    // Keep the dialog open so the user can adjust and retry.
  }
}

async function submitEditSentence() {
  if (
    !activeEditSentenceId.value ||
    !editSentence.text.trim() ||
    !editSentence.translation.trim() ||
    !editInferredCloze.value
  ) {
    return
  }

  try {
    await collections.updateSentence(collectionId.value, activeEditSentenceId.value, {
      ...sentencePayloadFromForm(editSentence),
    })
    resetEditSentenceForm()
    editDialogVisible.value = false
    await collections.loadCollectionSentences({ collectionId: collectionId.value })
  } catch {
    // Keep the dialog open so the user can adjust and retry.
  }
}

async function submitEditCollection() {
  if (!collection.value || !editCollection.name.trim()) return

  try {
    await collections.updateCollection(collection.value.id, {
      name: editCollection.name.trim(),
      description: editCollection.description.trim(),
      visibility: editCollection.isPublic ? 'public' : 'private',
    })
    editCollectionDialogVisible.value = false
  } catch {
    // Keep the dialog open so the user can adjust and retry.
  }
}

async function deleteActiveCollection() {
  if (!collection.value || !collection.value.capabilities?.canDelete) return

  try {
    await collections.deleteCollection(collection.value.id)
    deleteCollectionDialogVisible.value = false
    editCollectionDialogVisible.value = false
    await router.push({ name: 'dashboard' })
  } catch {
    // Keep the dialog open so the user can retry or cancel.
  }
}

async function togglePinned() {
  if (!collection.value) return

  if (collection.value.isPinned) {
    await collections.unpinCollection(collection.value.id)
  } else {
    await collections.pinCollection(collection.value.id)
  }
}

function openPracticeDialog() {
  if (!collection.value?.sentenceCount) return

  practiceMode.value = PRACTICE_MODES.typed
  practiceDialogVisible.value = true
}

async function startPracticeSession() {
  if (!collection.value) return

  await router.push({
    name: 'collection-practice',
    params: { id: collection.value.id },
    query: { mode: practiceMode.value },
  })
}

function goBackToCollections() {
  router.push({ name: 'dashboard' })
}

onMounted(async () => {
  await collections.loadCollection(collectionId.value)
  await collections.loadCollectionSentences({ collectionId: collectionId.value })
})
</script>

<template>
  <div class="dashboard-view collection-detail-view">
    <DashboardNavbar />

    <main class="dashboard-view__main collection-detail-view__main" aria-label="Collection details">
      <button
        class="ui-link-button ui-link-button--back collection-detail-view__back"
        type="button"
        aria-label="Back to dashboard"
        @click="goBackToCollections"
      >
        <ArrowLeft :size="18" aria-hidden="true" />
        <span>Back</span>
      </button>

      <ProgressSpinner v-if="collections.isLoadingCollection" class="dashboard-view__loading" />

      <Message v-else-if="collections.error" severity="error" :closable="false">
        {{ collections.error }}
      </Message>

      <template v-else-if="collection">
        <section class="collection-detail-view__hero">
          <div class="collection-detail-view__hero-copy">
            <p v-if="collection.level" class="collection-card__meta">{{ collection.level }}</p>
            <h1>{{ collection.name }}</h1>
            <p>{{ collection.description || 'Focused cloze practice collection.' }}</p>
            <div class="collection-detail-view__stats">
              <Rows3 :size="18" aria-hidden="true" />
              <span>{{ formatNumber(collection.sentenceCount) }} sentences</span>
            </div>
          </div>

          <div class="collection-detail-view__hero-actions" aria-label="Collection tools">
            <button
              class="ui-button ui-button--icon-sm collection-detail-view__hero-action-button collection-detail-view__hero-action-button--play"
              type="button"
              :aria-label="collection.sentenceCount ? `Practice ${collection.name}` : 'No sentences to practice'"
              :title="collection.sentenceCount ? `Practice ${collection.name}` : 'No sentences to practice'"
              :disabled="!collection.sentenceCount"
              @click="openPracticeDialog"
            >
              <Play :size="17" aria-hidden="true" fill="currentColor" />
            </button>
            <button
              v-if="collection.capabilities?.canPin || collection.capabilities?.canUnpin"
              class="ui-button ui-button--icon-sm collection-detail-view__hero-action-button"
              type="button"
              :aria-label="collection.isPinned ? 'Remove from dashboard' : 'Add to dashboard'"
              :title="collection.isPinned ? 'Remove from dashboard' : 'Add to dashboard'"
              @click="togglePinned"
            >
              <PinOff v-if="collection.isPinned" :size="18" stroke-width="2.5" />
              <Pin v-else :size="18" stroke-width="2.5" />
            </button>
            <button
              v-if="canEditCollection"
              class="ui-button ui-button--icon-sm collection-detail-view__hero-action-button"
              type="button"
              aria-label="Edit collection"
              title="Edit collection"
              @click="openEditCollectionDialog"
            >
              <Pencil :size="18" stroke-width="2.5" />
            </button>
          </div>
        </section>

        <section class="collection-detail-view__toolbar" aria-label="Collection sentence tools">
          <button
            class="ui-button ui-button--icon collection-detail-view__tool-button"
            :class="{ 'ui-button--active': searchVisible }"
            type="button"
            aria-label="Search sentences"
            :aria-pressed="searchVisible"
            @click="searchVisible = !searchVisible"
          >
            <Search :size="20" stroke-width="2.5" />
          </button>
          <button
            v-if="canEditCollection"
            class="ui-button ui-button--icon ui-button--primary collection-detail-view__tool-button"
            type="button"
            aria-label="Add sentence"
            @click="createDialogVisible = true"
          >
            <Plus :size="20" stroke-width="2.6" />
          </button>
        </section>

        <section
          v-if="searchVisible"
          class="collection-detail-view__search"
          aria-label="Search sentences"
        >
          <InputText v-model="searchQuery" placeholder="Search sentences" />
        </section>

        <section class="collection-detail-view__sentences" aria-label="Collection sentences">
          <ol v-if="filteredSentences.length > 0" class="collection-detail-view__sentence-list">
            <li
              v-for="(sentence, index) in filteredSentences"
              :key="sentence.id"
              class="collection-detail-view__sentence"
            >
              <span class="collection-detail-view__sentence-number" aria-hidden="true">
                {{ index + 1 }}
              </span>
              <div class="collection-detail-view__sentence-body">
                <p class="collection-detail-view__sentence-text">
                  <template v-for="(part, partIndex) in sentenceParts(sentence)" :key="partIndex">
                    <span :class="{ 'collection-detail-view__cloze-word': part.isCloze }">{{
                      part.text
                    }}</span>
                  </template>
                </p>
                <p class="collection-detail-view__sentence-translation">
                  {{ sentence.translation }}
                </p>
              </div>
              <button
                v-if="canEditCollection"
                class="ui-button ui-button--icon-sm collection-detail-view__sentence-edit"
                type="button"
                aria-label="Edit sentence"
                title="Edit sentence"
                @click="openEditSentenceDialog(sentence)"
              >
                <Pencil :size="18" stroke-width="2.5" aria-hidden="true" />
              </button>
            </li>
          </ol>

          <div v-if="sentences.length === 0" class="dashboard-view__empty">
            <h2>No sentences yet.</h2>
            <p>This collection does not have practice sentences.</p>
          </div>
          <div v-else-if="filteredSentences.length === 0" class="dashboard-view__empty">
            <h2>No matches found.</h2>
            <p>Try a different sentence or translation.</p>
          </div>
        </section>
      </template>
    </main>

    <Dialog
      v-model:visible="practiceDialogVisible"
      class="ui-dialog dashboard-view__practice-dialog"
      modal
      header="Practice session"
      :draggable="false"
    >
      <div class="dashboard-view__practice-setup">
        <div class="dashboard-view__practice-copy">
          <p>{{ collection?.name }}</p>
          <span>Up to 10 random sentences</span>
        </div>

        <div class="dashboard-view__practice-modes" role="radiogroup" aria-label="Practice mode">
          <button
            v-for="option in practiceModeOptions"
            :key="option.value"
            class="dashboard-view__practice-mode"
            :class="{ 'dashboard-view__practice-mode--active': practiceMode === option.value }"
            type="button"
            role="radio"
            :aria-checked="practiceMode === option.value"
            @click="practiceMode = option.value"
          >
            <component :is="option.icon" :size="20" stroke-width="2.4" aria-hidden="true" />
            <span>{{ option.label }}</span>
          </button>
        </div>

        <Button
          class="ui-button ui-button--primary dashboard-view__create-submit"
          type="button"
          label="Start session"
          @click="startPracticeSession"
        >
          <template #icon>
            <Play :size="18" fill="currentColor" aria-hidden="true" />
          </template>
        </Button>
      </div>
    </Dialog>

    <Dialog
      v-model:visible="createDialogVisible"
      class="ui-dialog collection-detail-view__dialog"
      modal
      header="New sentence"
      :draggable="false"
    >
      <form class="collection-detail-view__create-form" @submit.prevent="submitCreateSentence">
        <p v-if="newSentence.text.trim()" class="collection-detail-view__sentence-preview">
          <template v-for="(part, partIndex) in newSentencePreviewParts" :key="partIndex">
            <span :class="{ 'collection-detail-view__cloze-word': part.isCloze }">
              {{ part.text }}
            </span>
          </template>
        </p>

        <label class="collection-detail-view__field">
          Text
          <InputText v-model="newSentence.text" placeholder="This is a {{sample}} sentence." />
          <span class="collection-detail-view__field-help">
            Wrap the cloze-word in
            <code>{{ clozeOpenMarker }}</code>
            <code>{{ clozeCloseMarker }}</code>
            , for example <code>{{ clozeExampleText }}</code
            >.
          </span>
        </label>

        <label class="collection-detail-view__field">
          Translation
          <InputText v-model="newSentence.translation" />
        </label>

        <label class="collection-detail-view__field">
          Alternative answers
          <span class="collection-detail-view__field-help">Comma-separated list</span>
          <InputText v-model="newSentence.alternativeAnswers" />
        </label>

        <label class="collection-detail-view__field">
          Multiple choice options
          <InputText v-model="newSentence.multipleChoiceOptions" />
        </label>

        <label class="collection-detail-view__field">
          Hint
          <span class="collection-detail-view__field-help">Shown before answering</span>
          <InputText v-model="newSentence.hint" />
        </label>

        <label class="collection-detail-view__field">
          Notes
          <span class="collection-detail-view__field-help">Shown after answering</span>
          <InputText v-model="newSentence.notes" />
        </label>

        <Message v-if="collections.error" severity="error" :closable="false">
          {{ collections.error }}
        </Message>

        <Button
          class="ui-button ui-button--primary collection-detail-view__create-submit"
          type="submit"
          label="Create sentence"
          :disabled="
            !newSentence.text.trim() ||
            !newSentence.translation.trim() ||
            !inferredCloze
          "
          :loading="collections.isCreatingSentence"
        />
      </form>
    </Dialog>

    <Dialog
      v-model:visible="editCollectionDialogVisible"
      class="ui-dialog collection-detail-view__dialog"
      modal
      header="Edit collection"
      :draggable="false"
    >
      <form class="collection-detail-view__create-form" @submit.prevent="submitEditCollection">
        <label class="collection-detail-view__field">
          Collection name
          <InputText v-model="editCollection.name" autofocus />
        </label>

        <label class="collection-detail-view__field">
          Description
          <Textarea v-model="editCollection.description" auto-resize rows="3" />
        </label>

        <label class="dashboard-view__check-field">
          <Checkbox v-model="editCollection.isPublic" binary input-id="edit-collection-public" />
          <span>Make public</span>
        </label>

        <Message v-if="collections.error" severity="error" :closable="false">
          {{ collections.error }}
        </Message>

        <div class="collection-detail-view__dialog-actions">
          <Button
            v-if="collection?.capabilities?.canDelete"
            class="ui-button ui-button--danger"
            type="button"
            label="Delete"
            :loading="collections.isLoadingCollection"
            @click="deleteCollectionDialogVisible = true"
          >
            <template #icon>
              <Trash2 :size="18" aria-hidden="true" />
            </template>
          </Button>
          <Button
            class="ui-button ui-button--primary"
            type="submit"
            label="Save changes"
            :disabled="!editCollection.name.trim()"
          />
        </div>
      </form>
    </Dialog>

    <Dialog
      v-model:visible="deleteCollectionDialogVisible"
      class="ui-dialog collection-detail-view__confirm-dialog"
      modal
      header="Delete collection?"
      :draggable="false"
      :closable="false"
    >
      <div class="collection-detail-view__confirm">
        <p>
          This will permanently delete
          <strong>{{ collection?.name }}</strong>
          and all of its sentences.
        </p>

        <div class="collection-detail-view__dialog-actions">
          <Button
            class="ui-button"
            type="button"
            label="Cancel"
            @click="deleteCollectionDialogVisible = false"
          />
          <Button
            class="ui-button ui-button--danger-solid"
            type="button"
            label="Delete collection"
            :loading="collections.isLoadingCollection"
            @click="deleteActiveCollection"
          />
        </div>
      </div>
    </Dialog>

    <Dialog
      v-model:visible="editDialogVisible"
      class="ui-dialog collection-detail-view__dialog"
      modal
      header="Edit sentence"
      :draggable="false"
      @hide="resetEditSentenceForm"
    >
      <form class="collection-detail-view__create-form" @submit.prevent="submitEditSentence">
        <p v-if="editSentence.text.trim()" class="collection-detail-view__sentence-preview">
          <template
            v-for="(part, partIndex) in sentenceParts({ text: editSentence.text })"
            :key="partIndex"
          >
            <span :class="{ 'collection-detail-view__cloze-word': part.isCloze }">
              {{ part.text }}
            </span>
          </template>
        </p>

        <label class="collection-detail-view__field">
          Text
          <InputText v-model="editSentence.text" />
          <span class="collection-detail-view__field-help">
            Wrap the cloze-word in
            <code>{{ clozeOpenMarker }}</code>
            <code>{{ clozeCloseMarker }}</code>
            , for example <code>{{ clozeExampleText }}</code
            >.
          </span>
        </label>

        <label class="collection-detail-view__field">
          Translation
          <InputText v-model="editSentence.translation" />
        </label>

        <label class="collection-detail-view__field">
          Alternative answers
          <span class="collection-detail-view__field-help">Comma-separated list</span>
          <InputText v-model="editSentence.alternativeAnswers" />
        </label>

        <label class="collection-detail-view__field">
          Multiple choice options
          <InputText v-model="editSentence.multipleChoiceOptions" />
        </label>

        <label class="collection-detail-view__field">
          Hint
          <span class="collection-detail-view__field-help">Shown before answering</span>
          <InputText v-model="editSentence.hint" />
        </label>

        <label class="collection-detail-view__field">
          Notes
          <span class="collection-detail-view__field-help">Shown after answering</span>
          <InputText v-model="editSentence.notes" />
        </label>

        <Message v-if="collections.error" severity="error" :closable="false">
          {{ collections.error }}
        </Message>

        <Button
          class="ui-button ui-button--primary collection-detail-view__create-submit"
          type="submit"
          label="Save changes"
          :disabled="
            !editSentence.text.trim() ||
            !editSentence.translation.trim() ||
            !editInferredCloze
          "
          :loading="collections.isUpdatingSentence"
        />
      </form>
    </Dialog>
  </div>
</template>
