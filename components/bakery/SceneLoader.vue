<script setup>
defineProps({
  progress: { type: Number, default: 0 },
  message: { type: String, default: 'Firing up the oven…' },
})
</script>

<template>
  <div class="absolute inset-0 z-10 grid place-items-center bg-charcoal-900" role="status" aria-live="polite">
    <div
      class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(247,127,0,0.22),transparent_60%)]"
      aria-hidden="true"
    />
    <div class="relative flex flex-col items-center px-6 text-center">
      <div class="relative h-28 w-28">
        <div class="absolute inset-0 animate-[slow-spin_6s_linear_infinite]">
          <PizzaArt :toppings="['pepperoni', 'olives', 'mushrooms']" label="" />
        </div>
        <div class="absolute -inset-3 rounded-full border-2 border-dashed border-gold-400/40" aria-hidden="true" />
      </div>
      <p class="mt-8 font-display text-2xl font-semibold text-cream-100">{{ message }}</p>
      <p class="mt-2 text-sm text-cream-200/60">Building the bakery in 3D — this only takes a moment.</p>
      <div class="mt-6 h-1.5 w-56 overflow-hidden rounded-full bg-white/10">
        <div
          class="h-full rounded-full bg-gradient-to-r from-tomato-500 via-ember-500 to-gold-400 transition-[width] duration-500"
          :style="{ width: `${Math.max(6, progress)}%` }"
        />
      </div>
      <span class="sr-only">{{ progress }} percent loaded</span>
    </div>
  </div>
</template>
