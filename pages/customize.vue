<script setup>
import { ArrowLeft, ArrowRight, Info, Pencil, RotateCcw, ShoppingBag } from 'lucide-vue-next'
import { BUILDER_STEPS, CHEESES, CRUSTS, MAX_TOPPINGS, SAUCES, SIZES, findOption } from '~/data/pizzaOptions'
import { findProduct } from '~/data/products'
import { CUSTOM_BASE_PRICE } from '~/data/pizzaOptions'
import { defaultOptionsFor, pricingBaseFor, useCartStore } from '~/stores/cart'
import { useUiStore } from '~/stores/ui'
import { useCart } from '~/composables/useCart'
import { useTweenedNumber } from '~/composables/useReducedMotion'
import { formatLKR, pizzaPriceBreakdown } from '~/utils/pricing'

definePageMeta({ hideMobileCartBar: true })

const route = useRoute()
const router = useRouter()
const cart = useCartStore()
const ui = useUiStore()
const { addCustomPizza } = useCart()

const product = ref(findProduct('build-your-own'))
const options = reactive({ size: 'regular', crust: 'classic', sauce: 'tomato', cheese: 'mozzarella', toppings: [] })
const quantity = ref(1)
const step = ref(0)
const editingLineId = ref(null)

const isMenuPizza = computed(() => product.value?.type === 'pizza')
const included = computed(() => (isMenuPizza.value ? product.value.includedToppings : []))

function load() {
  const editId = typeof route.query.edit === 'string' ? route.query.edit : null
  if (editId) {
    if (!ui.restored) return // wait for the persisted cart
    const line = cart.lineById(editId)
    if (line && line.options) {
      editingLineId.value = line.lineId
      product.value = findProduct(line.productId)
      Object.assign(options, JSON.parse(JSON.stringify(line.options)))
      quantity.value = line.quantity
      step.value = 0
      return
    }
    ui.toast({ title: 'That cart item no longer exists', message: 'Starting a fresh pizza instead.', tone: 'info' })
    router.replace({ query: {} })
  }
  editingLineId.value = null
  const p = findProduct(route.query.product)
  product.value = p && p.type === 'pizza' ? p : findProduct('build-your-own')
  Object.assign(options, defaultOptionsFor(product.value))
  quantity.value = 1
  step.value = 0
}
load()
// Re-run when the URL changes, or once persisted state is restored while editing a cart line
watch(() => [route.query.product, route.query.edit, route.query.edit ? ui.restored : null], load)

useHead(() => ({
  title: `${editingLineId.value ? 'Edit' : isMenuPizza.value ? 'Customise' : 'Build'} ${isMenuPizza.value ? product.value.name : 'Your Own Pizza'} — PizzaPan`,
}))

const breakdown = computed(() => pizzaPriceBreakdown(options, pricingBaseFor(product.value)))
const unitPrice = computed(() => breakdown.value.total)
const total = computed(() => unitPrice.value * quantity.value)
const animatedTotal = useTweenedNumber(total)

const sizeInfo = computed(() => findOption(SIZES, options.size))
const current = computed(() => BUILDER_STEPS[step.value])
const isReview = computed(() => current.value.id === 'review')

