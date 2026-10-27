<script setup>
import { ArrowLeft, ArrowRight, CheckCircle2, Lock, ShieldCheck } from 'lucide-vue-next'
import { useCartStore } from '~/stores/cart'
import { CHECKOUT_STEPS, useCheckoutStore } from '~/stores/checkout'
import { useUiStore } from '~/stores/ui'
import { formatLKR } from '~/utils/pricing'

useHead({ title: 'Checkout — PizzaPan Bakery' })
definePageMeta({ hideMobileCartBar: true })

const cart = useCartStore()
const checkout = useCheckoutStore()
const ui = useUiStore()

const showDetailErrors = ref(false)
const showPaymentErrors = ref(false)
const placed = ref(false)
const panel = ref(null)

const reachable = computed(() => {
  if (!checkout.detailsValid) return 1
  if (!checkout.paymentValid) return 3
  return 4
})

const scrollTop = () => nextTick(() => panel.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
const focusFirstError = () =>
  nextTick(() => {
    const el = panel.value?.querySelector('[aria-invalid="true"]')
    el?.focus()
  })

function goTo(n) {
  if (n > 1 && !checkout.detailsValid) {
    checkout.goTo(1)
    showDetailErrors.value = true
    focusFirstError()
    return
  }
  if (n > 3 && !checkout.paymentValid) {
    checkout.goTo(3)
    showPaymentErrors.value = true
    return
  }
  checkout.goTo(n)
  scrollTop()
}

const next = () => goTo(checkout.step + 1)
const back = () => goTo(checkout.step - 1)

async function placeOrder() {
  showDetailErrors.value = true
  showPaymentErrors.value = true
  if (!checkout.detailsValid) return goTo(1)
  if (!checkout.paymentValid) return goTo(3)
  try {
    await checkout.placeOrder()
    placed.value = true
    await navigateTo('/order-confirmation')
  } catch (e) {
    ui.toast({ title: 'Couldn’t place the demo order', message: e.message, tone: 'error' })
  }
}

// Leaving pickup -> delivery may make the address required again
watch(
  () => checkout.deliveryMethod,
  () => {
    if (!checkout.detailsValid && checkout.step > 1) showDetailErrors.value = true
  },
)

const stepTitle = computed(() => CHECKOUT_STEPS[checkout.step - 1].title)
</script>

<template>
  <div class="bg-dough pb-24">
    <div class="container-pp pt-6 sm:pt-10">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p class="eyebrow">Secure demo checkout</p>
          <h1 class="mt-1 font-display text-3xl font-bold sm:text-5xl">Checkout</h1>
        </div>
        <p class="inline-flex items-center gap-1.5 rounded-full bg-gold-100 px-3 py-1.5 text-xs font-bold text-charcoal-700">
          <ShieldCheck class="h-4 w-4 text-olive-600" aria-hidden="true" /> Demo only — no real order or payment
        </p>
      </div>

      <div v-if="!ui.restored" class="mt-10 grid gap-4" aria-busy="true">
        <div class="card h-64 animate-pulse bg-white/60" />
      </div>

      <div v-else-if="cart.isEmpty && !placed && !checkout.placing" class="card mt-8">
        <EmptyState title="Nothing to check out yet" text="Your cart is empty. Add something delicious and come back here.">
          <NuxtLink to="/menu" class="btn-primary">Browse the menu</NuxtLink>
          <NuxtLink v-if="checkout.lastOrder" to="/order-confirmation" class="btn-outline">View last order</NuxtLink>
        </EmptyState>
      </div>

      <div v-else class="mt-8 grid gap-6 lg:grid-cols-[1fr_380px] lg:gap-8">
        <div ref="panel" class="min-w-0 scroll-mt-24">
          <CheckoutSteps :steps="CHECKOUT_STEPS" :current="checkout.step" :reachable="reachable" @go="goTo" />

          <div class="mt-6">
            <Transition name="step" mode="out-in">
              <section :key="checkout.step" aria-live="polite">
                <h2 class="font-display text-2xl font-bold">{{ stepTitle }}</h2>
                <div class="mt-5">
                  <CustomerForm v-if="checkout.step === 1" :show-all="showDetailErrors" />
                  <DeliveryOptions v-else-if="checkout.step === 2" />
                  <PaymentOptions v-else-if="checkout.step === 3" :show-errors="showPaymentErrors" />
                  <OrderReview v-else @edit="goTo" />
                </div>
              </section>
            </Transition>
          </div>

          <div class="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button v-if="checkout.step > 1" type="button" class="btn-outline" @click="back">
              <ArrowLeft class="h-4 w-4" aria-hidden="true" /> Back
            </button>
            <NuxtLink v-else to="/cart" class="btn-outline"><ArrowLeft class="h-4 w-4" aria-hidden="true" /> Back to cart</NuxtLink>

            <button v-if="checkout.step < 4" type="button" class="btn-dark px-7 py-3.5 text-base" @click="next">
              Continue to {{ CHECKOUT_STEPS[checkout.step].title.toLowerCase() }} <ArrowRight class="h-4 w-4" aria-hidden="true" />
            </button>
            <button v-else type="button" class="btn-primary px-8 py-4 text-base" :disabled="checkout.placing" @click="placeOrder">
              <CheckCircle2 class="h-5 w-5" aria-hidden="true" />
              Place Order · {{ formatLKR(cart.total) }}
            </button>
          </div>
          <p v-if="checkout.step === 4" class="mt-3 flex items-center gap-1.5 text-xs text-charcoal-400 sm:justify-end">
            <Lock class="h-3.5 w-3.5" aria-hidden="true" />
            {{ checkout.paymentMethod === 'card' ? 'Your simulated card payment will not charge any real money.' : 'You’ll pay in cash when your order arrives.' }}
          </p>
        </div>

        <aside class="min-w-0 lg:sticky lg:top-24 lg:self-start" aria-label="Order summary">
          <div class="card p-5 sm:p-6">
            <div class="flex items-center justify-between">
              <h2 class="font-display text-xl font-bold">Your order</h2>
              <NuxtLink to="/cart" class="text-xs font-bold text-tomato-500 hover:underline">Edit</NuxtLink>
            </div>
            <ul class="mt-3 max-h-60 space-y-2 overflow-y-auto pr-1 text-sm">
              <li v-for="line in cart.items" :key="line.lineId" class="flex justify-between gap-3">
                <span class="text-charcoal-600"><strong class="text-charcoal-800">{{ line.quantity }}×</strong> {{ line.name }}</span>
                <span class="shrink-0 font-semibold tabular-nums">{{ formatLKR(line.unitPrice * line.quantity) }}</span>
              </li>
            </ul>
            <div class="mt-4 border-t border-charcoal-800/5 pt-4"><CartSummary /></div>
          </div>
        </aside>
      </div>
    </div>

    <PlacingOrderOverlay v-if="checkout.placing" :card="checkout.paymentMethod === 'card'" />
  </div>
</template>
