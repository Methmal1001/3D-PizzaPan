<script setup>
defineProps({
  light: { type: Boolean, default: false },
  compact: { type: Boolean, default: false },
})
</script>

<template>
  <span class="inline-flex items-center gap-2.5">
    <svg viewBox="0 0 48 48" class="h-9 w-9 shrink-0 drop-shadow-sm sm:h-10 sm:w-10" aria-hidden="true">
      <circle cx="24" cy="24" r="23" fill="#211A17" />
      <circle cx="24" cy="24" r="19" fill="#E8B169" />
      <circle cx="24" cy="24" r="15.5" fill="#D62828" />
      <circle cx="24" cy="24" r="13.5" fill="#FCD583" />
      <path d="M24 24 L24 10.5 A13.5 13.5 0 0 1 35.7 17.2 Z" fill="#FFF8ED" opacity=".9" />
      <circle cx="18" cy="20" r="3" fill="#B81F21" />
      <circle cx="28" cy="30" r="3" fill="#B81F21" />
      <circle cx="18" cy="30" r="2.2" fill="#646B35" />
      <circle cx="30" cy="22" r="1.6" fill="#211A17" />
    </svg>
    <span v-if="!compact" class="leading-none">
      <span
        class="block font-display text-xl font-bold tracking-tight sm:text-[22px]"
        :class="light ? 'text-cream-100' : 'text-charcoal-800'"
      >
        Pizza<span class="text-tomato-500">Pan</span>
      </span>
      <span
        class="mt-0.5 block text-[10px] font-bold uppercase tracking-[0.32em]"
        :class="light ? 'text-gold-300' : 'text-ember-600'"
      >
        Bakery
      </span>
    </span>
  </span>
</template>
