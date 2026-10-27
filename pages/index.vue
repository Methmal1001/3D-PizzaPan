<script setup>
import { ArrowRight, ChefHat, Clock, DoorOpen, Flame, Hand, LogOut, MousePointerClick, ShoppingBag, Sparkles, UtensilsCrossed, Wheat } from 'lucide-vue-next'
import { useMenu } from '~/composables/useMenu'
import { useHotspotActions } from '~/composables/useHotspotActions'
import { useUiStore } from '~/stores/ui'

definePageMeta({ immersive: true })
useHead({ title: 'PizzaPan Bakery — Freshly Baked. Made Just for You.' })

const ui = useUiStore()
const { featured } = useMenu()
const hotspots = useHotspotActions()

const phase = ref('loading') // loading | outside | entering | inside
const progress = ref(0)
const failed = ref(false)
const failReason = ref('')
const inside = ref(false)
const hero = ref(null)

const onReady = () => {
  phase.value = inside.value ? 'inside' : 'outside'
  revealHero()
}
const onFailed = (reason) => {
  failed.value = true
  failReason.value = reason
  ui.webgl = false
  phase.value = inside.value ? 'inside' : 'outside'
}

const enterShop = () => {
  if (phase.value === 'loading') return
  inside.value = true
  ui.enteredShop = true
  if (failed.value) phase.value = 'inside'
  else phase.value = 'entering'
}
const onEntered = () => (phase.value = 'inside')
const stepOutside = () => {
  inside.value = false
  phase.value = failed.value ? 'outside' : 'entering'
}
const onExited = () => (phase.value = 'outside')

const onHotspot = (id) => {
  if (id === 'door') return enterShop()
  hotspots.run(id)
}

