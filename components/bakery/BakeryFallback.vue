<script setup>
// Lightweight CSS-only bakery used when WebGL is unavailable or the 3D scene fails.
// Keeps the door-opening moment and the explorable "hotspots" so ordering is never blocked.
import { CakeSlice, ChefHat, Crown, CupSoda, Flame, Leaf, ShoppingBag, Tag, UtensilsCrossed, Wheat } from 'lucide-vue-next'
import { HOTSPOT_LIST } from '~/composables/useHotspotActions'

const props = defineProps({
  inside: { type: Boolean, default: false },
  reason: { type: String, default: '' },
})
const emit = defineEmits(['hotspot'])

const icons = {
  display: Crown,
  oven: ChefHat,
  menu: UtensilsCrossed,
  spicy: Flame,
  veg: Leaf,
  bread: Wheat,
  dessert: CakeSlice,
  fridge: CupSoda,
  offers: Tag,
  register: ShoppingBag,
}
</script>

<template>
  <div class="relative h-full w-full overflow-hidden bg-gradient-to-b from-[#141429] via-[#3b2638] to-[#1b1517]">
    <!-- street glow -->
    <div class="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#120d0c] to-transparent" aria-hidden="true" />

    <!-- Storefront -->
    <div
      class="absolute left-1/2 top-[14%] w-[min(92vw,820px)] -translate-x-1/2 transition-all duration-1000 ease-in-out [perspective:1200px]"
      :class="props.inside ? 'scale-[2.2] opacity-0' : 'scale-100 opacity-100'"
      aria-hidden="true"
    >
      <div class="rounded-t-lg bg-[#8a3b2a] p-3 pb-0 shadow-2xl [background-image:repeating-linear-gradient(0deg,rgba(0,0,0,0.18)_0_2px,transparent_2px_22px),repeating-linear-gradient(90deg,rgba(0,0,0,0.12)_0_2px,transparent_2px_44px)]">
        <div class="mx-auto mb-3 w-[70%] rounded border-2 border-gold-400 bg-charcoal-900 py-2 text-center shadow-glow">
          <span class="font-display text-2xl font-bold text-cream-100 sm:text-4xl">Pizza<span class="text-tomato-400">Pan</span></span>
          <span class="block text-[10px] font-bold tracking-[0.4em] text-gold-400">BAKERY</span>
        </div>
        <div class="h-6 rounded-sm [background:repeating-linear-gradient(90deg,#C8232B_0_24px,#F6EEDD_24px_48px)]" />
        <div class="grid grid-cols-[1fr_0.8fr_1fr] gap-3 pt-3">
          <div class="h-32 rounded-sm border-4 border-charcoal-900 bg-gradient-to-b from-gold-300/80 to-ember-600/70 sm:h-48">
            <div class="flex h-full items-end justify-center gap-3 p-3">
              <span class="h-10 w-10 rounded-full bg-[#C9823C] ring-4 ring-tomato-600/80" />
              <span class="h-14 w-24 rounded-t-full bg-[#5c2a1c]" />
            </div>
          </div>
          <div class="relative flex h-40 gap-0.5 border-4 border-b-0 border-charcoal-900 bg-gold-300/70 sm:h-56">
            <span
              class="h-full flex-1 origin-left border-2 border-charcoal-800 bg-sky-100/30 transition-transform duration-700"
              :style="{ transform: props.inside ? 'rotateY(-80deg)' : 'none' }"
            />
            <span
              class="h-full flex-1 origin-right border-2 border-charcoal-800 bg-sky-100/30 transition-transform duration-700"
              :style="{ transform: props.inside ? 'rotateY(80deg)' : 'none' }"
            />
            <span class="absolute left-[18%] top-[30%] rounded bg-tomato-500 px-1.5 text-[10px] font-extrabold text-white">OPEN</span>
          </div>
          <div class="h-32 rounded-sm border-4 border-charcoal-900 bg-gradient-to-b from-gold-300/80 to-ember-600/70 sm:h-48">
            <div class="flex h-full items-end justify-around p-3">
              <span class="h-16 w-16 rounded-full bg-[#2a2a2a] ring-4 ring-cream-200/70" />
            </div>
          </div>
        </div>
      </div>
      <div class="h-3 bg-[#5d5550]" />
    </div>

    <!-- Interior (after entering) -->
    <Transition name="fade">
      <div v-if="props.inside" class="absolute inset-0 overflow-y-auto bg-wood px-4 pb-10 pt-24 sm:pt-28">
        <div class="mx-auto max-w-4xl">
          <p class="eyebrow text-gold-300">Inside PizzaPan</p>
          <h2 class="mt-2 font-display text-3xl font-bold text-cream-100 sm:text-4xl">Where would you like to go?</h2>
          <p v-if="reason" class="mt-2 text-sm text-cream-200/70">
            Showing the lightweight bakery because 3D graphics aren’t available on this device.
          </p>
          <div class="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <button
              v-for="h in HOTSPOT_LIST"
              :key="h.id"
              type="button"
              class="group flex min-h-[96px] flex-col items-start justify-between rounded-2xl border border-white/10 bg-charcoal-900/60 p-4 text-left text-cream-100 transition hover:-translate-y-0.5 hover:border-gold-400/60 hover:bg-charcoal-900/80"
              @click="emit('hotspot', h.id)"
            >
              <component :is="icons[h.id]" class="h-6 w-6 text-gold-400 transition group-hover:scale-110" aria-hidden="true" />
              <span class="text-sm font-bold">{{ h.label }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>
