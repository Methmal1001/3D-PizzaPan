<script setup>
import { Check } from 'lucide-vue-next'

defineProps({
  steps: { type: Array, required: true },
  current: { type: Number, required: true },
})
const emit = defineEmits(['go'])
</script>

<template>
  <nav aria-label="Pizza builder steps">
    <ol class="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
      <li v-for="(s, i) in steps" :key="s.id" class="shrink-0">
        <button
          type="button"
          class="group inline-flex min-h-[44px] items-center gap-2 rounded-full py-1.5 pl-1.5 pr-4 text-sm font-bold transition"
          :class="
            i === current
              ? 'bg-charcoal-800 text-cream-100 shadow-warm'
              : i < current
                ? 'bg-white text-charcoal-700 hover:bg-cream-200'
                : 'bg-white/60 text-charcoal-400 hover:bg-white hover:text-charcoal-700'
          "
          :aria-current="i === current ? 'step' : undefined"
          @click="emit('go', i)"
        >
          <span
            class="grid h-8 w-8 place-items-center rounded-full text-xs"
            :class="i === current ? 'bg-gold-400 text-charcoal-800' : i < current ? 'bg-olive-500 text-white' : 'bg-cream-200 text-charcoal-400'"
          >
            <Check v-if="i < current" class="h-4 w-4" aria-hidden="true" />
            <template v-else>{{ i + 1 }}</template>
          </span>
          {{ s.title }}
        </button>
      </li>
    </ol>
  </nav>
</template>
