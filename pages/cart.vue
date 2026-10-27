<script setup>
import { ArrowLeft, ArrowRight, ChefHat, ShieldCheck, Trash2 } from 'lucide-vue-next'
import { useCartStore } from '~/stores/cart'
import { useCheckoutStore } from '~/stores/checkout'
import { useUiStore } from '~/stores/ui'

useHead({ title: 'Your Cart — PizzaPan Bakery' })

const cart = useCartStore()
const checkout = useCheckoutStore()
const ui = useUiStore()

const clearCart = () => {
  if (window.confirm('Remove all items from your cart?')) {
    cart.clear()
    ui.toast({ title: 'Cart cleared', tone: 'info' })
  }
}
</script>

<template>
  <div class="bg-dough pb-16">
    <div class="container-pp pt-6 sm:pt-10">
      <p class="eyebrow">Review your order</p>
      <h1 class="mt-1 font-display text-3xl font-bold sm:text-5xl">Your cart</h1>

      <div v-if="!ui.restored" class="mt-10 grid gap-4" aria-busy="true">
        <div v-for="n in 2" :key="n" class="card h-32 animate-pulse bg-white/60" />
      </div>

      <div v-else-if="cart.isEmpty" class="card mt-8">
        <EmptyState title="Your cart is empty" text="Nothing in the oven yet — pick a favourite from the menu or create your own pizza.">
          <NuxtLink to="/menu" class="btn-primary">Browse the menu</NuxtLink>
          <NuxtLink to="/customize" class="btn-outline"><ChefHat class="h-4 w-4" /> Build your own</NuxtLink>
        </EmptyState>
      </div>

      <div v-else class="mt-8 grid gap-6 lg:grid-cols-[1fr_380px] lg:gap-8">
        <section class="min-w-0" aria-label="Cart items">
          <div class="card overflow-hidden">
            <TransitionGroup tag="div" class="divide-y divide-charcoal-800/5" leave-active-class="transition duration-200" leave-to-class="opacity-0" move-class="transition duration-300">
              <CartItem v-for="line in cart.items" :key="line.lineId" :line="line" />
            </TransitionGroup>
          </div>
          <div class="mt-4 flex flex-wrap justify-between gap-3">
            <NuxtLink to="/menu" class="btn-outline"><ArrowLeft class="h-4 w-4" aria-hidden="true" /> Continue shopping</NuxtLink>
            <button type="button" class="btn text-charcoal-400 hover:text-tomato-500" @click="clearCart">
              <Trash2 class="h-4 w-4" aria-hidden="true" /> Clear cart
            </button>
          </div>
        </section>

        <aside class="min-w-0 lg:sticky lg:top-24 lg:self-start" aria-label="Order summary">
          <div class="card p-5 sm:p-6">
            <h2 class="font-display text-xl font-bold">Order summary</h2>
            <div class="mt-3 grid grid-cols-2 gap-1 rounded-full bg-cream-200 p-1" role="radiogroup" aria-label="Delivery or pickup">
              <button
                v-for="m in [{ id: 'delivery', label: 'Delivery' }, { id: 'pickup', label: 'Pickup' }]"
                :key="m.id"
                type="button"
                role="radio"
                :aria-checked="checkout.deliveryMethod === m.id"
                class="min-h-[40px] rounded-full text-sm font-bold transition"
                :class="checkout.deliveryMethod === m.id ? 'bg-white text-charcoal-800 shadow' : 'text-charcoal-400'"
                @click="checkout.setDeliveryMethod(m.id)"
              >
                {{ m.label }}
              </button>
            </div>
            <div class="mt-5"><CartSummary /></div>
            <NuxtLink to="/checkout" class="btn-primary mt-5 w-full py-3.5 text-base">
              Proceed to checkout <ArrowRight class="h-5 w-5" aria-hidden="true" />
            </NuxtLink>
            <p class="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-charcoal-400">
              <ShieldCheck class="h-4 w-4 text-olive-500" aria-hidden="true" /> Demo checkout — no real payment is taken.
            </p>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>
