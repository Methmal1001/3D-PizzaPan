<script setup>
import { Check } from 'lucide-vue-next'
import { formatLKR } from '~/utils/pricing'

defineProps({
  option: { type: Object, required: true },
  selected: { type: Boolean, default: false },
  name: { type: String, required: true }, // radio group name
})
const emit = defineEmits(['select'])
</script>

<template>
  <label
    class="group relative flex cursor-pointer items-center gap-4 rounded-3xl border-2 bg-white p-4 transition focus-within:ring-4 focus-within:ring-gold-400/40"
    :class="selected ? 'border-tomato-500 shadow-warm' : 'border-transparent shadow-sm hover:border-tomato-500/30'"
  >
    <input type="radio" class="sr-only" :name="name" :value="option.id" :checked="selected" @change="emit('select', option.id)" />
    <span class="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-cream-200">
      <slot name="visual" />
    </span>
    <span class="min-w-0 flex-1">
      <span class="block font-bold text-charcoal-800">{{ option.name }}</span>
      <span class="block text-xs text-charcoal-400">{{ option.detail }}</span>
    </span>
    <span class="shrink-0 text-right text-sm font-bold" :class="option.price ? 'text-tomato-600' : 'text-olive-600'">
      {{ option.price ? `+${formatLKR(option.price)}` : 'Included' }}
    </span>
    <span
      class="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full bg-tomato-500 text-white shadow transition"
      :class="selected ? 'scale-100 opacity-100' : 'scale-50 opacity-0'"
      aria-hidden="true"
    >
      <Check class="h-3.5 w-3.5" />
    </span>
  </label>
</template>
