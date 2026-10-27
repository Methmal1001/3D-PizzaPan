<script setup>
import { ChefHat, Menu as MenuIcon, ShoppingBag, Store, Tag, Receipt, UtensilsCrossed, X } from 'lucide-vue-next'
import { useCartStore } from '~/stores/cart'
import { useCheckoutStore } from '~/stores/checkout'
import { useUiStore } from '~/stores/ui'
import { formatLKR } from '~/utils/pricing'

const props = defineProps({
  overlay: { type: Boolean, default: false },
})

const cart = useCartStore()
const checkout = useCheckoutStore()
const ui = useUiStore()
const route = useRoute()

const scrolled = ref(false)
const bump = ref(false)

const links = computed(() => [
  { to: '/', label: 'Bakery', icon: Store, exact: true },
  { to: '/menu', label: 'Menu', icon: UtensilsCrossed },
  { to: '/customize', label: 'Build Your Own', icon: ChefHat },
  { to: '/menu?category=offers', label: 'Offers', icon: Tag },
  ...(checkout.lastOrder ? [{ to: '/order-confirmation', label: 'My Order', icon: Receipt }] : []),
])

const isActive = (link) => {
  const [path, query] = link.to.split('?')
  if (link.exact) return route.path === path
  if (query) return route.path === path && route.fullPath.includes(query)
  return route.path === path && !route.query.category?.includes?.('offers')
}

const transparent = computed(() => props.overlay && !scrolled.value && !ui.mobileNavOpen)

watch(
  () => cart.count,
  (n, o) => {
    if (n > o) {
      bump.value = false
      requestAnimationFrame(() => (bump.value = true))
    }
  },
)

const onScroll = () => (scrolled.value = window.scrollY > 12)
onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
})
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
  <header
    class="fixed inset-x-0 top-0 z-40 transition-colors duration-300"
    :class="
      transparent
        ? 'bg-gradient-to-b from-charcoal-900/70 to-transparent'
        : 'border-b border-charcoal-800/5 bg-cream-100/85 shadow-[0_6px_24px_-18px_rgba(33,26,23,0.5)] backdrop-blur-xl'
    "
  >
    <div class="container-pp flex h-16 items-center justify-between gap-3 sm:h-[72px]">
      <NuxtLink to="/" class="rounded-xl" aria-label="PizzaPan Bakery home">
        <BrandLogo :light="transparent" />
      </NuxtLink>

      <nav class="hidden items-center gap-1 lg:flex" aria-label="Main">
        <NuxtLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition"
          :class="[
            isActive(link)
              ? transparent
                ? 'bg-white/15 text-white'
                : 'bg-charcoal-800 text-cream-100'
              : transparent
                ? 'text-cream-100/85 hover:bg-white/10 hover:text-white'
                : 'text-charcoal-600 hover:bg-charcoal-800/5 hover:text-charcoal-800',
          ]"
          :aria-current="isActive(link) ? 'page' : undefined"
        >
          <component :is="link.icon" class="h-4 w-4" aria-hidden="true" />
          {{ link.label }}
        </NuxtLink>
      </nav>

      <div class="flex items-center gap-2">
        <span
          class="chip hidden border sm:inline-flex"
          :class="transparent ? 'border-gold-300/50 text-gold-200' : 'border-ember-500/30 bg-ember-50 text-ember-700'"
          title="This is a frontend demo. No real orders or payments are processed."
        >
          Demo
        </span>

        <button
          type="button"
          class="relative inline-flex h-11 items-center gap-2 rounded-full pl-3 pr-3 text-sm font-bold transition sm:pr-4"
          :class="transparent ? 'bg-white/15 text-white hover:bg-white/25' : 'bg-tomato-500 text-white shadow-warm hover:bg-tomato-600'"
          :aria-label="`Open cart, ${cart.count} items, ${formatLKR(cart.subtotal)}`"
          @click="ui.toggleCart()"
        >
          <ShoppingBag class="h-5 w-5" aria-hidden="true" />
          <span class="hidden sm:inline">{{ formatLKR(cart.subtotal) }}</span>
          <span
            v-if="cart.count"
            class="absolute -right-1 -top-1 grid h-5 min-w-[20px] place-items-center rounded-full bg-gold-400 px-1 text-[11px] font-extrabold text-charcoal-800 ring-2 ring-cream-100"
            :class="{ 'animate-bump': bump }"
            @animationend="bump = false"
          >
            {{ cart.count }}
          </span>
        </button>

        <button
          type="button"
          class="btn-icon lg:hidden"
          :class="transparent ? 'text-white hover:bg-white/15' : 'text-charcoal-800 hover:bg-charcoal-800/5'"
          :aria-expanded="ui.mobileNavOpen"
          aria-controls="mobile-nav"
          :aria-label="ui.mobileNavOpen ? 'Close menu' : 'Open menu'"
          @click="ui.mobileNavOpen = !ui.mobileNavOpen"
        >
          <X v-if="ui.mobileNavOpen" class="h-6 w-6" />
          <MenuIcon v-else class="h-6 w-6" />
        </button>
      </div>
    </div>

    <Transition name="fade">
      <nav
        v-if="ui.mobileNavOpen"
        id="mobile-nav"
        class="border-t border-charcoal-800/5 bg-cream-100/95 pb-4 backdrop-blur-xl lg:hidden"
        aria-label="Mobile"
      >
        <ul class="container-pp grid gap-1 pt-3">
          <li v-for="link in links" :key="link.to">
            <NuxtLink
              :to="link.to"
              class="flex min-h-[48px] items-center gap-3 rounded-2xl px-4 text-base font-semibold"
              :class="isActive(link) ? 'bg-charcoal-800 text-cream-100' : 'text-charcoal-700 hover:bg-charcoal-800/5'"
            >
              <component :is="link.icon" class="h-5 w-5" aria-hidden="true" />
              {{ link.label }}
            </NuxtLink>
          </li>
        </ul>
        <p class="container-pp mt-3 text-xs text-charcoal-400">
          Demo prototype — no real orders, deliveries or payments are processed.
        </p>
      </nav>
    </Transition>
  </header>
</template>
