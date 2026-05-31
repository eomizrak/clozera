<script setup>
import { RouterView } from 'vue-router'
import { useAccountStore } from '@/stores/account'

const account = useAccountStore()

if (!account.hasLoaded) {
  account.refreshSession()
}
</script>

<template>
  <RouterView />
</template>
