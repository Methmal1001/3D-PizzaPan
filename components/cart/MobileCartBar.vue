<script setup>
// Floating cart indicator: a full-width bar on phones/tablets, a floating pill on desktop.
import { ArrowRight, ShoppingBag } from 'lucide-vue-next'
import { useCartStore } from '~/stores/cart'
import { useUiStore } from '~/stores/ui'
import { formatLKR } from '~/utils/pricing'

const cart = useCartStore()
const ui = useUiStore()
const route = useRoute()

const HIDDEN_ON = ['/cart', '/checkout', '/order-confirmation', '/customize']
const show = computed(
  () => ui.restored && cart.count > 0 && !ui.cartOpen && !HIDDEN_ON.includes(route.path) && !route.meta.hideMobileCartBar,
)
</script>

<template>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="translate-y-full opacity-0"
    leave-active-class="transition duration-200 ease-in"
    leave-to-class="translate-y-full opacity-0"
  >
    <div v-if="show" class="safe-bottom fixed inset-x-0 bottom-0 z-40 p-3 lg:inset-x-auto lg:bottom-6 lg:right-6 lg:p-0">
      <button
        type="button"
        class="flex w-full items-center gap-3 rounded-full bg-charcoal-800 py-2 pl-2 pr-5 text-cream-100 shadow-warm-lg ring-1 ring-white/10 transition hover:bg-charcoal-700 lg:w-auto"
        :aria-label="`Open cart: ${cart.count} items, ${formatLKR(cart.total)}`"
        @click="ui.openCart()"
      >
        <span class="relative grid h-11 w-11 place-items-center rounded-full bg-tomato-500">
          <ShoppingBag class="h-5 w-5" aria-hidden="true" />
          <span class="absolute -right-1 -top-1 grid h-5 min-w-[20px] place-items-center rounded-full bg-gold-400 px-1 text-[11px] font-extrabold text-charcoal-800">
            {{ cart.count }}
          </span>
        </span>
        <span class="flex-1 text-left">
          <span class="block text-[11px] font-semibold uppercase tracking-wide text-cream-200/60">Your order</span>
          <span class="block font-display text-lg font-bold leading-tight">{{ formatLKR(cart.total) }}</span>
        </span>
        <span class="inline-flex items-center gap-1 text-sm font-bold text-gold-300">View cart <ArrowRight class="h-4 w-4" aria-hidden="true" /></span>
      </button>
    </div>
  </Transition>
</template>
