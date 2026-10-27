<script setup>
const props = defineProps({ card: { type: Boolean, default: false } })
const messages = computed(() =>
  props.card
    ? ['Simulating secure card payment…', 'Sending your order to the demo kitchen…', 'Warming up the oven…']
    : ['Confirming your details…', 'Sending your order to the demo kitchen…', 'Warming up the oven…'],
)
const i = ref(0)
let timer
onMounted(() => (timer = setInterval(() => (i.value = (i.value + 1) % messages.value.length), 800)))
onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-[70] grid place-items-center bg-charcoal-900/80 px-6 backdrop-blur-md" role="alertdialog" aria-modal="true" aria-labelledby="placing-title" aria-busy="true">
      <div class="w-full max-w-sm rounded-[2rem] bg-cream-100 p-8 text-center shadow-2xl">
        <div class="relative mx-auto h-32 w-32">
          <div class="absolute inset-0 animate-[slow-spin_2.5s_linear_infinite]">
            <PizzaArt :toppings="['pepperoni', 'mushrooms', 'olives', 'capsicum']" label="" />
          </div>
          <div class="absolute -inset-2 rounded-full border-4 border-transparent border-t-tomato-500 animate-[slow-spin_1s_linear_infinite]" aria-hidden="true" />
        </div>
        <h2 id="placing-title" class="mt-6 font-display text-2xl font-bold">Placing your order</h2>
        <Transition name="fade" mode="out-in">
          <p :key="i" class="mt-2 text-sm text-charcoal-500" aria-live="polite">{{ messages[i] }}</p>
        </Transition>
        <p class="mt-4 text-[11px] font-semibold uppercase tracking-wider text-charcoal-300">Demo simulation — nothing is sent anywhere</p>
      </div>
    </div>
  </Teleport>
</template>
