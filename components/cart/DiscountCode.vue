<script setup>
import { BadgePercent, X } from 'lucide-vue-next'
import { useCartStore } from '~/stores/cart'

const cart = useCartStore()
const code = ref('')
const message = ref('')
const ok = ref(false)
const id = useId()

const apply = () => {
  const res = cart.applyCode(code.value)
  ok.value = res.ok
  message.value = res.message
  if (res.ok) code.value = ''
}
const remove = () => {
  cart.removeCode()
  message.value = ''
}
</script>

<template>
  <div>
    <div v-if="cart.promoCode" class="flex items-center justify-between gap-3 rounded-2xl border border-dashed px-3.5 py-2.5" :class="cart.promoValid ? 'border-olive-500 bg-olive-100/50' : 'border-gold-500 bg-gold-100/60'">
      <p class="flex items-center gap-2 text-sm">
        <BadgePercent class="h-4 w-4" :class="cart.promoValid ? 'text-olive-600' : 'text-gold-600'" aria-hidden="true" />
        <span class="font-extrabold">{{ cart.promoCode }}</span>
        <span class="text-xs text-charcoal-500">{{ cart.promoValid ? cart.promo.label : 'Not valid for this subtotal anymore' }}</span>
      </p>
      <button type="button" class="grid h-8 w-8 place-items-center rounded-full text-charcoal-400 hover:bg-white" aria-label="Remove discount code" @click="remove">
        <X class="h-4 w-4" />
      </button>
    </div>
    <form v-else class="flex gap-2" @submit.prevent="apply">
      <label :for="id" class="sr-only">Discount code</label>
      <input
        :id="id"
        v-model="code"
        type="text"
        placeholder="Discount code (try PIZZA10)"
        class="input min-w-0 flex-1 uppercase placeholder:normal-case"
        autocomplete="off"
        :aria-describedby="message ? `${id}-msg` : undefined"
        :aria-invalid="!!message && !ok"
      />
      <button type="submit" class="btn-dark shrink-0" :disabled="!code.trim()">Apply</button>
    </form>
    <p v-if="message && !cart.promoCode" :id="`${id}-msg`" class="mt-1.5 text-xs font-semibold" :class="ok ? 'text-olive-600' : 'text-tomato-600'" role="alert">
      {{ message }}
    </p>
  </div>
</template>
