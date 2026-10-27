<script setup>
import { ArrowRight, BadgePercent, ChefHat, Users } from 'lucide-vue-next'
import { PROMO_BANNERS } from '~/data/offers'
import { findProduct } from '~/data/products'

const emit = defineEmits(['category'])

const tones = {
  tomato: 'bg-gradient-to-br from-tomato-500 to-tomato-700 text-white',
  gold: 'bg-gradient-to-br from-gold-300 to-ember-400 text-charcoal-800',
  charcoal: 'bg-gradient-to-br from-charcoal-700 to-charcoal-900 text-cream-100',
}
const icons = { 'promo-family': Users, 'promo-code': BadgePercent, 'promo-build': ChefHat }

const go = (b) => {
  if (b.route) return navigateTo(b.route)
  if (b.productId) return emit('category', findProduct(b.productId)?.category || 'offers')
  if (b.category) emit('category', b.category)
}
</script>

<template>
  <div class="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0">
    <button
      v-for="b in PROMO_BANNERS"
      :key="b.id"
      type="button"
      class="group relative w-[82%] shrink-0 snap-start overflow-hidden rounded-3xl p-5 text-left shadow-warm transition hover:-translate-y-0.5 hover:shadow-warm-lg sm:w-auto"
      :class="tones[b.tone]"
      @click="go(b)"
    >
      <div class="pointer-events-none absolute -bottom-10 -right-8 h-32 w-32 opacity-90 transition duration-500 group-hover:rotate-12" aria-hidden="true">
        <PizzaArt :toppings="b.tone === 'gold' ? ['pineapple', 'chicken'] : ['pepperoni', 'mushrooms']" label="" />
      </div>
      <component :is="icons[b.id]" class="h-6 w-6 opacity-80" aria-hidden="true" />
      <p class="mt-3 pr-16 font-display text-xl font-bold">{{ b.title }}</p>
      <p class="mt-1 pr-20 text-sm opacity-85">{{ b.text }}</p>
      <span class="mt-4 inline-flex items-center gap-1 text-sm font-bold underline-offset-4 group-hover:underline">
        {{ b.cta }} <ArrowRight class="h-4 w-4" aria-hidden="true" />
      </span>
    </button>
  </div>
</template>
