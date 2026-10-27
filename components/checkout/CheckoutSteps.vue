<script setup>
import { Check } from 'lucide-vue-next'

defineProps({
  steps: { type: Array, required: true },
  current: { type: Number, required: true },
  /** highest step the customer may jump to */
  reachable: { type: Number, required: true },
})
const emit = defineEmits(['go'])
</script>

<template>
  <nav aria-label="Checkout progress">
    <ol class="flex items-center">
      <li v-for="(s, i) in steps" :key="s.id" class="flex flex-1 items-center last:flex-none">
        <button
          type="button"
          class="group flex items-center gap-2 rounded-full disabled:cursor-not-allowed"
          :disabled="s.id > reachable"
          :aria-current="s.id === current ? 'step' : undefined"
          @click="emit('go', s.id)"
        >
          <span
            class="grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-extrabold transition"
            :class="
              s.id === current
                ? 'bg-tomato-500 text-white shadow-warm ring-4 ring-tomato-500/20'
                : s.id < current
                  ? 'bg-olive-500 text-white'
                  : 'bg-white text-charcoal-400 ring-1 ring-charcoal-800/10'
            "
          >
            <Check v-if="s.id < current" class="h-5 w-5" aria-hidden="true" />
            <template v-else>{{ s.id }}</template>
          </span>
          <span class="hidden text-sm font-bold md:inline" :class="s.id === current ? 'text-charcoal-800' : 'text-charcoal-400'">{{ s.title }}</span>
        </button>
        <span v-if="i < steps.length - 1" class="mx-2 h-0.5 flex-1 rounded-full transition-colors" :class="s.id < current ? 'bg-olive-500' : 'bg-charcoal-800/10'" aria-hidden="true" />
      </li>
    </ol>
    <p class="mt-3 text-sm font-semibold text-charcoal-500 md:hidden">Step {{ current }} of {{ steps.length }} · {{ steps[current - 1].title }}</p>
  </nav>
</template>
