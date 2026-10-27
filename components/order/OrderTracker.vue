<script setup>
// Simulated frontend order progress. Advances on a demo timer — not connected to any kitchen.
import { Bike, ChefHat, CircleCheckBig, Flame, Receipt, Store } from 'lucide-vue-next'

const props = defineProps({
  placedAt: { type: String, required: true },
  method: { type: String, default: 'delivery' },
})

const STAGE_SECONDS = 20
const stages = computed(() => [
  { title: 'Order Placed', text: 'We’ve received your demo order.', icon: Receipt },
  { title: 'Preparing Pizza', text: 'Dough stretched, toppings on.', icon: ChefHat },
  { title: 'Baking', text: 'In the stone oven at 400°C.', icon: Flame },
  props.method === 'pickup'
    ? { title: 'Ready for Pickup', text: 'Waiting for you at the counter.', icon: Store }
    : { title: 'Ready for Delivery', text: 'Boxed up and on the bike.', icon: Bike },
  { title: 'Completed', text: 'Enjoy your PizzaPan!', icon: CircleCheckBig },
])

const now = ref(Date.parse(props.placedAt))
let timer
onMounted(() => {
  now.value = Date.now()
  timer = setInterval(() => (now.value = Date.now()), 1000)
})
onBeforeUnmount(() => clearInterval(timer))

const elapsed = computed(() => Math.max(0, (now.value - Date.parse(props.placedAt)) / 1000))
const current = computed(() => Math.min(stages.value.length - 1, Math.floor(elapsed.value / STAGE_SECONDS)))
const progress = computed(() => {
  const last = stages.value.length - 1
  if (current.value >= last) return 100
  const within = (elapsed.value % STAGE_SECONDS) / STAGE_SECONDS
  return ((current.value + within) / last) * 100
})
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h2 class="font-display text-xl font-bold">Order progress</h2>
      <span class="chip bg-gold-100 text-gold-600">Simulated status · demo timer</span>
    </div>

    <!-- Horizontal on md+, vertical on phones -->
    <div class="relative mt-6">
      <div class="absolute left-5 top-5 h-[calc(100%-2.5rem)] w-1 rounded-full bg-cream-300 md:hidden" aria-hidden="true">
        <div class="w-full rounded-full bg-gradient-to-b from-olive-500 to-gold-400 transition-all duration-1000" :style="{ height: `${progress}%` }" />
      </div>
      <div class="absolute left-[10%] right-[10%] top-5 hidden h-1 rounded-full bg-cream-300 md:block" aria-hidden="true">
        <div class="h-full rounded-full bg-gradient-to-r from-olive-500 to-gold-400 transition-all duration-1000" :style="{ width: `${progress}%` }" />
      </div>
      <ol class="relative grid gap-5 md:grid-cols-5 md:gap-3" aria-label="Order stages">
        <li v-for="(s, i) in stages" :key="s.title" class="flex items-start gap-4 md:flex-col md:items-center md:text-center" :aria-current="i === current ? 'step' : undefined">
          <span
            class="relative grid h-11 w-11 shrink-0 place-items-center rounded-full transition-all duration-500"
            :class="i < current ? 'bg-olive-500 text-white' : i === current ? 'bg-tomato-500 text-white shadow-glow' : 'bg-white text-charcoal-300 ring-1 ring-charcoal-800/10'"
          >
            <component :is="s.icon" class="h-5 w-5" aria-hidden="true" />
            <span v-if="i === current && current < stages.length - 1" class="absolute inset-0 animate-ping rounded-full bg-tomato-500/30" />
          </span>
          <span>
            <span class="block text-sm font-bold" :class="i <= current ? 'text-charcoal-800' : 'text-charcoal-400'">{{ s.title }}</span>
            <span class="block text-xs text-charcoal-400">{{ s.text }}</span>
          </span>
        </li>
      </ol>
    </div>
    <p class="sr-only" aria-live="polite">Current status: {{ stages[current].title }}</p>
  </div>
</template>
