<script setup>
import { Clock, MapPin, Phone } from 'lucide-vue-next'
</script>

<template>
  <footer class="relative mt-16 overflow-hidden bg-charcoal-800 text-cream-200">
    <div
      class="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-tomato-500/20 blur-3xl"
      aria-hidden="true"
    />
    <div class="container-pp relative grid gap-10 py-12 md:grid-cols-4">
      <div class="md:col-span-2">
        <BrandLogo light />
        <p class="mt-4 max-w-sm text-sm leading-relaxed text-cream-200/70">
          Freshly baked. Made just for you. Hand-stretched dough proofed for 48 hours and baked in our stone oven
          — a fictional bakery built as an interactive ordering demo.
        </p>
      </div>
      <div>
        <h2 class="font-sans text-xs font-bold uppercase tracking-[0.2em] text-gold-300">Visit us</h2>
        <ul class="mt-4 space-y-3 text-sm text-cream-200/80">
          <li class="flex gap-2"><MapPin class="mt-0.5 h-4 w-4 shrink-0 text-gold-400" /> 42 Flower Road, Colombo 07 (sample)</li>
          <li class="flex gap-2"><Clock class="mt-0.5 h-4 w-4 shrink-0 text-gold-400" /> Open daily 10:00 – 23:00</li>
          <li class="flex gap-2"><Phone class="mt-0.5 h-4 w-4 shrink-0 text-gold-400" /> 011 000 0000 (demo)</li>
        </ul>
      </div>
      <div>
        <h2 class="font-sans text-xs font-bold uppercase tracking-[0.2em] text-gold-300">Order</h2>
        <ul class="mt-4 space-y-2 text-sm">
          <li><NuxtLink to="/menu" class="text-cream-200/80 hover:text-gold-300">Full menu</NuxtLink></li>
          <li><NuxtLink to="/customize" class="text-cream-200/80 hover:text-gold-300">Build your own pizza</NuxtLink></li>
          <li><NuxtLink to="/menu?category=offers" class="text-cream-200/80 hover:text-gold-300">Special offers</NuxtLink></li>
          <li><NuxtLink to="/cart" class="text-cream-200/80 hover:text-gold-300">Your cart</NuxtLink></li>
        </ul>
      </div>
    </div>
    <div class="border-t border-white/10">
      <p class="container-pp py-5 text-xs text-cream-200/50">
        © 2026 PizzaPan Bakery · Frontend demo prototype. All products, prices, ratings and orders are sample data. No
        real payments or deliveries are processed.
      </p>
    </div>
  </footer>
</template>
