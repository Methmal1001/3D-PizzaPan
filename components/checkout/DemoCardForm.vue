<script setup>
// A purely visual, simulated card form. Fields are pre-filled with a well-known TEST number and are
// read-only, so the demo never asks for (or stores) real card information.
import { Lock, TriangleAlert } from 'lucide-vue-next'
import { useCartStore } from '~/stores/cart'
import { formatLKR } from '~/utils/pricing'

const cart = useCartStore()
const DEMO = { number: '4242 4242 4242 4242', name: 'DEMO CUSTOMER', expiry: '12/30', cvc: '•••' }
</script>

<template>
  <div class="overflow-hidden rounded-3xl bg-white shadow-sm">
    <div class="flex items-start gap-2 bg-gold-100 px-5 py-3 text-xs font-semibold text-charcoal-700" role="note">
      <TriangleAlert class="mt-0.5 h-4 w-4 shrink-0 text-gold-600" aria-hidden="true" />
      Demo payment flow — no real transaction will occur. Never enter real card details; this form uses a fixed test card and cannot be edited.
    </div>
    <div class="grid gap-5 p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-center">
      <!-- card visual -->
      <div class="relative aspect-[1.6] w-full max-w-[340px] overflow-hidden rounded-2xl bg-gradient-to-br from-charcoal-700 via-charcoal-800 to-tomato-800 p-5 text-cream-100 shadow-warm-lg">
        <div class="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-tomato-500/30 blur-2xl" aria-hidden="true" />
        <div class="relative flex h-full flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="h-8 w-11 rounded-md bg-gradient-to-br from-gold-200 to-gold-500" aria-hidden="true" />
            <span class="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-extrabold tracking-[0.2em]">DEMO</span>
          </div>
          <p class="font-mono text-lg tracking-[0.12em] sm:text-xl">{{ DEMO.number }}</p>
          <div class="flex justify-between text-[11px] uppercase tracking-wider text-cream-200/80">
            <span>{{ DEMO.name }}</span><span>{{ DEMO.expiry }}</span>
          </div>
        </div>
      </div>
      <!-- read-only fields -->
      <div class="grid grid-cols-2 gap-3">
        <div class="col-span-2">
          <label for="demo-card-number" class="label">Card number (test)</label>
          <input id="demo-card-number" :value="DEMO.number" readonly class="input bg-cream-100 font-mono text-charcoal-500" aria-readonly="true" />
        </div>
        <div>
          <label for="demo-card-exp" class="label">Expiry</label>
          <input id="demo-card-exp" :value="DEMO.expiry" readonly class="input bg-cream-100 font-mono text-charcoal-500" aria-readonly="true" />
        </div>
        <div>
          <label for="demo-card-cvc" class="label">CVC</label>
          <input id="demo-card-cvc" :value="DEMO.cvc" readonly class="input bg-cream-100 font-mono text-charcoal-500" aria-readonly="true" />
        </div>
        <p class="col-span-2 flex items-center gap-1.5 text-xs text-charcoal-400">
          <Lock class="h-3.5 w-3.5" aria-hidden="true" /> Simulated charge: <strong class="text-charcoal-700">{{ formatLKR(cart.total) }}</strong>
        </p>
      </div>
    </div>
  </div>
</template>
