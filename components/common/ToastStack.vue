<script setup>
import { CircleCheck, Info, TriangleAlert, X } from 'lucide-vue-next'
import { useUiStore } from '~/stores/ui'

const ui = useUiStore()
const icons = { success: CircleCheck, info: Info, error: TriangleAlert }

const runAction = (toast) => {
  if (toast.action?.type === 'open-cart') ui.openCart()
  else if (toast.action?.to) navigateTo(toast.action.to)
  ui.dismissToast(toast.id)
}
</script>

<template>
  <div
    class="pointer-events-none fixed inset-x-0 top-20 z-[60] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:top-24 sm:items-end"
    :class="ui.cartOpen ? 'max-sm:hidden sm:right-[calc(min(28rem,100vw)+1.5rem)]' : 'sm:right-6'"
    aria-live="polite"
    aria-atomic="false"
  >
    <TransitionGroup
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 -translate-y-3 sm:translate-y-0 sm:translate-x-6"
      leave-active-class="transition duration-200 ease-in"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-for="toast in ui.toasts"
        :key="toast.id"
        role="status"
        class="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-charcoal-800/5 bg-white/95 p-3.5 pr-2 shadow-warm-lg backdrop-blur"
      >
        <span
          class="grid h-9 w-9 shrink-0 place-items-center rounded-full"
          :class="{
            'bg-olive-100 text-olive-600': toast.tone === 'success',
            'bg-gold-100 text-gold-600': toast.tone === 'info',
            'bg-tomato-50 text-tomato-500': toast.tone === 'error',
          }"
        >
          <component :is="icons[toast.tone] || Info" class="h-5 w-5" aria-hidden="true" />
        </span>
        <div class="min-w-0 flex-1 pt-0.5">
          <p class="text-sm font-bold text-charcoal-800">{{ toast.title }}</p>
          <p v-if="toast.message" class="mt-0.5 text-xs text-charcoal-400">{{ toast.message }}</p>
          <button
            v-if="toast.action"
            type="button"
            class="mt-1.5 text-xs font-bold text-tomato-500 underline-offset-2 hover:underline"
            @click="runAction(toast)"
          >
            {{ toast.action.label }} →
          </button>
        </div>
        <button
          type="button"
          class="grid h-8 w-8 shrink-0 place-items-center rounded-full text-charcoal-300 hover:bg-charcoal-800/5 hover:text-charcoal-700"
          aria-label="Dismiss notification"
          @click="ui.dismissToast(toast.id)"
        >
          <X class="h-4 w-4" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>
