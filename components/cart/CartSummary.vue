<script setup>
import { Bike, Store } from 'lucide-vue-next'
import { DELIVERY_RULES } from '~/data/offers'
import { useCartStore } from '~/stores/cart'
import { formatLKR } from '~/utils/pricing'

defineProps({
  showCode: { type: Boolean, default: true },
})
const cart = useCartStore()
const toFree = computed(() => Math.max(0, DELIVERY_RULES.freeDeliveryThreshold - cart.subtotal))
</script>

<template>
  <div class="space-y-4">
    <DiscountCode v-if="showCode" />

    <dl class="space-y-2 text-sm">
      <div class="flex justify-between">
        <dt class="text-charcoal-500">Subtotal ({{ cart.count }} {{ cart.count === 1 ? 'item' : 'items' }})</dt>
        <dd class="font-semibold tabular-nums">{{ formatLKR(cart.subtotal) }}</dd>
      </div>
      <div v-if="cart.discount" class="flex justify-between text-olive-600">
        <dt>Discount ({{ cart.promoCode }})</dt>
        <dd class="font-semibold tabular-nums">− {{ formatLKR(cart.discount) }}</dd>
      </div>
      <div class="flex justify-between">
        <dt class="flex items-center gap-1.5 text-charcoal-500">
          <component :is="cart.deliveryMethod === 'pickup' ? Store : Bike" class="h-4 w-4" aria-hidden="true" />
          {{ cart.deliveryMethod === 'pickup' ? 'Pickup' : 'Delivery fee' }}
        </dt>
        <dd class="font-semibold tabular-nums" :class="cart.deliveryFee ? '' : 'text-olive-600'">
          {{ cart.deliveryFee ? formatLKR(cart.deliveryFee) : 'Free' }}
        </dd>
      </div>
      <p v-if="cart.deliveryMethod === 'delivery' && cart.deliveryFee && toFree > 0" class="rounded-xl bg-gold-100 px-3 py-2 text-xs font-semibold text-gold-600">
        Add {{ formatLKR(toFree) }} more for free delivery.
      </p>
      <div class="flex items-baseline justify-between border-t border-dashed border-charcoal-800/15 pt-3">
        <dt class="text-base font-bold">Total</dt>
        <dd class="font-display text-2xl font-bold tabular-nums text-tomato-600">{{ formatLKR(cart.total) }}</dd>
      </div>
    </dl>
  </div>
</template>
