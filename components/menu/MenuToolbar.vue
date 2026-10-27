<script setup>
import { ArrowUpDown, Flame, Leaf, Search, X } from 'lucide-vue-next'

defineProps({
  sortOptions: { type: Array, required: true },
  resultCount: { type: Number, default: 0 },
})
const search = defineModel('search', { type: String, default: '' })
const sort = defineModel('sort', { type: String, default: 'featured' })
const vegOnly = defineModel('vegOnly', { type: Boolean, default: false })
const spicyOnly = defineModel('spicyOnly', { type: Boolean, default: false })
</script>

<template>
  <div class="flex flex-col gap-3 md:flex-row md:items-center">
    <div class="relative flex-1">
      <label for="menu-search" class="sr-only">Search the menu</label>
      <Search class="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-charcoal-300" aria-hidden="true" />
      <input
        id="menu-search"
        v-model="search"
        type="search"
        placeholder="Search pizzas, sides, drinks…"
        class="input rounded-full pl-12 pr-11"
        autocomplete="off"
      />
      <button
        v-if="search"
        type="button"
        class="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-charcoal-400 hover:bg-charcoal-800/5"
        aria-label="Clear search"
        @click="search = ''"
      >
        <X class="h-4 w-4" />
      </button>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <button
        type="button"
        class="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition"
        :class="vegOnly ? 'border-olive-500 bg-olive-500 text-white' : 'border-charcoal-800/10 bg-white text-charcoal-600 hover:border-olive-500/50'"
        :aria-pressed="vegOnly"
        @click="vegOnly = !vegOnly"
      >
        <Leaf class="h-4 w-4" aria-hidden="true" /> Veg
      </button>
      <button
        type="button"
        class="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition"
        :class="spicyOnly ? 'border-tomato-500 bg-tomato-500 text-white' : 'border-charcoal-800/10 bg-white text-charcoal-600 hover:border-tomato-500/50'"
        :aria-pressed="spicyOnly"
        @click="spicyOnly = !spicyOnly"
      >
        <Flame class="h-4 w-4" aria-hidden="true" /> Spicy
      </button>
      <div class="relative">
        <label for="menu-sort" class="sr-only">Sort products</label>
        <ArrowUpDown class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400" aria-hidden="true" />
        <select
          id="menu-sort"
          v-model="sort"
          class="min-h-[44px] appearance-none rounded-full border border-charcoal-800/10 bg-white py-2 pl-10 pr-8 text-sm font-semibold text-charcoal-700 outline-none focus:border-ember-500 focus:ring-4 focus:ring-gold-400/30"
        >
          <option v-for="o in sortOptions" :key="o.id" :value="o.id">{{ o.label }}</option>
        </select>
      </div>
      <span class="ml-1 text-xs font-semibold text-charcoal-400" aria-live="polite">{{ resultCount }} items</span>
    </div>
  </div>
</template>
