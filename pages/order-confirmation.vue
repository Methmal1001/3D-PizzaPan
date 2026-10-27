<script setup>
import { Banknote, Bike, Clock, CreditCard, Receipt, RotateCcw, Store, UtensilsCrossed } from 'lucide-vue-next'
import { findProduct } from '~/data/products'
import { useCheckoutStore } from '~/stores/checkout'
import { useUiStore } from '~/stores/ui'
import { usePricing } from '~/composables/usePricing'

useHead({ title: 'Order Confirmed — PizzaPan Bakery' })
definePageMeta({ hideMobileCartBar: true })

const checkout = useCheckoutStore()
const ui = useUiStore()
const { formatLKR, describeOptions, toppingNames } = usePricing()

const order = computed(() => checkout.lastOrder)
const summaryOpen = ref(true)
const summaryEl = ref(null)

const placedTime = computed(() =>
  order.value ? new Date(order.value.placedAt).toLocaleString('en-LK', { dateStyle: 'medium', timeStyle: 'short' }) : '',
)
const changeLabel = computed(() => {
  const c = order.value?.payment?.changeFor
  return c && c !== 'exact' ? `Change for ${formatLKR(Number(c))}` : 'Exact amount'
})

const viewSummary = () => {
  summaryOpen.value = true
  nextTick(() => summaryEl.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
}
const startNew = () => {
  checkout.startNewOrder()
  ui.toast({ title: 'Ready for a fresh order', message: 'Your cart is empty and the oven is hot.', tone: 'info' })
  navigateTo('/')
}
</script>

<template>
  <div class="bg-dough pb-20">
    <div class="container-pp max-w-5xl pt-8 sm:pt-12">
      <div v-if="!ui.restored" class="card mt-6 h-72 animate-pulse bg-white/60" aria-busy="true" />

      <div v-else-if="!order" class="card mt-6">
        <EmptyState title="No recent order" text="Once you place a demo order, its confirmation and progress tracker will appear here.">
          <NuxtLink to="/menu" class="btn-primary">Start ordering</NuxtLink>
        </EmptyState>
      </div>

      <template v-else>
        <!-- Success header -->
        <section class="relative overflow-hidden rounded-[2rem] bg-charcoal-800 px-6 py-10 text-center text-cream-100 shadow-warm-lg sm:px-10">
          <div class="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-tomato-500/25 blur-3xl" aria-hidden="true" />
          <div class="pointer-events-none absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-gold-400/20 blur-3xl" aria-hidden="true" />
          <SuccessBurst />
          <p class="eyebrow mt-6 text-gold-300">Demo order confirmed</p>
          <h1 class="mt-2 font-display text-3xl font-bold sm:text-5xl">Thank you, {{ order.customer.fullName.split(' ')[0] }}!</h1>
          <p class="mx-auto mt-3 max-w-xl text-sm text-cream-200/75 sm:text-base">
            Your sample order has been created in this browser. This is a demo — no real bakery has received it and
            {{ order.payment.method === 'card' ? 'no real card was charged (simulated demo payment).' : 'no payment has been taken.' }}
          </p>
          <div class="mt-6 inline-flex flex-wrap items-center justify-center gap-3">
            <span class="rounded-2xl bg-white/10 px-5 py-3 text-left">
              <span class="block text-[11px] font-bold uppercase tracking-wider text-cream-200/60">Order number</span>
              <span class="block font-mono text-xl font-bold tracking-wider text-gold-300">{{ order.id }}</span>
            </span>
            <span class="rounded-2xl bg-white/10 px-5 py-3 text-left">
              <span class="block text-[11px] font-bold uppercase tracking-wider text-cream-200/60">Estimated {{ order.deliveryMethod === 'pickup' ? 'ready' : 'arrival' }}</span>
              <span class="flex items-center gap-1.5 text-xl font-bold"><Clock class="h-5 w-5 text-gold-400" aria-hidden="true" /> {{ order.deliverySlot === 'asap' ? order.estimate.window : order.deliverySlot }}</span>
            </span>
          </div>
          <p class="mt-3 text-xs text-cream-200/50">Placed {{ placedTime }} · preparation ≈ {{ order.estimate.prep }} min</p>
        </section>

        <!-- Tracker -->
        <section class="card mt-6 p-5 sm:p-8">
          <OrderTracker :placed-at="order.placedAt" :method="order.deliveryMethod" />
        </section>

        <!-- Actions -->
        <div class="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button type="button" class="btn-dark" @click="viewSummary"><Receipt class="h-4 w-4" aria-hidden="true" /> View Order Summary</button>
          <NuxtLink to="/menu" class="btn-outline"><UtensilsCrossed class="h-4 w-4" aria-hidden="true" /> Return to Menu</NuxtLink>
          <button type="button" class="btn-primary" @click="startNew"><RotateCcw class="h-4 w-4" aria-hidden="true" /> Start a New Order</button>
        </div>

        <!-- Summary -->
        <section v-if="summaryOpen" id="order-summary" ref="summaryEl" class="mt-8 grid scroll-mt-24 gap-6 lg:grid-cols-[1fr_340px]" aria-labelledby="summary-title">
          <div class="card p-5 sm:p-6">
            <h2 id="summary-title" class="font-display text-xl font-bold">Order summary</h2>
            <ul class="mt-4 divide-y divide-charcoal-800/5">
              <li v-for="line in order.items" :key="line.lineId" class="flex items-center gap-3 py-3">
                <div class="relative h-16 w-16 shrink-0 rounded-2xl bg-cream-200">
                  <div class="absolute inset-1.5"><ProductVisual :product="findProduct(line.productId) || { type: 'item', visual: 'x' }" :options="line.options" size="sm" /></div>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="font-bold">{{ line.quantity }} × {{ line.name }}</p>
                  <p v-if="line.options" class="text-xs text-charcoal-400">{{ describeOptions(line.options) }}</p>
                  <p v-if="line.options?.toppings?.length" class="text-xs text-olive-600">{{ toppingNames(line.options.toppings).join(', ') }}</p>
                </div>
                <p class="font-semibold tabular-nums">{{ formatLKR(line.lineTotal) }}</p>
              </li>
            </ul>
            <dl class="mt-4 space-y-2 border-t border-dashed border-charcoal-800/15 pt-4 text-sm">
              <div class="flex justify-between"><dt class="text-charcoal-500">Subtotal</dt><dd class="font-semibold tabular-nums">{{ formatLKR(order.subtotal) }}</dd></div>
              <div v-if="order.discount" class="flex justify-between text-olive-600"><dt>Discount ({{ order.promoCode }})</dt><dd class="font-semibold tabular-nums">− {{ formatLKR(order.discount) }}</dd></div>
              <div class="flex justify-between"><dt class="text-charcoal-500">{{ order.deliveryMethod === 'pickup' ? 'Pickup' : 'Delivery fee' }}</dt><dd class="font-semibold tabular-nums">{{ order.deliveryFee ? formatLKR(order.deliveryFee) : 'Free' }}</dd></div>
              <div class="flex items-baseline justify-between pt-2"><dt class="text-base font-bold">Total</dt><dd class="font-display text-2xl font-bold text-tomato-600">{{ formatLKR(order.total) }}</dd></div>
            </dl>
          </div>

          <div class="space-y-4">
            <div class="card p-5">
              <h3 class="flex items-center gap-2 font-sans text-sm font-bold uppercase tracking-wide text-charcoal-400">
                <component :is="order.deliveryMethod === 'pickup' ? Store : Bike" class="h-4 w-4" aria-hidden="true" />
                {{ order.deliveryMethod === 'pickup' ? 'Pickup from bakery' : 'Home delivery' }}
              </h3>
              <p class="mt-2 font-bold">{{ order.customer.fullName }}</p>
              <p class="text-sm text-charcoal-500">{{ order.customer.mobile }}</p>
              <p v-if="order.customer.email" class="text-sm text-charcoal-500">{{ order.customer.email }}</p>
              <p v-if="order.deliveryMethod === 'delivery'" class="mt-1 text-sm text-charcoal-500">{{ order.customer.address }}, {{ order.customer.city }}</p>
              <p v-else class="mt-1 text-sm text-charcoal-500">42 Flower Road, Colombo 07 (sample)</p>
              <p v-if="order.customer.instructions" class="mt-1 text-xs italic text-charcoal-400">“{{ order.customer.instructions }}”</p>
            </div>
            <div class="card p-5">
              <h3 class="flex items-center gap-2 font-sans text-sm font-bold uppercase tracking-wide text-charcoal-400">
                <component :is="order.payment.method === 'card' ? CreditCard : Banknote" class="h-4 w-4" aria-hidden="true" /> Payment
              </h3>
              <p class="mt-2 font-bold">{{ order.payment.label }}</p>
              <p v-if="order.payment.method === 'card'" class="text-sm text-charcoal-500">{{ order.payment.card }} — simulated, no real charge.</p>
              <p v-else class="text-sm text-charcoal-500">Pay {{ formatLKR(order.total) }} {{ order.deliveryMethod === 'pickup' ? 'at pickup' : 'on delivery' }} · {{ changeLabel }}</p>
            </div>
          </div>
        </section>
      </template>
    </div>
  </div>
</template>
