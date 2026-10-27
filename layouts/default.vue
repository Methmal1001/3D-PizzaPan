<script setup>
import { useUiStore } from '~/stores/ui'

const route = useRoute()
const ui = useUiStore()
const immersive = computed(() => !!route.meta.immersive)

// Close overlays whenever the route changes
watch(
  () => route.fullPath,
  () => {
    ui.mobileNavOpen = false
  },
)
</script>

<template>
  <div class="relative flex min-h-screen flex-col">
    <a
      href="#main"
      class="sr-only z-[100] rounded-full bg-charcoal-800 px-4 py-2 text-cream-100 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
    >
      Skip to content
    </a>
    <AppHeader :overlay="immersive" />
    <main id="main" class="flex-1" :class="immersive ? '' : 'pt-16 sm:pt-[72px]'">
      <slot />
    </main>
    <AppFooter v-if="!route.meta.hideFooter" />
    <MobileCartBar />
    <CartDrawer />
    <ToastStack />
  </div>
</template>
