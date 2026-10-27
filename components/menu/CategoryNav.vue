<script setup>
import { BadgePercent, CakeSlice, ChefHat, Crown, CupSoda, Drumstick, Flame, LayoutGrid, Leaf, Pizza, Wheat } from 'lucide-vue-next'

const props = defineProps({
  categories: { type: Array, required: true },
  modelValue: { type: String, required: true },
  countFor: { type: Function, required: true },
  dark: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

const icons = { LayoutGrid, Crown, Pizza, Flame, Leaf, ChefHat, Wheat, Drumstick, CakeSlice, CupSoda, BadgePercent }

const scroller = ref(null)
// Keep the active chip in view (e.g. after a hotspot click)
watch(
  () => props.modelValue,
  async () => {
    await nextTick()
    scroller.value?.querySelector('[aria-pressed="true"]')?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  },
)
</script>

<template>
  <nav aria-label="Menu categories">
    <ul ref="scroller" class="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-1 sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-wrap lg:px-0">
      <li v-for="c in categories" :key="c.id" class="shrink-0">
        <button
          type="button"
          class="group inline-flex min-h-[44px] items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition"
          :class="
            modelValue === c.id
              ? 'border-tomato-500 bg-tomato-500 text-white shadow-warm'
              : dark
                ? 'border-white/15 bg-white/5 text-cream-100 hover:border-gold-400/60'
                : 'border-charcoal-800/10 bg-white text-charcoal-700 hover:border-tomato-500/40 hover:text-tomato-600'
          "
          :aria-pressed="modelValue === c.id"
          @click="emit('update:modelValue', c.id)"
        >
          <component :is="icons[c.icon]" class="h-4 w-4" aria-hidden="true" />
          {{ c.short }}
          <span
            class="rounded-full px-1.5 text-[11px] font-bold"
            :class="modelValue === c.id ? 'bg-white/20' : dark ? 'bg-white/10' : 'bg-cream-200 text-charcoal-400'"
          >
            {{ countFor(c.id) }}
          </span>
        </button>
      </li>
    </ul>
  </nav>
</template>
