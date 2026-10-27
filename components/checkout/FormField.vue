<script setup>
import { CircleAlert } from 'lucide-vue-next'

defineProps({
  id: { type: String, required: true },
  label: { type: String, required: true },
  error: { type: String, default: '' },
  hint: { type: String, default: '' },
  optional: { type: Boolean, default: false },
})
</script>

<template>
  <div>
    <label :for="id" class="label">
      {{ label }}
      <span v-if="optional" class="font-normal text-charcoal-300">(optional)</span>
      <span v-else class="text-tomato-500" aria-hidden="true">*</span>
    </label>
    <slot :describedby="error ? `${id}-error` : hint ? `${id}-hint` : undefined" :invalid="!!error" />
    <p v-if="error" :id="`${id}-error`" class="mt-1.5 flex items-center gap-1 text-xs font-semibold text-tomato-600">
      <CircleAlert class="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> {{ error }}
    </p>
    <p v-else-if="hint" :id="`${id}-hint`" class="mt-1.5 text-xs text-charcoal-400">{{ hint }}</p>
  </div>
</template>
