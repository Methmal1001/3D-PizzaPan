<script setup>
import { Bike, CalendarClock, Check, MapPin, Store, Zap } from 'lucide-vue-next'
import { useCartStore } from '~/stores/cart'
import { estimateMinutes, useCheckoutStore } from '~/stores/checkout'
import { DELIVERY_RULES } from '~/data/offers'
import { formatLKR } from '~/utils/pricing'

const checkout = useCheckoutStore()
const cart = useCartStore()

const estimate = (m) => estimateMinutes(cart.items, m)
const methods = computed(() => [
  {
    id: 'delivery',
    title: 'Home delivery',
    icon: Bike,
    text: `Hot to your door in about ${estimate('delivery').window}.`,
    fee: cart.subtotal >= DELIVERY_RULES.freeDeliveryThreshold ? 'Free delivery' : `${formatLKR(DELIVERY_RULES.baseFee)} delivery`,
  },
  {
    id: 'pickup',
    title: 'Pickup from bakery',
    icon: Store,
    text: `Ready at the counter in about ${estimate('pickup').window}.`,
    fee: 'No delivery fee',
  },
])

// Time slots depend on the current time, so they are generated on the client only
const slots = ref([])
onMounted(() => {
  const now = new Date()
  const start = new Date(now.getTime() + 60 * 60000)
  start.setMinutes(start.getMinutes() < 30 ? 30 : 60, 0, 0)
  const list = []
  for (let i = 0; i < 8; i++) {
    const t = new Date(start.getTime() + i * 30 * 60000)
    if (t.getHours() >= 23 || t.getHours() < 10) continue
    list.push(t.toLocaleTimeString('en-LK', { hour: 'numeric', minute: '2-digit' }))
  }
  slots.value = list
})
</script>

<template>
  <div class="space-y-6">
    <div class="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Delivery method">
      <label
        v-for="m in methods"
        :key="m.id"
        class="relative flex cursor-pointer flex-col gap-3 rounded-3xl border-2 bg-white p-5 transition focus-within:ring-4 focus-within:ring-gold-400/40"
        :class="checkout.deliveryMethod === m.id ? 'border-tomato-500 shadow-warm' : 'border-transparent shadow-sm hover:border-tomato-500/30'"
      >
        <input type="radio" name="delivery-method" class="sr-only" :value="m.id" :checked="checkout.deliveryMethod === m.id" @change="checkout.setDeliveryMethod(m.id)" />
        <span class="flex items-center justify-between">
          <span class="grid h-12 w-12 place-items-center rounded-2xl" :class="checkout.deliveryMethod === m.id ? 'bg-tomato-500 text-white' : 'bg-cream-200 text-charcoal-600'">
            <component :is="m.icon" class="h-6 w-6" aria-hidden="true" />
          </span>
          <span v-if="checkout.deliveryMethod === m.id" class="grid h-6 w-6 place-items-center rounded-full bg-tomato-500 text-white"><Check class="h-4 w-4" aria-hidden="true" /></span>
        </span>
        <span>
          <span class="block text-lg font-bold">{{ m.title }}</span>
          <span class="mt-1 block text-sm text-charcoal-400">{{ m.text }}</span>
        </span>
        <span class="chip self-start bg-cream-200 text-charcoal-600">{{ m.fee }}</span>
      </label>
    </div>

    <div v-if="checkout.deliveryMethod === 'pickup'" class="flex items-start gap-3 rounded-2xl bg-white p-4 text-sm shadow-sm">
      <MapPin class="mt-0.5 h-5 w-5 shrink-0 text-tomato-500" aria-hidden="true" />
      <p><strong>PizzaPan Bakery</strong> — 42 Flower Road, Colombo 07 (sample address). Open daily 10:00 – 23:00.</p>
    </div>

    <fieldset>
      <legend class="label">When would you like it?</legend>
      <div class="mt-1 flex flex-wrap gap-2">
        <button
          type="button"
          class="inline-flex min-h-[44px] items-center gap-2 rounded-full border-2 px-4 text-sm font-bold transition"
          :class="checkout.deliverySlot === 'asap' ? 'border-charcoal-800 bg-charcoal-800 text-cream-100' : 'border-charcoal-800/10 bg-white text-charcoal-600 hover:border-charcoal-800/30'"
          :aria-pressed="checkout.deliverySlot === 'asap'"
          @click="checkout.deliverySlot = 'asap'"
        >
          <Zap class="h-4 w-4" aria-hidden="true" /> As soon as possible
        </button>
        <button
          v-for="s in slots"
          :key="s"
          type="button"
          class="inline-flex min-h-[44px] items-center gap-2 rounded-full border-2 px-4 text-sm font-bold transition"
          :class="checkout.deliverySlot === s ? 'border-charcoal-800 bg-charcoal-800 text-cream-100' : 'border-charcoal-800/10 bg-white text-charcoal-600 hover:border-charcoal-800/30'"
          :aria-pressed="checkout.deliverySlot === s"
          @click="checkout.deliverySlot = s"
        >
          <CalendarClock class="h-4 w-4" aria-hidden="true" /> {{ s }}
        </button>
      </div>
      <p class="mt-2 text-xs text-charcoal-400">
        Estimated {{ checkout.deliveryMethod === 'pickup' ? 'ready' : 'delivery' }} time:
        <strong class="text-charcoal-700">{{ estimate(checkout.deliveryMethod).window }}</strong> (sample estimate).
      </p>
    </fieldset>
  </div>
</template>
