<script setup>
import { ArrowRight, ShoppingBag, X } from 'lucide-vue-next'
import { useCartStore } from '~/stores/cart'
import { useUiStore } from '~/stores/ui'

const cart = useCartStore()
const ui = useUiStore()
const route = useRoute()
const panel = ref(null)
const closeBtn = ref(null)
let lastFocus = null

const close = () => ui.closeCart()

watch(
  () => ui.cartOpen,
  async (open) => {
    if (!import.meta.client) return
    document.documentElement.style.overflow = open ? 'hidden' : ''
    if (open) {
      lastFocus = document.activeElement
      await nextTick()
      closeBtn.value?.focus()
    } else {
      lastFocus?.focus?.()
    }
  },
)
watch(() => route.fullPath, close)

// Simple focus trap + Escape to close
const onKeydown = (e) => {
  if (e.key === 'Escape') return close()
  if (e.key !== 'Tab' || !panel.value) return
  const f = panel.value.querySelectorAll('button:not([disabled]), a[href], input, select, [tabindex]:not([tabindex="-1"])')
  if (!f.length) return
  const first = f[0]
  const last = f[f.length - 1]
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault()
    first.focus()
  }
}
onBeforeUnmount(() => {
  if (import.meta.client) document.documentElement.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-200"
      leave-to-class="opacity-0"
    >
      <div v-if="ui.cartOpen" class="fixed inset-0 z-50 bg-charcoal-900/50 backdrop-blur-sm" aria-hidden="true" @click="close" />
    </Transition>
    <Transition
      enter-active-class="transition-transform duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
      enter-from-class="translate-x-full"
      leave-active-class="transition-transform duration-300 ease-in"
      leave-to-class="translate-x-full"
    >
      <aside
        v-if="ui.cartOpen"
        ref="panel"
        class="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-cream-100 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        @keydown="onKeydown"
      >
        <header class="flex items-center justify-between border-b border-charcoal-800/5 px-5 py-4">
          <div class="flex items-center gap-3">
            <span class="grid h-10 w-10 place-items-center rounded-full bg-tomato-500 text-white"><ShoppingBag class="h-5 w-5" aria-hidden="true" /></span>
            <div>
              <h2 id="cart-drawer-title" class="font-display text-xl font-bold">Your order</h2>
              <p class="text-xs text-charcoal-400">{{ cart.count }} {{ cart.count === 1 ? 'item' : 'items' }}</p>
            </div>
          </div>
          <button ref="closeBtn" type="button" class="btn-icon text-charcoal-500 hover:bg-charcoal-800/5" aria-label="Close cart" @click="close">
            <X class="h-5 w-5" />
          </button>
        </header>

        <div class="flex-1 overflow-y-auto px-5">
          <EmptyState v-if="cart.isEmpty" title="Your cart is empty" text="The oven is hot and ready. Add a pizza or build your own masterpiece.">
            <NuxtLink to="/menu" class="btn-primary" @click="close">Browse the menu</NuxtLink>
            <NuxtLink to="/customize" class="btn-outline" @click="close">Build your own</NuxtLink>
          </EmptyState>
          <TransitionGroup
            v-else
            tag="div"
            class="divide-y divide-charcoal-800/5"
            enter-active-class="transition duration-300"
            enter-from-class="opacity-0 translate-x-4"
            leave-active-class="transition duration-200 absolute w-[calc(100%-2.5rem)]"
            leave-to-class="opacity-0 -translate-x-4"
            move-class="transition duration-300"
          >
            <CartItem v-for="line in cart.items" :key="line.lineId" :line="line" compact />
          </TransitionGroup>
        </div>

        <footer v-if="!cart.isEmpty" class="safe-bottom border-t border-charcoal-800/5 bg-white px-5 pb-5 pt-4">
          <CartSummary />
          <div class="mt-4 grid grid-cols-2 gap-2">
            <NuxtLink to="/cart" class="btn-outline" @click="close">View cart</NuxtLink>
            <NuxtLink to="/checkout" class="btn-primary" @click="close">Checkout <ArrowRight class="h-4 w-4" aria-hidden="true" /></NuxtLink>
          </div>
          <button type="button" class="mt-2 w-full py-2 text-center text-xs font-bold text-charcoal-400 hover:text-tomato-500" @click="close">
            Continue shopping
          </button>
        </footer>
      </aside>
    </Transition>
  </Teleport>
</template>
