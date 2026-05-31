<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import { ArrowLeft, ArrowRight, Check, RotateCcw, X } from '@lucide/vue'
import DashboardNavbar from '@/components/DashboardNavbar.vue'
import { sentenceParts } from '@/lib/sentence-authoring'
import {
  answerMatchesSentence,
  choiceSlotsForSentence,
  practiceModeFromValue,
  PRACTICE_MODES,
  sessionSentencesFromCollection,
} from '@/lib/practice-session'
import { useCollectionsStore } from '@/stores/collections'

const route = useRoute()
const router = useRouter()
const collections = useCollectionsStore()

const collectionId = computed(() => route.params.id)
const collection = computed(() => collections.activeCollection)
const sessionMode = computed(() => practiceModeFromValue(route.query.mode))
const sessionSentences = ref([])
const currentIndex = ref(0)
const typedAnswer = ref('')
const selectedChoice = ref('')
const checked = ref(false)
const isCorrect = ref(false)
const choiceSlots = ref([])
const hasStarted = ref(false)
const isComplete = ref(false)
const correctCount = ref(0)

const currentSentence = computed(() => sessionSentences.value[currentIndex.value] || null)
const totalQuestions = computed(() => sessionSentences.value.length)
const attemptedCount = computed(() => {
  if (!totalQuestions.value) return 0

  return Math.min(totalQuestions.value, currentIndex.value + (checked.value || isComplete.value ? 1 : 0))
})
const progressPercent = computed(() => {
  if (!totalQuestions.value) return 0

  return Math.round((attemptedCount.value / totalQuestions.value) * 100)
})
const isChoiceMode = computed(() => sessionMode.value === PRACTICE_MODES.choice)
const answerValue = computed(() => (isChoiceMode.value ? selectedChoice.value : typedAnswer.value))
const canCheckTypedAnswer = computed(() => !checked.value && typedAnswer.value.trim().length > 0)
const resultLabel = computed(() => (isCorrect.value ? 'Correct' : 'Correct answer'))

function resetQuestionState() {
  typedAnswer.value = ''
  selectedChoice.value = ''
  checked.value = false
  isCorrect.value = false
  choiceSlots.value = currentSentence.value ? choiceSlotsForSentence(currentSentence.value) : []
}

function startSession() {
  sessionSentences.value = sessionSentencesFromCollection(collections.activeCollectionSentences, 10)
  currentIndex.value = 0
  correctCount.value = 0
  isComplete.value = sessionSentences.value.length === 0
  hasStarted.value = true
  resetQuestionState()
}

function checkAnswer(answer = answerValue.value) {
  if (!currentSentence.value || checked.value || !String(answer || '').trim()) return

  selectedChoice.value = isChoiceMode.value ? answer : selectedChoice.value
  isCorrect.value = answerMatchesSentence(currentSentence.value, answer)
  checked.value = true

  if (isCorrect.value) {
    correctCount.value += 1
  }
}

function nextQuestion() {
  if (!checked.value) return

  if (currentIndex.value >= totalQuestions.value - 1) {
    isComplete.value = true
    return
  }

  currentIndex.value += 1
  resetQuestionState()
}

function goBackToCollection() {
  router.push({ name: 'collection-detail', params: { id: collectionId.value } })
}

function isSelectedChoice(slot) {
  return selectedChoice.value && slot.label === selectedChoice.value
}

function choiceClass(slot) {
  return {
    'practice-session__choice--selected': isSelectedChoice(slot),
    'practice-session__choice--correct': checked.value && slot.isCorrect,
    'practice-session__choice--wrong': checked.value && isSelectedChoice(slot) && !slot.isCorrect,
  }
}

onMounted(async () => {
  await Promise.all([
    collections.loadCollection(collectionId.value),
    collections.loadCollectionSentences({ collectionId: collectionId.value, perPage: 100 }),
  ])
  startSession()
})
</script>

