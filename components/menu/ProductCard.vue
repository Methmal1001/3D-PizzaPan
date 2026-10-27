<script setup>
import { Check, Clock, Flame, Leaf, Plus, SlidersHorizontal, Star } from 'lucide-vue-next'
import { useCart } from '~/composables/useCart'
import { formatLKR } from '~/utils/pricing'

const props = defineProps({
  product: { type: Object, required: true },
  compact: { type: Boolean, default: false },
})

const { quickAdd } = useCart()
const added = ref(false)
let timer

const isPizza = computed(() => props.product.type === 'pizza')
const isBuilder = computed(() => props.product.type === 'builder')
const customizeLink = computed(() =>
  isBuilder.value ? '/customize' : { path: '/customize', query: { product: props.product.id } },
)

const add = () => {
  quickAdd(props.product.id)
  added.value = true
  clearTimeout(timer)
  timer = setTimeout(() => (added.value = false), 1400)
}
onBeforeUnmount(() => clearTimeout(timer))

const backdrop = computed(() => {
  const c = props.product.category
  if (c === 'beverages') return 'from-[#e9f1ec] to-[#d5e6dc]'
  if (c === 'desserts') return 'from-[#f6e6dc] to-[#ecd2c3]'
  if (c === 'offers') return 'from-gold-100 to-ember-100'
  return 'from-cream-200 to-cream-300'
})
</script>

<template>
  <article
    class="card group relative flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-warm-lg"
  >
    <div class="relative overflow-hidden bg-gradient-to-br" :class="[backdrop, compact ? 'aspect-[5/4]' : 'aspect-[4/3]']">
      <div
        class="pointer-events-none absolute left-1/2 top-1/2 h-[78%] w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/40 blur-2xl"
        aria-hidden="true"
      />
      <div class="absolute inset-[8%] transition duration-500 ease-out group-hover:rotate-[8deg] group-hover:scale-[1.06]">
        <ProductVisual :product="product" />
      </div>

      <div class="absolute left-3 top-3 flex flex-wrap gap-1.5">
        <span v-if="product.tags?.[0]" class="chip bg-charcoal-800 text-cream-100">{{ product.tags[0] }}</span>
        <span v-if="product.vegetarian && product.type !== 'item'" class="chip bg-olive-500 text-white" title="Vegetarian">
          <Leaf class="h-3 w-3" aria-hidden="true" /> Veg
        </span>
        <span v-if="product.spicy > 0" class="chip bg-tomato-500 text-white" :title="`Spice level ${product.spicy} of 3`">
          <Flame v-for="n in product.spicy" :key="n" class="-mx-0.5 h-3 w-3" aria-hidden="true" />
          <span class="sr-only">Spice level {{ product.spicy }} of 3</span>
        </span>
      </div>
      <span
        class="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-xs font-bold text-charcoal-800 shadow-sm"
        :title="`Sample rating: ${product.rating} from ${product.reviews} sample reviews`"
      >
        <Star class="h-3.5 w-3.5 fill-gold-400 text-gold-500" aria-hidden="true" />
        {{ product.rating.toFixed(1) }}
        <span class="sr-only">out of 5 (sample rating)</span>
      </span>
    </div>

    <div class="flex flex-1 flex-col p-4 sm:p-5">
      <div class="flex items-start justify-between gap-3">
        <h3 class="font-display text-lg font-bold leading-snug text-charcoal-800">
          <NuxtLink v-if="product.type !== 'item'" :to="customizeLink" class="hover:text-tomato-500">{{ product.name }}</NuxtLink>
          <template v-else>{{ product.name }}</template>
        </h3>
      </div>
      <p class="mt-1.5 line-clamp-2 text-sm leading-relaxed text-charcoal-400">{{ product.description }}</p>

      <p class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-charcoal-400">
        <span class="inline-flex items-center gap-1"><Clock class="h-3.5 w-3.5" aria-hidden="true" /> {{ product.prepTime }} min</span>
        <span v-if="product.sizes?.length">4 sizes · 4 crusts</span>
        <span class="text-charcoal-300">{{ product.reviews }} sample reviews</span>
      </p>

      <div class="mt-auto flex items-end justify-between gap-2 pt-4">
        <div>
          <p v-if="isPizza || isBuilder" class="text-[11px] font-semibold uppercase tracking-wide text-charcoal-300">
            {{ isBuilder ? 'Starts at' : 'Regular from' }}
          </p>
          <p class="font-display text-xl font-bold text-tomato-600">
            {{ formatLKR(product.price) }}
            <span v-if="product.compareAt" class="ml-1 font-sans text-xs font-semibold text-charcoal-300 line-through">
              {{ formatLKR(product.compareAt) }}
            </span>
          </p>
        </div>
      </div>

      <div class="mt-3 flex gap-2">
        <NuxtLink
          v-if="isPizza || isBuilder"
          :to="customizeLink"
          class="btn-outline flex-1 px-3"
          :class="isBuilder ? 'border-transparent bg-charcoal-800 text-cream-100 hover:bg-charcoal-700 hover:text-cream-100' : ''"
          :aria-label="isBuilder ? 'Start building your own pizza' : `Customize ${product.name}`"
        >
          <SlidersHorizontal class="h-4 w-4" aria-hidden="true" />
          {{ isBuilder ? 'Start Building' : 'Customize' }}
        </NuxtLink>
        <button
          v-if="!isBuilder"
          type="button"
          class="btn flex-1 px-3 text-white shadow-warm"
          :class="added ? 'bg-olive-500 hover:bg-olive-600' : 'bg-tomato-500 hover:bg-tomato-600'"
          :aria-label="`Add ${product.name} to cart`"
          @click="add"
        >
          <Transition name="fade" mode="out-in">
            <span v-if="added" key="ok" class="inline-flex items-center gap-1.5"><Check class="h-4 w-4" /> Added</span>
            <span v-else key="add" class="inline-flex items-center gap-1.5"><Plus class="h-4 w-4" /> Add</span>
          </Transition>
        </button>
      </div>
    </div>
  </article>
</template>