async function revealHero() {
  await nextTick()
  if (!hero.value || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const { gsap } = await import('gsap')
  gsap.from(hero.value.querySelectorAll('[data-reveal]'), {
    y: 28,
    opacity: 0,
    duration: 0.8,
    stagger: 0.09,
    ease: 'power3.out',
  })
}

// If WebGL is missing entirely we still show the page instantly
onMounted(() => {
  if (!useNuxtApp().$detectWebGL()) onFailed('no-webgl')
})

const steps = [
  { icon: DoorOpen, title: 'Step inside', text: 'Walk through our doors and explore the bakery in 3D — or jump straight to the menu.' },
  { icon: ChefHat, title: 'Build your pizza', text: 'Pick a size, crust, sauce, cheese and up to 10 toppings. Watch it come together live.' },
  { icon: ShoppingBag, title: 'Order in minutes', text: 'Cash on delivery or a simulated card payment, then follow your order’s demo progress.' },
]
</script>

<template>
  <div>
    <!-- Immersive hero -->
    <section class="relative h-[100svh] min-h-[560px] w-full overflow-hidden bg-charcoal-900" aria-label="PizzaPan Bakery entrance">
      <BakeryFallback v-if="failed" :inside="inside" :reason="failReason" @hotspot="onHotspot" />
      <ClientOnly v-else>
        <BakeryScene
          :inside="inside"
          @progress="progress = $event"
          @ready="onReady"
          @failed="onFailed"
          @entered="onEntered"
          @exited="onExited"
          @hotspot="onHotspot"
        />
      </ClientOnly>

      <Transition name="fade">
        <SceneLoader v-if="phase === 'loading' && !failed" :progress="progress" />
      </Transition>

      <!-- Outside: welcome overlay -->
      <Transition name="fade">
        <div
          v-if="phase === 'outside' || (phase === 'loading' && failed)"
          ref="hero"
          class="pointer-events-none absolute inset-0 flex items-end"
        >
          <div class="absolute inset-x-0 bottom-0 h-[70%] bg-gradient-to-t from-charcoal-900/95 via-charcoal-900/60 to-transparent" aria-hidden="true" />
          <div class="container-pp relative pb-10 sm:pb-14 lg:pb-16">
            <div class="max-w-2xl">
              <p data-reveal class="eyebrow inline-flex items-center gap-2 text-gold-300">
                <Flame class="h-4 w-4" aria-hidden="true" /> Wood-fired in Colombo · Est. 2026
              </p>
              <h1 data-reveal class="mt-3 text-balance font-display text-4xl font-bold leading-[1.05] text-cream-100 sm:text-6xl lg:text-7xl">
                Freshly Baked.<br /><span class="text-gold-400">Made Just for You.</span>
              </h1>
              <p data-reveal class="mt-4 max-w-lg text-base text-cream-200/85 sm:text-lg">
                Step through our glass doors, wander past the stone oven and pick your perfect pizza — straight from the
                counter to your door.
              </p>
              <div data-reveal class="pointer-events-auto mt-7 flex flex-wrap items-center gap-3">
                <button type="button" class="btn-primary px-7 py-3.5 text-base" @click="enterShop">
                  <DoorOpen class="h-5 w-5" aria-hidden="true" />
                  Enter PizzaPan
                </button>
                <NuxtLink to="/menu" class="btn-ghost-light px-6 py-3.5 text-base">
                  <UtensilsCrossed class="h-5 w-5" aria-hidden="true" />
                  Explore Menu
                </NuxtLink>
              </div>
              <ul data-reveal class="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-cream-200/70 sm:text-sm">
                <li class="inline-flex items-center gap-1.5"><Wheat class="h-4 w-4 text-gold-400" /> 48-hour proofed dough</li>
                <li class="inline-flex items-center gap-1.5"><Flame class="h-4 w-4 text-gold-400" /> Stone-oven baked</li>
                <li class="inline-flex items-center gap-1.5"><Clock class="h-4 w-4 text-gold-400" /> Ready in ~20 min</li>
              </ul>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Skip intro (always available) -->
      <NuxtLink
        v-if="phase !== 'inside'"
        to="/menu"
        class="absolute right-4 top-20 z-20 inline-flex items-center gap-1.5 rounded-full bg-charcoal-900/60 px-4 py-2 text-xs font-bold text-cream-100 backdrop-blur transition hover:bg-charcoal-900/80 sm:right-6 sm:top-24"
      >
        Skip intro <ArrowRight class="h-3.5 w-3.5" aria-hidden="true" />
      </NuxtLink>

      <!-- Entering -->
      <Transition name="fade">
        <p
          v-if="phase === 'entering'"
          class="pointer-events-none absolute inset-x-0 bottom-12 text-center font-display text-2xl font-semibold text-cream-100 drop-shadow-lg"
          aria-live="polite"
        >
          {{ inside ? 'Welcome to PizzaPan…' : 'See you soon!' }}
        </p>
      </Transition>

      <!-- Inside: exploration UI -->
      <Transition name="fade">
        <div v-if="phase === 'inside'" class="pointer-events-none absolute inset-0 flex flex-col justify-between">
          <div class="container-pp pt-20 sm:pt-24">
            <!-- The CSS fallback brings its own heading and tiles -->
            <div v-if="!failed" class="glass-dark pointer-events-auto inline-flex max-w-md items-start gap-3 rounded-2xl p-4 shadow-warm-lg">
              <Sparkles class="mt-0.5 h-5 w-5 shrink-0 text-gold-400" aria-hidden="true" />
              <div>
                <p class="font-display text-lg font-semibold">Welcome inside!</p>
                <p class="mt-1 text-xs text-cream-200/75 sm:text-sm">
                  <Hand class="inline h-3.5 w-3.5" aria-hidden="true" /> Drag to look around ·
                  <MousePointerClick class="inline h-3.5 w-3.5" aria-hidden="true" /> tap a glowing marker or the oven, fridge and counter.
                </p>
              </div>
            </div>
          </div>

          <div class="bg-gradient-to-t from-charcoal-900/90 via-charcoal-900/50 to-transparent pb-6 pt-16">
            <div class="container-pp">
              <div v-if="!failed" class="no-scrollbar pointer-events-auto -mx-4 flex gap-2 overflow-x-auto px-4 pb-3" role="list" aria-label="Explore the bakery">
                <button
                  v-for="h in hotspots.list"
                  :key="h.id"
                  role="listitem"
                  type="button"
                  class="shrink-0 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold text-cream-100 backdrop-blur transition hover:border-gold-400 hover:bg-white/20 sm:text-sm"
                  @click="onHotspot(h.id)"
                >
                  {{ h.label }}
                </button>
              </div>
              <div class="pointer-events-auto flex flex-wrap items-center gap-3">
                <NuxtLink to="/menu" class="btn-primary px-7 py-3.5 text-base">
                  Start Ordering <ArrowRight class="h-5 w-5" aria-hidden="true" />
                </NuxtLink>
                <NuxtLink to="/customize" class="btn-accent px-6 py-3.5 text-base">
                  <ChefHat class="h-5 w-5" aria-hidden="true" /> Build Your Own
                </NuxtLink>
                <button type="button" class="btn-ghost-light" @click="stepOutside">
                  <LogOut class="h-4 w-4" aria-hidden="true" /> Step outside
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </section>

    <!-- Below the fold -->
    <section class="bg-dough py-16 sm:py-20">
      <div class="container-pp">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p class="eyebrow">Fresh from the oven</p>
            <h2 class="mt-2 font-display text-3xl font-bold sm:text-4xl">Today’s favourites</h2>
          </div>
          <NuxtLink to="/menu" class="btn-outline">View full menu <ArrowRight class="h-4 w-4" /></NuxtLink>
        </div>
        <div class="mt-8 grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 lg:grid-cols-4">
          <ProductCard v-for="p in featured.slice(0, 4)" :key="p.id" :product="p" />
        </div>
      </div>
    </section>

    <section class="container-pp pb-4">
      <div class="grid gap-5 md:grid-cols-3">
        <div v-for="(s, i) in steps" :key="s.title" class="card relative overflow-hidden p-6">
          <span class="absolute right-4 top-2 font-display text-7xl font-bold text-cream-200" aria-hidden="true">{{ i + 1 }}</span>
          <span class="relative grid h-12 w-12 place-items-center rounded-2xl bg-tomato-500 text-white shadow-warm">
            <component :is="s.icon" class="h-6 w-6" aria-hidden="true" />
          </span>
          <h3 class="relative mt-4 font-display text-xl font-bold">{{ s.title }}</h3>
          <p class="relative mt-2 text-sm text-charcoal-400">{{ s.text }}</p>
        </div>
      </div>
    </section>
  </div>
</template>
