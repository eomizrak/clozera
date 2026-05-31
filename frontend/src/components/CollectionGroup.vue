<script setup>
import { ChevronDown } from '@lucide/vue'
import CollectionCard from '@/components/CollectionCard.vue'
import { useCollectionsStore } from '@/stores/collections'

defineProps({
  groups: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['pin', 'practice', 'unpin'])

const collections = useCollectionsStore()

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(value || 0)
}

function sentenceTotal(group) {
  return group.collections.reduce((total, collection) => total + (collection.sentenceCount || 0), 0)
}

function pluralize(value, singular, plural = `${singular}s`) {
  return `${formatNumber(value)} ${value === 1 ? singular : plural}`
}

function groupSummary(group) {
  const collectionCount = group.collections.length
  const sentenceCount = sentenceTotal(group)

  return `${pluralize(collectionCount, 'Collection')} / ${pluralize(sentenceCount, 'Sentence')}`
}

function groupCardsId(group) {
  return `collection-group-${group.id}-cards`
}

function groupTitleId(group) {
  return `collection-group-${group.id}-title`
}

function groupSummaryId(group) {
  return `collection-group-${group.id}-summary`
}
</script>

<template>
  <div class="collection-group">
    <article v-for="group in groups" :key="group.id" class="collection-group__item">
      <header class="collection-group__row">
        <button
          class="collection-group__toggle"
          :class="{ 'collection-group__toggle--open': collections.isGroupExpanded(group) }"
          type="button"
          :aria-expanded="collections.isGroupExpanded(group)"
          :aria-controls="groupCardsId(group)"
          :aria-labelledby="groupTitleId(group)"
          :aria-describedby="groupSummaryId(group)"
          @click="collections.toggleGroup(group)"
        >
          <ChevronDown :size="20" stroke-width="3" aria-hidden="true" />
        </button>

        <div class="collection-group__copy">
          <h3 :id="groupTitleId(group)" class="collection-group__heading">{{ group.name }}</h3>
          <p :id="groupSummaryId(group)" class="collection-group__summary">
            {{ groupSummary(group) }}
          </p>
        </div>
      </header>

      <ul
        v-if="collections.isGroupExpanded(group)"
        :id="groupCardsId(group)"
        class="collection-group__cards"
      >
        <li
          v-for="collection in group.collections"
          :key="collection.id"
          class="collection-group__card-item"
        >
          <CollectionCard
            :collection="collection"
            @pin="emit('pin', $event)"
            @practice="emit('practice', $event)"
            @unpin="emit('unpin', $event)"
          />
        </li>
      </ul>
    </article>
  </div>
</template>
