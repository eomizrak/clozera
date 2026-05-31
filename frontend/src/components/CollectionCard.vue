<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Pin, PinOff, Rows3 } from '@lucide/vue'

const props = defineProps({
  collection: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['pin', 'unpin'])

const collectionMeta = computed(() => {
  const value = props.collection.level

  if (!value) return ''

  return String(value).replaceAll('_', ' ')
})

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(value || 0)
}

function pinLabel() {
  return props.collection.isPinned ? 'Remove from dashboard' : 'Add to dashboard'
}
</script>

<template>
  <article class="collection-card">
    <RouterLink
      class="collection-card__body"
      :to="{ name: 'collection-detail', params: { id: collection.id } }"
      :aria-label="`Open ${collection.name}`"
    >
      <p v-if="collectionMeta" class="collection-card__meta">{{ collectionMeta }}</p>
      <p v-else-if="collection.relationship === 'community' && collection.creator" class="collection-card__meta">
        by {{ collection.creator.displayName }}
      </p>
      <h3 class="collection-card__title">{{ collection.name }}</h3>
      <p class="collection-card__description">
        {{ collection.description || 'Focused cloze practice collection.' }}
      </p>
    </RouterLink>

    <div class="collection-card__footer">
      <p class="collection-card__sentences">
        <Rows3 :size="16" aria-hidden="true" />
        <span>{{ formatNumber(collection.sentenceCount) }} sentences</span>
      </p>
      <button
        v-if="collection.capabilities?.canPin || collection.capabilities?.canUnpin"
        class="ui-button ui-button--icon-sm collection-card__pin"
        type="button"
        :aria-label="pinLabel()"
        :title="pinLabel()"
        @click="collection.isPinned ? emit('unpin', collection) : emit('pin', collection)"
      >
        <PinOff v-if="collection.isPinned" :size="18" aria-hidden="true" />
        <Pin v-else :size="18" aria-hidden="true" />
      </button>
    </div>
  </article>
</template>
