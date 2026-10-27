<script setup>
import { Box, LayoutGrid } from 'lucide-vue-next'

defineProps({ modelValue: { type: String, required: true } })
const emit = defineEmits(['update:modelValue'])

const options = [
  { id: '3d', label: '3D Shop', icon: Box },
  { id: 'menu', label: 'Menu View', icon: LayoutGrid },
]
</script>

<template>
  <div class="inline-flex rounded-full border border-charcoal-800/10 bg-white p-1 shadow-sm" role="radiogroup" aria-label="Shopping view">
    <button
      v-for="o in options"
      :key="o.id"
      type="button"
      role="radio"
      :aria-checked="modelValue === o.id"
      class="inline-flex min-h-[40px] items-center gap-2 rounded-full px-4 text-sm font-bold transition"
      :class="modelValue === o.id ? 'bg-charcoal-800 text-cream-100 shadow' : 'text-charcoal-500 hover:text-charcoal-800'"
      @click="emit('update:modelValue', o.id)"
    >
      <component :is="o.icon" class="h-4 w-4" aria-hidden="true" />
      {{ o.label }}
    </button>
  </div>
</template>