<template>
  <div class="dashboard-view practice-session">
    <DashboardNavbar />

    <main class="practice-session__main" aria-label="Practice session">
      <button
        class="ui-link-button ui-link-button--back practice-session__back"
        type="button"
        @click="goBackToCollection"
      >
        <ArrowLeft :size="18" stroke-width="2.5" />
        <span>Back to collection</span>
      </button>

      <ProgressSpinner v-if="collections.isLoadingCollection && !hasStarted" class="dashboard-view__loading" />
      <Message v-else-if="collections.error" severity="error" :closable="false">
        {{ collections.error }}
      </Message>

      <template v-else-if="collection">
        <section class="practice-session__topbar" aria-label="Practice progress">
          <div class="practice-session__topbar-copy">
            <p>{{ collection.name }}</p>
            <span>{{ isChoiceMode ? 'Multiple choice' : 'Typed answer' }}</span>
          </div>
          <div class="practice-session__score">
            <Check :size="18" stroke-width="3" aria-hidden="true" />
            <span>{{ correctCount }}</span>
            <X :size="18" stroke-width="3" aria-hidden="true" />
            <span>{{ attemptedCount - correctCount }}</span>
          </div>
        </section>

        <div class="practice-session__meter" aria-hidden="true">
          <span :style="{ width: `${isComplete ? 100 : progressPercent}%` }"></span>
        </div>

        <section v-if="isComplete" class="practice-session__result" aria-label="Practice result">
          <p class="practice-session__eyebrow">Session complete</p>
          <h1>{{ correctCount }} / {{ totalQuestions }} correct</h1>
          <p>{{ totalQuestions ? 'Run it again for a fresh random set.' : 'This collection has no sentences yet.' }}</p>
          <div class="practice-session__result-actions">
            <Button
              class="ui-button ui-button--primary"
              type="button"
              label="Practice again"
              :disabled="!totalQuestions"
              @click="startSession"
            >
              <template #icon>
                <RotateCcw :size="18" aria-hidden="true" />
              </template>
            </Button>
            <Button class="ui-button" type="button" label="Back to collection" @click="goBackToCollection">
              <template #icon>
                <ArrowLeft :size="18" aria-hidden="true" />
              </template>
            </Button>
          </div>
        </section>

        <section v-else-if="currentSentence" class="practice-session__question" aria-label="Practice question">
          <p class="practice-session__counter">Sentence {{ currentIndex + 1 }} / {{ totalQuestions }}</p>

          <div class="practice-session__sentence">
            <p>
              <template v-for="(part, partIndex) in sentenceParts(currentSentence)" :key="partIndex">
                <span v-if="part.isCloze" class="practice-session__blank">____</span>
                <span v-else>{{ part.text }}</span>
              </template>
            </p>
            <span>{{ currentSentence.translation }}</span>
          </div>

          <form v-if="!isChoiceMode" class="practice-session__typed" @submit.prevent="checkAnswer()">
            <InputText
              v-model="typedAnswer"
              class="practice-session__input"
              placeholder="Type the missing word"
              :disabled="checked"
              autofocus
            />
            <Button
              class="ui-button ui-button--primary practice-session__check"
              type="submit"
              label="Check"
              :disabled="!canCheckTypedAnswer"
            />
          </form>

          <div v-else class="practice-session__choices" aria-label="Answer choices">
            <button
              v-for="slot in choiceSlots"
              :key="slot.id"
              class="practice-session__choice"
              :class="choiceClass(slot)"
              type="button"
              :disabled="slot.disabled || checked"
              @click="checkAnswer(slot.label)"
            >
              {{ slot.label || 'Empty' }}
            </button>
          </div>

          <div
            v-if="checked"
            class="practice-session__feedback"
            :class="{ 'practice-session__feedback--wrong': !isCorrect }"
          >
            <span>{{ resultLabel }}:</span>
            <strong>{{ currentSentence.cloze }}</strong>
          </div>

          <Button
            class="ui-button ui-button--primary practice-session__next"
            type="button"
            label="Next"
            :disabled="!checked"
            @click="nextQuestion"
          >
            <template #icon>
              <ArrowRight :size="18" aria-hidden="true" />
            </template>
          </Button>
        </section>
      </template>
    </main>
  </div>
</template>
