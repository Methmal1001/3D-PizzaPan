<script setup>
import { Minus, Plus, Trash2 } from 'lucide-vue-next'

const props = defineProps({
  modelValue: { type: Number, required: true },
  min: { type: Number, default: 1 },
  max: { type: Number, default: 20 },
  size: { type: String, default: 'md' }, // sm | md
  label: { type: String, default: 'Quantity' },
  /** Show a trash icon instead of minus at the minimum (cart lines) */
  removable: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'remove'])

const dec = () => {
  if (props.modelValue > props.min) emit('update:modelValue', props.modelValue - 1)
  else if (props.removable) emit('remove')
}
const inc = () => props.modelValue < props.max && emit('update:modelValue', props.modelValue + 1)
const btn = computed(() => (props.size === 'sm' ? 'h-9 w-9' : 'h-11 w-11'))
</script>

<template>
  <div class="inline-flex items-center rounded-full border border-charcoal-800/10 bg-white p-0.5 shadow-sm" role="group" :aria-label="label">
    <button
      type="button"
      class="grid place-items-center rounded-full text-charcoal-700 transition hover:bg-cream-200 disabled:opacity-40"
      :class="btn"
      :disabled="modelValue <= min && !removable"
      :aria-label="modelValue <= min && removable ? 'Remove item' : 'Decrease quantity'"
      @click="dec"
    >
      <Trash2 v-if="modelValue <= min && removable" class="h-4 w-4 text-tomato-500" />
      <Minus v-else class="h-4 w-4" />
    </button>
    <span class="min-w-[2.25rem] text-center text-sm font-extrabold tabular-nums" aria-live="polite">
      <Transition name="fade" mode="out-in"><span :key="modelValue" class="inline-block">{{ modelValue }}</span></Transition>
    </span>
    <button
      type="button"
      class="grid place-items-center rounded-full text-charcoal-700 transition hover:bg-cream-200 disabled:opacity-40"
      :class="btn"
      :disabled="modelValue >= max"
      aria-label="Increase quantity"
      @click="inc"
    >
      <Plus class="h-4 w-4" />
    </button>
  </div>
</template>
