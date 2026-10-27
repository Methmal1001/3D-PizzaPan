<script setup>
const props = defineProps({ error: { type: Object, required: true } })
const is404 = computed(() => props.error?.statusCode === 404)
useHead({ title: is404.value ? 'Page not found — PizzaPan' : 'Something went wrong — PizzaPan' })
const home = () => clearError({ redirect: '/' })
const menu = () => clearError({ redirect: '/menu' })
</script>

<template>
  <div class="grid min-h-screen place-items-center bg-dough px-6 text-center">
    <div class="max-w-md">
      <div class="mx-auto h-40 w-40 opacity-90">
        <PizzaArt :toppings="['olives', 'mushrooms']" label="" />
      </div>
      <p class="eyebrow mt-6">{{ error.statusCode || 'Error' }}</p>
      <h1 class="mt-2 font-display text-4xl font-bold">{{ is404 ? 'This slice is missing' : 'The oven hiccupped' }}</h1>
      <p class="mt-3 text-charcoal-400">
        {{ is404 ? 'We couldn’t find that page. It may have been eaten.' : 'Something went wrong. Please try again — your cart is safe.' }}
      </p>
      <div class="mt-6 flex flex-wrap justify-center gap-3">
        <button type="button" class="btn-primary" @click="menu">Go to the menu</button>
        <button type="button" class="btn-outline" @click="home">Back to the bakery</button>
      </div>
    </div>
  </div>
</template>
