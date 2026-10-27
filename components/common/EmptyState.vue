<script setup>
defineProps({
  title: { type: String, required: true },
  text: { type: String, default: '' },
  dark: { type: Boolean, default: false },
})
</script>

<template>
  <div class="flex flex-col items-center px-6 py-14 text-center">
    <div class="relative h-28 w-28 opacity-90">
      <svg viewBox="0 0 120 120" class="h-full w-full" aria-hidden="true">
        <circle cx="60" cy="64" r="48" fill="#F1DFC2" />
        <circle cx="60" cy="64" r="40" fill="#FFF8ED" stroke="#E6CDA6" stroke-width="3" stroke-dasharray="6 6" />
        <path d="M60 64 L60 24 A40 40 0 0 1 94 44 Z" fill="#FCBF49" opacity=".9" />
        <circle cx="70" cy="40" r="4" fill="#D62828" />
        <circle cx="80" cy="50" r="3" fill="#D62828" />
      </svg>
    </div>
    <h3 class="mt-5 font-display text-2xl font-bold" :class="dark ? 'text-cream-100' : 'text-charcoal-800'">{{ title }}</h3>
    <p v-if="text" class="mt-2 max-w-sm text-sm" :class="dark ? 'text-cream-200/70' : 'text-charcoal-400'">{{ text }}</p>
    <div class="mt-6 flex flex-wrap justify-center gap-3">
      <slot />
    </div>
  </div>
</template>