const go = (i) => {
  step.value = Math.max(0, Math.min(BUILDER_STEPS.length - 1, i))
  if (import.meta.client && window.innerWidth < 1024) {
    document.getElementById('builder-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const reset = () => {
  Object.assign(options, defaultOptionsFor(product.value))
  quantity.value = 1
  step.value = 0
}

function submit() {
  const payload = { productId: product.value.id, options: JSON.parse(JSON.stringify(options)), quantity: quantity.value }
  if (editingLineId.value) {
    cart.updatePizza(editingLineId.value, payload)
    ui.toast({ title: 'Cart updated', message: `${product.value.type === 'builder' ? 'Custom Pizza' : product.value.name} saved.` })
    return navigateTo('/cart')
  }
  addCustomPizza(payload)
  ui.openCart()
}

const sauceColor = (id) => findOption(SAUCES, id)?.color
const summaryRows = computed(() => [
  { step: 0, label: 'Size', value: `${sizeInfo.value.name} (${sizeInfo.value.detail})` },
  { step: 1, label: 'Crust', value: findOption(CRUSTS, options.crust)?.name },
  { step: 2, label: 'Sauce', value: findOption(SAUCES, options.sauce)?.name },
  { step: 3, label: 'Cheese', value: findOption(CHEESES, options.cheese)?.name },
  { step: 4, label: 'Toppings', value: breakdown.value.toppings.map((t) => t.name).join(', ') || 'No toppings' },
])
</script>

<template>
  <div class="bg-dough pb-32 lg:pb-16">
    <div class="container-pp pt-6 sm:pt-10">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p class="eyebrow">{{ editingLineId ? 'Editing cart item' : isMenuPizza ? 'Customise your pizza' : 'Build your own pizza' }}</p>
          <h1 class="mt-1 font-display text-3xl font-bold sm:text-5xl">
            {{ isMenuPizza ? product.name : 'Your Masterpiece' }}
          </h1>
        </div>
        <div class="flex gap-2">
          <NuxtLink to="/menu" class="btn-outline"><ArrowLeft class="h-4 w-4" aria-hidden="true" /> Menu</NuxtLink>
          <button type="button" class="btn-outline" @click="reset"><RotateCcw class="h-4 w-4" aria-hidden="true" /> Reset</button>
        </div>
      </div>

      <div class="mt-6 grid gap-6 lg:mt-8 lg:grid-cols-[1.05fr_1fr] lg:gap-10">
        <!-- Live preview -->
        <div class="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <div class="relative overflow-hidden rounded-[2rem] bg-wood p-5 shadow-warm-lg sm:p-8">
            <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(252,191,73,0.25),transparent_60%)]" aria-hidden="true" />
            <div class="relative mx-auto aspect-square w-full max-w-[220px] sm:max-w-[340px] lg:max-w-[440px]">
              <div class="absolute inset-[3%] rounded-full bg-[#5a3826]/60 shadow-[inset_0_6px_20px_rgba(0,0,0,0.35)]" aria-hidden="true" />
              <div class="absolute inset-0 animate-slow-spin">
                <PizzaArt
                  v-bind="options"
                  :garnish="isMenuPizza ? product.garnish : []"
                  :scale="sizeInfo.scale"
                  animated
                  :label="`Preview: ${summaryRows.map((r) => r.value).join(', ')}`"
                />
              </div>
            </div>
            <div class="relative mt-4 flex flex-wrap items-center justify-center gap-2 text-xs font-bold text-cream-100">
              <span class="rounded-full bg-black/25 px-3 py-1">{{ sizeInfo.name }} · {{ sizeInfo.detail }}</span>
              <span class="rounded-full bg-black/25 px-3 py-1">{{ findOption(CRUSTS, options.crust)?.name }}</span>
              <span class="rounded-full bg-black/25 px-3 py-1">{{ options.toppings.length }} toppings</span>
            </div>
          </div>

          <div class="card mt-4 hidden items-center justify-between gap-4 p-5 lg:flex">
            <div>
              <p class="text-xs font-bold uppercase tracking-wide text-charcoal-400">Total · {{ quantity }} × {{ formatLKR(unitPrice) }}</p>
              <p class="font-display text-3xl font-bold text-tomato-600" aria-live="polite">{{ formatLKR(animatedTotal) }}</p>
            </div>
            <button type="button" class="btn-primary px-6 py-3.5" @click="isReview ? submit() : go(BUILDER_STEPS.length - 1)">
              <ShoppingBag class="h-5 w-5" aria-hidden="true" />
              {{ isReview ? (editingLineId ? 'Update Cart Item' : 'Add to Cart') : 'Review Pizza' }}
            </button>
          </div>
        </div>

        <!-- Steps -->
        <div id="builder-panel" class="min-w-0 scroll-mt-24">
          <BuilderStepper :steps="BUILDER_STEPS" :current="step" @go="go" />

          <div class="mt-5 min-h-[420px]">
            <Transition name="step" mode="out-in">
              <section :key="current.id" :aria-labelledby="`step-${current.id}`">
                <h2 :id="`step-${current.id}`" class="font-display text-2xl font-bold sm:text-3xl">
                  <span class="text-tomato-500">{{ step + 1 }}.</span> {{ current.id === 'review' ? 'Review customisation' : `Choose your ${current.title.toLowerCase()}` }}
                </h2>
                <p class="mt-1 text-sm text-charcoal-400">{{ current.subtitle }}</p>

                <div v-if="current.id === 'size'" class="mt-5 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Size">
                  <OptionCard v-for="o in SIZES" :key="o.id" :option="o" name="size" :selected="options.size === o.id" @select="options.size = $event">
                    <template #visual>
                      <span class="rounded-full border-4 border-[#C9823C] bg-[#FBE3A2]" :style="{ width: `${o.scale * 40}px`, height: `${o.scale * 40}px` }" />
                    </template>
                  </OptionCard>
                </div>

                <div v-else-if="current.id === 'crust'" class="mt-5 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Crust">
                  <OptionCard v-for="o in CRUSTS" :key="o.id" :option="o" name="crust" :selected="options.crust === o.id" @select="options.crust = $event">
                    <template #visual>
                      <span
                        class="h-10 w-10 rounded-full bg-[#C0302A]"
                        :style="{ borderWidth: `${{ classic: 6, thin: 3, pan: 9, 'cheese-burst': 7 }[o.id]}px`, borderColor: o.id === 'cheese-burst' ? '#F7C948' : '#C9823C' }"
                      />
                    </template>
                  </OptionCard>
                </div>

                <div v-else-if="current.id === 'sauce'" class="mt-5 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Sauce">
                  <OptionCard v-for="o in SAUCES" :key="o.id" :option="o" name="sauce" :selected="options.sauce === o.id" @select="options.sauce = $event">
                    <template #visual>
                      <span class="h-10 w-10 rounded-full border-4 border-[#E9B46A]" :style="{ background: sauceColor(o.id) }" />
                    </template>
                  </OptionCard>
                </div>

                <div v-else-if="current.id === 'cheese'" class="mt-5 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Cheese">
                  <OptionCard v-for="o in CHEESES" :key="o.id" :option="o" name="cheese" :selected="options.cheese === o.id" @select="options.cheese = $event">
                    <template #visual>
                      <span class="flex flex-wrap justify-center gap-0.5 p-1.5">
                        <span v-for="n in Math.round(o.coverage * 3)" :key="n" class="h-3.5 w-3.5 rounded-full" :class="o.id === 'vegan' ? 'bg-[#F6EED6] ring-1 ring-[#e5d8b5]' : 'bg-[#F9D77E]'" />
                      </span>
                    </template>
                  </OptionCard>
                </div>

                <div v-else-if="current.id === 'toppings'" class="mt-5">
                  <ToppingPicker v-model="options.toppings" :included="included" />
                </div>

                <div v-else class="mt-5 space-y-4">
                  <ul class="card divide-y divide-charcoal-800/5">
                    <li v-for="row in summaryRows" :key="row.label" class="flex items-center gap-3 px-5 py-3.5">
                      <span class="w-20 shrink-0 text-xs font-bold uppercase tracking-wide text-charcoal-400">{{ row.label }}</span>
                      <span class="flex-1 text-sm font-semibold text-charcoal-800">{{ row.value }}</span>
                      <button type="button" class="grid h-9 w-9 place-items-center rounded-full text-charcoal-400 hover:bg-cream-200 hover:text-tomato-500" :aria-label="`Change ${row.label.toLowerCase()}`" @click="go(row.step)">
                        <Pencil class="h-4 w-4" />
                      </button>
                    </li>
                  </ul>

                  <div class="card p-5">
                    <h3 class="font-sans text-sm font-bold uppercase tracking-wide text-charcoal-400">Price breakdown</h3>
                    <dl class="mt-3 space-y-1.5 text-sm">
                      <div v-for="(l, i) in breakdown.lines" :key="i" class="flex justify-between gap-4">
                        <dt class="text-charcoal-500">{{ l.label }}</dt>
                        <dd class="font-semibold tabular-nums" :class="l.amount ? 'text-charcoal-800' : 'text-charcoal-300'">{{ l.amount ? formatLKR(l.amount) : '—' }}</dd>
                      </div>
                      <div class="flex justify-between gap-4 border-t border-dashed border-charcoal-800/10 pt-2 text-base">
                        <dt class="font-bold">Per pizza</dt>
                        <dd class="font-bold tabular-nums">{{ formatLKR(unitPrice) }}</dd>
                      </div>
                    </dl>
                    <div class="mt-5 flex flex-wrap items-center justify-between gap-4">
                      <div class="flex items-center gap-3">
                        <span class="text-sm font-bold">Quantity</span>
                        <QuantityStepper v-model="quantity" label="Pizza quantity" />
                      </div>
                      <p class="font-display text-2xl font-bold text-tomato-600">{{ formatLKR(animatedTotal) }}</p>
                    </div>
                    <button type="button" class="btn-primary mt-5 w-full py-3.5 text-base" @click="submit">
                      <ShoppingBag class="h-5 w-5" aria-hidden="true" />
                      {{ editingLineId ? 'Update Cart Item' : 'Add Custom Pizza to Cart' }}
                    </button>
                  </div>
                </div>
              </section>
            </Transition>
          </div>

          <div class="mt-6 hidden items-center justify-between gap-3 lg:flex">
            <button type="button" class="btn-outline" :disabled="step === 0" @click="go(step - 1)">
              <ArrowLeft class="h-4 w-4" aria-hidden="true" /> Back
            </button>
            <button v-if="!isReview" type="button" class="btn-dark" @click="go(step + 1)">
              Next: {{ BUILDER_STEPS[step + 1].title }} <ArrowRight class="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <details class="mt-6 rounded-2xl bg-white/70 p-4 text-sm text-charcoal-500">
            <summary class="flex cursor-pointer list-none items-center gap-2 font-bold text-charcoal-700">
              <Info class="h-4 w-4 text-ember-500" aria-hidden="true" /> How pricing works (demo rules)
            </summary>
            <ul class="mt-3 list-disc space-y-1 pl-5">
              <li>Build Your Own starts at {{ formatLKR(CUSTOM_BASE_PRICE) }}; menu pizzas start at their Regular price.</li>
              <li>Sizes add: Medium +{{ formatLKR(700) }}, Large +{{ formatLKR(1300) }}, Family +{{ formatLKR(2100) }}.</li>
              <li>Pan crust +{{ formatLKR(250) }}, Cheese Burst +{{ formatLKR(550) }}; premium sauces and cheeses as listed.</li>
              <li>Each topping is charged individually (up to {{ MAX_TOPPINGS }}). A menu pizza’s signature toppings are included.</li>
            </ul>
          </details>
        </div>
      </div>
    </div>

    <!-- Mobile / tablet action bar -->
    <div class="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-charcoal-800/10 bg-cream-50/95 backdrop-blur-xl lg:hidden">
      <div class="container-pp flex items-center gap-3 py-3">
        <button v-if="step > 0" type="button" class="btn-icon shrink-0 border border-charcoal-800/10 bg-white" aria-label="Previous step" @click="go(step - 1)">
          <ArrowLeft class="h-5 w-5" />
        </button>
        <div class="min-w-0 flex-1">
          <p class="truncate text-[11px] font-bold uppercase tracking-wide text-charcoal-400">{{ quantity }} × {{ sizeInfo.name }} pizza</p>
          <p class="font-display text-xl font-bold text-tomato-600" aria-live="polite">{{ formatLKR(animatedTotal) }}</p>
        </div>
        <button v-if="!isReview" type="button" class="btn-dark shrink-0" @click="go(step + 1)">
          {{ BUILDER_STEPS[step + 1].title }} <ArrowRight class="h-4 w-4" aria-hidden="true" />
        </button>
        <button v-else type="button" class="btn-primary shrink-0" @click="submit">
          <ShoppingBag class="h-4 w-4" aria-hidden="true" /> {{ editingLineId ? 'Update' : 'Add to Cart' }}
        </button>
      </div>
    </div>
  </div>
</template>
