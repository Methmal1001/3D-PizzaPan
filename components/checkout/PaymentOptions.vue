<script setup>
import { Banknote, Check, CreditCard, ShieldAlert } from 'lucide-vue-next'
import { useCartStore } from '~/stores/cart'
import { useCheckoutStore } from '~/stores/checkout'
import { formatLKR } from '~/utils/pricing'

defineProps({ showErrors: { type: Boolean, default: false } })
const checkout = useCheckoutStore()
const cart = useCartStore()

const methods = [
  { id: 'cod', title: 'Cash on Delivery', text: 'Pay in cash when your pizza arrives (or at pickup).', icon: Banknote },
  { id: 'card', title: 'Card Payment', text: 'Simulated demo card payment. No real transaction.', icon: CreditCard },
]
const changeOptions = computed(() => {
  const t = cart.total
  const notes = [1000, 2000, 5000, 10000, 20000].filter((n) => n > t).slice(0, 2)
  return [{ id: 'exact', label: 'Exact amount' }, ...notes.map((n) => ({ id: String(n), label: `Change for ${formatLKR(n)}` }))]
})
</script>

<template>
  <div class="space-y-5">
    <div class="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Payment method">
      <label
        v-for="m in methods"
        :key="m.id"
        class="relative flex cursor-pointer items-start gap-4 rounded-3xl border-2 bg-white p-5 transition focus-within:ring-4 focus-within:ring-gold-400/40"
        :class="checkout.paymentMethod === m.id ? 'border-tomato-500 shadow-warm' : 'border-transparent shadow-sm hover:border-tomato-500/30'"
      >
        <input type="radio" name="payment-method" class="sr-only" :value="m.id" :checked="checkout.paymentMethod === m.id" @change="checkout.paymentMethod = m.id" />
        <span class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl" :class="checkout.paymentMethod === m.id ? 'bg-tomato-500 text-white' : 'bg-cream-200 text-charcoal-600'">
          <component :is="m.icon" class="h-6 w-6" aria-hidden="true" />
        </span>
        <span class="flex-1">
          <span class="block text-lg font-bold">{{ m.title }}</span>
          <span class="mt-0.5 block text-sm text-charcoal-400">{{ m.text }}</span>
        </span>
        <span v-if="checkout.paymentMethod === m.id" class="grid h-6 w-6 place-items-center rounded-full bg-tomato-500 text-white"><Check class="h-4 w-4" aria-hidden="true" /></span>
      </label>
    </div>
    <p v-if="showErrors && !checkout.paymentMethod" class="text-sm font-semibold text-tomato-600" role="alert">Please choose a payment method.</p>

    <Transition name="fade" mode="out-in">
      <div v-if="checkout.paymentMethod === 'cod'" key="cod" class="rounded-3xl bg-white p-5 shadow-sm">
        <p class="text-sm text-charcoal-500">Amount payable {{ checkout.deliveryMethod === 'pickup' ? 'at pickup' : 'on delivery' }}</p>
        <p class="mt-1 font-display text-3xl font-bold text-tomato-600">{{ formatLKR(cart.total) }}</p>
        <fieldset class="mt-4">
          <legend class="label">Need change?</legend>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="o in changeOptions"
              :key="o.id"
              type="button"
              class="min-h-[40px] rounded-full border-2 px-4 text-sm font-bold transition"
              :class="checkout.cashChangeFor === o.id ? 'border-charcoal-800 bg-charcoal-800 text-cream-100' : 'border-charcoal-800/10 text-charcoal-600'"
              :aria-pressed="checkout.cashChangeFor === o.id"
              @click="checkout.cashChangeFor = o.id"
            >
              {{ o.label }}
            </button>
          </div>
        </fieldset>
      </div>

      <div v-else-if="checkout.paymentMethod === 'card'" key="card" class="space-y-4">
        <DemoCardForm />
        <label class="flex cursor-pointer items-start gap-3 rounded-2xl border-2 bg-white p-4 text-sm" :class="showErrors && !checkout.cardDemoAcknowledged ? 'border-tomato-500' : 'border-transparent shadow-sm'">
          <input v-model="checkout.cardDemoAcknowledged" type="checkbox" class="mt-0.5 h-5 w-5 shrink-0 rounded accent-tomato-500" />
          <span>
            I understand this is a <strong>simulated demo payment</strong>. No real card details are collected and no money will be charged.
          </span>
        </label>
        <p v-if="showErrors && !checkout.cardDemoAcknowledged" class="flex items-center gap-1.5 text-sm font-semibold text-tomato-600" role="alert">
          <ShieldAlert class="h-4 w-4" aria-hidden="true" /> Please confirm you understand this is a demo payment.
        </p>
      </div>
    </Transition>
  </div>
</template>
