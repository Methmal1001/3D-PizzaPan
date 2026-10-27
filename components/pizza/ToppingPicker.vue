<script setup>
import { Check, Plus, RotateCcw } from 'lucide-vue-next'
import { MAX_TOPPINGS, TOPPINGS } from '~/data/pizzaOptions'
import { formatLKR } from '~/utils/pricing'

const props = defineProps({
  modelValue: { type: Array, required: true },
  included: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:modelValue'])

const groups = computed(() => {
  const map = {}
  for (const t of TOPPINGS) (map[t.group] ||= []).push(t)
  return Object.entries(map)
})
const has = (id) => props.modelValue.includes(id)
const toggle = (id) => {
  if (has(id)) emit('update:modelValue', props.modelValue.filter((t) => t !== id))
  else if (props.modelValue.length < MAX_TOPPINGS) emit('update:modelValue', [...props.modelValue, id])
}

// Small coloured dot per topping for quick recognition
const swatch = {
  chicken: '#ECCB9B',
  pepperoni: '#C8352F',
  sausage: '#8B4A2F',
  mushrooms: '#D9C3A5',
  onions: '#B37AA3',
  capsicum: '#2F8A3A',
  olives: '#2A2320',
  jalapenos: '#5C9E31',
  pineapple: '#F7D04E',
  'extra-cheese': '#FCE7A6',
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between gap-3">
      <p class="text-sm font-semibold text-charcoal-500">
        <span class="font-extrabold text-charcoal-800">{{ modelValue.length }}</span> of {{ MAX_TOPPINGS }} selected
      </p>
      <button
        v-if="modelValue.length"
        type="button"
        class="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold text-tomato-500 hover:bg-tomato-50"
        @click="emit('update:modelValue', [])"
      >
        <RotateCcw class="h-3.5 w-3.5" aria-hidden="true" /> Clear all
      </button>
    </div>

    <fieldset v-for="[group, items] in groups" :key="group" class="mt-5">
      <legend class="text-xs font-bold uppercase tracking-[0.18em] text-charcoal-400">{{ group }}</legend>
      <div class="mt-2.5 grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
        <button
          v-for="t in items"
          :key="t.id"
          type="button"
          class="flex min-h-[52px] items-center gap-3 rounded-2xl border-2 bg-white px-3.5 py-2 text-left transition active:scale-[0.98]"
          :class="has(t.id) ? 'border-olive-500 bg-olive-100/40' : 'border-transparent shadow-sm hover:border-olive-500/40'"
          :aria-pressed="has(t.id)"
          :disabled="!has(t.id) && modelValue.length >= MAX_TOPPINGS"
          @click="toggle(t.id)"
        >
          <span class="h-5 w-5 shrink-0 rounded-full ring-2 ring-white" :style="{ background: swatch[t.id] }" aria-hidden="true" />
          <span class="flex-1 text-sm font-bold text-charcoal-800">{{ t.name }}</span>
          <span class="text-xs font-bold" :class="included.includes(t.id) ? 'text-olive-600' : 'text-charcoal-400'">
            {{ included.includes(t.id) ? 'Included' : `+${formatLKR(t.price)}` }}
          </span>
          <span
            class="grid h-7 w-7 shrink-0 place-items-center rounded-full transition"
            :class="has(t.id) ? 'bg-olive-500 text-white' : 'bg-cream-200 text-charcoal-500'"
            aria-hidden="true"
          >
            <Check v-if="has(t.id)" class="h-4 w-4" />
            <Plus v-else class="h-4 w-4" />
          </span>
        </button>
      </div>
    </fieldset>
  </div>
</template>
