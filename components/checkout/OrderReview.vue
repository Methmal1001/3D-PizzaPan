<script setup>
import { Banknote, Bike, CreditCard, Pencil, Store, User } from 'lucide-vue-next'
import { findProduct } from '~/data/products'
import { useCartStore } from '~/stores/cart'
import { estimateMinutes, useCheckoutStore } from '~/stores/checkout'
import { usePricing } from '~/composables/usePricing'

const emit = defineEmits(['edit'])
const cart = useCartStore()
const checkout = useCheckoutStore()
const { formatLKR, describeOptions, toppingNames } = usePricing()
const c = computed(() => checkout.customer)
const est = computed(() => estimateMinutes(cart.items, checkout.deliveryMethod))
</script>

<template>
  <div class="space-y-4">
    <div class="grid gap-4 md:grid-cols-2">
      <section class="rounded-3xl bg-white p-5 shadow-sm" aria-labelledby="rv-customer">
        <div class="flex items-center justify-between">
          <h3 id="rv-customer" class="flex items-center gap-2 font-sans text-sm font-bold uppercase tracking-wide text-charcoal-400"><User class="h-4 w-4" aria-hidden="true" /> Customer</h3>
          <button type="button" class="inline-flex items-center gap-1 text-xs font-bold text-tomato-500 hover:underline" @click="emit('edit', 1)"><Pencil class="h-3.5 w-3.5" /> Edit</button>
        </div>
        <p class="mt-2 font-bold">{{ c.fullName }}</p>
        <p class="text-sm text-charcoal-500">{{ c.mobile }}<template v-if="c.email"> · {{ c.email }}</template></p>
        <p v-if="checkout.deliveryMethod === 'delivery'" class="mt-1 text-sm text-charcoal-500">{{ c.address }}, {{ c.city }}</p>
        <p v-if="c.instructions" class="mt-1 text-xs italic text-charcoal-400">“{{ c.instructions }}”</p>
      </section>

      <section class="rounded-3xl bg-white p-5 shadow-sm" aria-labelledby="rv-delivery">
        <div class="flex items-center justify-between">
          <h3 id="rv-delivery" class="flex items-center gap-2 font-sans text-sm font-bold uppercase tracking-wide text-charcoal-400">
            <component :is="checkout.deliveryMethod === 'pickup' ? Store : Bike" class="h-4 w-4" aria-hidden="true" /> {{ checkout.deliveryMethod === 'pickup' ? 'Pickup' : 'Delivery' }}
          </h3>
          <button type="button" class="inline-flex items-center gap-1 text-xs font-bold text-tomato-500 hover:underline" @click="emit('edit', 2)"><Pencil class="h-3.5 w-3.5" /> Edit</button>
        </div>
        <p class="mt-2 font-bold">{{ checkout.deliveryMethod === 'pickup' ? 'Pickup from bakery' : 'Home delivery' }}</p>
        <p class="text-sm text-charcoal-500">{{ checkout.deliverySlot === 'asap' ? `As soon as possible · ~${est.window}` : `Scheduled for ${checkout.deliverySlot}` }}</p>
        <div class="mt-3 flex items-center justify-between border-t border-charcoal-800/5 pt-3">
          <p class="flex items-center gap-2 text-sm font-bold">
            <component :is="checkout.paymentMethod === 'card' ? CreditCard : Banknote" class="h-4 w-4 text-charcoal-400" aria-hidden="true" />
            {{ checkout.paymentMethod === 'card' ? 'Card payment (simulated demo)' : 'Cash on Delivery' }}
          </p>
          <button type="button" class="inline-flex items-center gap-1 text-xs font-bold text-tomato-500 hover:underline" @click="emit('edit', 3)"><Pencil class="h-3.5 w-3.5" /> Edit</button>
        </div>
      </section>
    </div>

    <section class="rounded-3xl bg-white p-5 shadow-sm" aria-labelledby="rv-items">
      <div class="flex items-center justify-between">
        <h3 id="rv-items" class="font-sans text-sm font-bold uppercase tracking-wide text-charcoal-400">Items ({{ cart.count }})</h3>
        <NuxtLink to="/cart" class="inline-flex items-center gap-1 text-xs font-bold text-tomato-500 hover:underline"><Pencil class="h-3.5 w-3.5" /> Edit cart</NuxtLink>
      </div>
      <ul class="mt-3 divide-y divide-charcoal-800/5">
        <li v-for="line in cart.items" :key="line.lineId" class="flex items-center gap-3 py-3">
          <div class="relative h-14 w-14 shrink-0 rounded-xl bg-cream-200">
            <div class="absolute inset-1"><ProductVisual :product="findProduct(line.productId)" :options="line.options" size="sm" /></div>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-bold">{{ line.quantity }} × {{ line.name }}</p>
            <p v-if="line.options" class="text-xs text-charcoal-400">{{ describeOptions(line.options) }}</p>
            <p v-if="line.options?.toppings.length" class="text-xs text-olive-600">{{ toppingNames(line.options.toppings).join(', ') }}</p>
          </div>
          <p class="text-sm font-bold tabular-nums">{{ formatLKR(line.unitPrice * line.quantity) }}</p>
        </li>
      </ul>
    </section>
  </div>
</template>
