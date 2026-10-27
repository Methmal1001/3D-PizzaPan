<script setup>
import { Pencil, X } from 'lucide-vue-next'
import { findProduct } from '~/data/products'
import { useCartStore } from '~/stores/cart'
import { useUiStore } from '~/stores/ui'
import { useCart } from '~/composables/useCart'
import { usePricing } from '~/composables/usePricing'

const props = defineProps({
  line: { type: Object, required: true },
  compact: { type: Boolean, default: false },
})

const cart = useCartStore()
const ui = useUiStore()
const { removeLine } = useCart()
const { formatLKR, describeOptions, toppingNames } = usePricing()

const product = computed(() => findProduct(props.line.productId) || { name: props.line.name, type: 'item', visual: 'fallback' })
const quantity = computed({
  get: () => props.line.quantity,
  set: (v) => cart.setQuantity(props.line.lineId, v),
})
const toppings = computed(() => toppingNames(props.line.options?.toppings))

const edit = () => {
  ui.closeCart()
  navigateTo({ path: '/customize', query: { edit: props.line.lineId } })
}
</script>

<template>
  <article class="flex gap-3 sm:gap-4" :class="compact ? 'py-4' : 'p-4 sm:p-5'">
    <div class="relative shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-cream-200 to-cream-300" :class="compact ? 'h-20 w-20' : 'h-24 w-24 sm:h-28 sm:w-28'">
      <div class="absolute inset-[8%]">
        <ProductVisual :product="product" :options="line.options" size="sm" />
      </div>
    </div>

    <div class="min-w-0 flex-1">
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <h3 class="font-display text-base font-bold leading-tight text-charcoal-800 sm:text-lg">
            {{ line.name }}
            <span v-if="line.kind === 'custom'" class="chip ml-1 bg-gold-100 align-middle text-gold-600">Custom</span>
          </h3>
          <p v-if="line.options" class="mt-0.5 text-xs font-medium text-charcoal-400">{{ describeOptions(line.options) }}</p>
        </div>
        <button
          type="button"
          class="-mr-1 -mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full text-charcoal-300 transition hover:bg-tomato-50 hover:text-tomato-500"
          :aria-label="`Remove ${line.name}`"
          @click="removeLine(line.lineId)"
        >
          <X class="h-4 w-4" />
        </button>
      </div>

      <ul v-if="toppings.length" class="mt-1.5 flex flex-wrap gap-1" aria-label="Toppings">
        <li v-for="t in toppings" :key="t" class="rounded-full bg-olive-100 px-2 py-0.5 text-[11px] font-semibold text-olive-700">{{ t }}</li>
      </ul>
      <p v-else-if="line.options" class="mt-1 text-[11px] font-semibold text-charcoal-300">No extra toppings</p>

      <div class="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <QuantityStepper v-model="quantity" size="sm" removable :label="`Quantity of ${line.name}`" @remove="removeLine(line.lineId)" />
          <button
            v-if="line.options"
            type="button"
            class="inline-flex min-h-[36px] items-center gap-1 rounded-full px-2.5 text-xs font-bold text-charcoal-500 hover:bg-cream-200 hover:text-tomato-500"
            @click="edit"
          >
            <Pencil class="h-3.5 w-3.5" aria-hidden="true" /> Edit
          </button>
        </div>
        <div class="text-right">
          <p class="font-display text-base font-bold tabular-nums text-charcoal-800 sm:text-lg">{{ formatLKR(line.unitPrice * line.quantity) }}</p>
          <p v-if="line.quantity > 1" class="text-[11px] text-charcoal-400">{{ formatLKR(line.unitPrice) }} each</p>
        </div>
      </div>
    </div>
  </article>
</template>
