<script setup>
import { ArrowRight, ChefHat, Hand, LayoutGrid, Sparkles } from 'lucide-vue-next'
import { useMenu } from '~/composables/useMenu'
import { HOTSPOT_TARGETS, useHotspotActions } from '~/composables/useHotspotActions'
import { useUiStore } from '~/stores/ui'

const ui = useUiStore()
const menu = useMenu()
const { category, activeCategory, search, sort, vegOnly, spicyOnly, filtered, featured, countFor, resetFilters } = menu
const hotspots = useHotspotActions()

useHead(() => ({ title: `${activeCategory.value.name} — PizzaPan Bakery Menu` }))

const viewMode = computed({
  get: () => ui.viewMode,
  set: (v) => ui.setViewMode(v),
})

// 3D shop state
const sceneReady = ref(false)
const sceneFailed = ref(false)
const progress = ref(0)
const productsEl = ref(null)

// category -> hotspot (so chips turn the 3D camera towards the right corner of the shop)
const categoryHotspot = computed(() => {
  const entry = Object.entries(HOTSPOT_TARGETS).find(([, t]) => t.category === category.value)
  return entry ? entry[0] : null
})

const scrollToProducts = () => {
  productsEl.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const onHotspot = (id) => {
  hotspots.run(id, (cat) => {
    category.value = cat
    // On small screens, take the shopper straight to the products
    if (window.innerWidth < 1024) setTimeout(scrollToProducts, 250)
  })
}

const showExtras = computed(() => viewMode.value === 'menu' && category.value === 'all' && !search.value.trim())
</script>

<template>
  <div class="bg-dough">
    <!-- Heading -->
    <section class="container-pp pt-6 sm:pt-10">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="eyebrow">PizzaPan Menu</p>
          <h1 class="mt-1 font-display text-3xl font-bold sm:text-5xl">{{ activeCategory.name }}</h1>
          <p class="mt-2 text-sm text-charcoal-400 sm:text-base">{{ activeCategory.blurb }}</p>
        </div>
        <ViewToggle v-model="viewMode" class="self-start sm:self-auto" />
      </div>
    </section>

    <!-- Immersive 3D shop view -->
    <section v-if="viewMode === '3d'" class="container-pp mt-6" aria-label="3D bakery shop">
      <div class="relative h-[50vh] min-h-[340px] max-h-[620px] overflow-hidden rounded-[2rem] bg-charcoal-900 shadow-warm-lg ring-1 ring-black/5">
        <BakeryFallback v-if="sceneFailed" inside reason="no-webgl" @hotspot="onHotspot" />
        <ClientOnly v-else>
          <BakeryScene
            inside
            :active-hotspot="categoryHotspot"
            compact-labels
            @progress="progress = $event"
            @ready="sceneReady = true"
            @failed="sceneFailed = true"
            @hotspot="onHotspot"
          />
        </ClientOnly>
        <Transition name="fade">
          <SceneLoader v-if="!sceneReady && !sceneFailed" :progress="progress" message="Opening the shop…" />
        </Transition>

        <div v-if="sceneReady && !sceneFailed" class="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-3 sm:inset-x-5 sm:top-5">
          <p class="glass-dark inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold sm:text-sm">
            <Sparkles class="h-4 w-4 text-gold-400" aria-hidden="true" />
            <span class="hidden sm:inline">Tap the display case, oven, fridge or counter</span>
            <span class="sm:hidden">Tap a marker to browse</span>
            <Hand class="hidden h-4 w-4 text-gold-400 md:inline" aria-hidden="true" />
          </p>
          <button type="button" class="glass-dark pointer-events-auto inline-flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-full px-3.5 text-xs font-bold hover:bg-charcoal-800/90" @click="viewMode = 'menu'">
            <LayoutGrid class="h-4 w-4" aria-hidden="true" /> <span class="hidden sm:inline">Lightweight</span> menu
          </button>
        </div>
      </div>
    </section>

    <!-- Category navigation -->
    <div class="sticky top-16 z-30 mt-6 border-y border-charcoal-800/5 bg-cream-100/90 py-2.5 backdrop-blur-xl sm:top-[72px]">
      <div class="container-pp">
        <CategoryNav v-model="category" :categories="menu.categories" :count-for="countFor" />
      </div>
    </div>

    <div class="container-pp mt-8 space-y-10">
      <PromoBanners v-if="showExtras" @category="category = $event" />

      <section v-if="showExtras" aria-labelledby="featured-title">
        <div class="flex items-end justify-between gap-4">
          <div>
            <p class="eyebrow">Chef’s picks</p>
            <h2 id="featured-title" class="mt-1 font-display text-2xl font-bold sm:text-3xl">Featured today</h2>
          </div>
          <button type="button" class="hidden text-sm font-bold text-tomato-500 hover:underline sm:inline-flex" @click="category = 'signature'">
            All signatures →
          </button>
        </div>
        <div class="no-scrollbar -mx-4 mt-5 flex snap-x gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
          <div v-for="p in featured" :key="p.id" class="w-[260px] shrink-0 snap-start">
            <ProductCard :product="p" compact />
          </div>
        </div>
      </section>

      <!-- Build-your-own call-out -->
      <NuxtLink
        v-if="category === 'custom'"
        to="/customize"
        class="group relative flex flex-col gap-6 overflow-hidden rounded-[2rem] bg-charcoal-800 p-6 text-cream-100 shadow-warm-lg sm:flex-row sm:items-center sm:p-10"
      >
        <div class="relative z-10 max-w-lg">
          <p class="eyebrow text-gold-300">The main attraction</p>
          <h2 class="mt-2 font-display text-3xl font-bold sm:text-4xl">Build your own pizza, step by step</h2>
          <p class="mt-3 text-cream-200/75">Choose from 4 sizes, 4 crusts, 4 sauces, 4 cheeses and 10 toppings. Watch it come together live.</p>
          <span class="btn-accent mt-6">
            <ChefHat class="h-5 w-5" aria-hidden="true" /> Start building <ArrowRight class="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
        <div class="relative mx-auto h-56 w-56 shrink-0 transition duration-700 group-hover:rotate-45 sm:ml-auto sm:h-72 sm:w-72">
          <PizzaArt :toppings="['pepperoni', 'mushrooms', 'capsicum', 'olives', 'onions']" label="A custom pizza" />
        </div>
      </NuxtLink>

      <section id="products" ref="productsEl" class="scroll-mt-36" aria-label="Products">
        <MenuToolbar
          v-model:search="search"
          v-model:sort="sort"
          v-model:veg-only="vegOnly"
          v-model:spicy-only="spicyOnly"
          :sort-options="menu.sortOptions"
          :result-count="filtered.length"
        />

        <TransitionGroup
          v-if="filtered.length"
          tag="div"
          class="mt-6 grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="opacity-0 translate-y-3"
          leave-active-class="hidden"
        >
          <ProductCard v-for="p in filtered" :key="p.id" :product="p" />
        </TransitionGroup>

        <EmptyState
          v-else
          title="No pizzas match that"
          :text="`We couldn’t find anything for “${search}” in ${activeCategory.name}. Try another word or clear the filters.`"
        >
          <button type="button" class="btn-primary" @click="resetFilters(); category = 'all'">Clear filters</button>
          <NuxtLink to="/customize" class="btn-outline">Build your own instead</NuxtLink>
        </EmptyState>
      </section>
    </div>
  </div>
</template>
