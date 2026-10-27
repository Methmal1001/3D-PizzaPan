<script setup>
// Layered, procedurally generated SVG pizza. Deterministic (seeded) so SSR & client match.
// Used for menu product images and the live "Build Your Own" preview.
import { SAUCES, findOption } from '~/data/pizzaOptions'
import { scatter } from '~/utils/seeded'

const props = defineProps({
  sauce: { type: String, default: 'tomato' },
  cheese: { type: String, default: 'mozzarella' },
  crust: { type: String, default: 'classic' },
  toppings: { type: Array, default: () => [] },
  garnish: { type: Array, default: () => [] },
  scale: { type: Number, default: 1 },
  /** Animate toppings dropping on/off (builder preview) */
  animated: { type: Boolean, default: false },
  label: { type: String, default: 'Pizza illustration' },
})

const uid = useId()

const CRUST = {
  classic: { width: 13, inner: '#F1C27D', outer: '#C9823C', edge: '#A9642B' },
  thin: { width: 7, inner: '#F3D193', outer: '#D69A52', edge: '#B67835' },
  pan: { width: 17, inner: '#E7AE62', outer: '#B8702F', edge: '#8E5220' },
  'cheese-burst': { width: 15, inner: '#F2C47F', outer: '#C9823C', edge: '#A9642B' },
}

const COUNTS = {
  pepperoni: 9,
  chicken: 9,
  sausage: 10,
  mushrooms: 8,
  onions: 8,
  capsicum: 8,
  olives: 10,
  jalapenos: 9,
  pineapple: 8,
  'extra-cheese': 9,
  basil: 6,
  prawns: 6,
  chili: 18,
  tomato: 6,
  paneer: 8,
  corn: 16,
  tandoori: 8,
}

const crust = computed(() => CRUST[props.crust] || CRUST.classic)
const sauceR = computed(() => 100 - crust.value.width)
const sauceColor = computed(() => findOption(SAUCES, props.sauce)?.color || '#C0302A')
const isCreamy = computed(() => props.sauce === 'garlic')

const cheeseColor = computed(() => (props.cheese === 'vegan' ? '#F6EED6' : props.cheese === 'double' ? '#F9D77E' : '#FBE3A2'))
const cheeseBlobs = computed(() => {
  const coverage = { mozzarella: 17, extra: 24, double: 30, vegan: 17 }[props.cheese] || 22
  return scatter(coverage, sauceR.value - 12, `cheese-${props.cheese}`, 0.6)
})
const browned = computed(() => scatter(14, sauceR.value - 14, 'browned', 0.8))
const rimSpots = computed(() => {
  const n = 22
  const r = 100 - crust.value.width / 2
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 + (i % 3) * 0.13
    return { x: +(r * Math.cos(a)).toFixed(1), y: +(r * Math.sin(a)).toFixed(1), r: 1.2 + (i % 4) * 0.5 }
  })
})
const burstDrips = computed(() =>
  Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * Math.PI * 2 + 0.2
    const r = 100 - crust.value.width * 0.55
    return { x: +(r * Math.cos(a)).toFixed(1), y: +(r * Math.sin(a)).toFixed(1), rot: Math.round((a * 180) / Math.PI) }
  }),
)

const layers = computed(() =>
  [...props.toppings, ...props.garnish].map((type) => ({
    type,
    pieces: scatter(COUNTS[type] || 8, sauceR.value - 16, `t-${type}`),
  })),
)

// GSAP drop-in / lift-off for the builder preview (client only, respects reduced motion)
let gsapRef = null
const loadGsap = async () => (gsapRef ||= (await import('gsap')).gsap)
const reduced = () => import.meta.client && window.matchMedia('(prefers-reduced-motion: reduce)').matches

async function onEnter(el, done) {
  if (!props.animated || reduced()) return done()
  const gsap = await loadGsap()
  gsap.from(el.children, {
    y: -70,
    scale: 1.7,
    opacity: 0,
    duration: 0.55,
    ease: 'bounce.out',
    stagger: 0.03,
    transformOrigin: 'center center',
    onComplete: done,
  })
}
async function onLeave(el, done) {
  if (!props.animated || reduced()) return done()
  const gsap = await loadGsap()
  gsap.to(el.children, { scale: 0.3, opacity: 0, duration: 0.3, stagger: 0.015, ease: 'power2.in', onComplete: done })
}
</script>

<template>
  <svg viewBox="-112 -112 224 224" role="img" :aria-label="label" class="h-full w-full overflow-visible">
    <defs>
      <radialGradient :id="`${uid}-crust`" cx="50%" cy="45%" r="55%">
        <stop offset="80%" :stop-color="crust.inner" />
        <stop offset="93%" :stop-color="crust.outer" />
        <stop offset="100%" :stop-color="crust.edge" />
      </radialGradient>
      <radialGradient :id="`${uid}-sauce`" cx="50%" cy="50%" r="50%">
        <stop offset="70%" :stop-color="sauceColor" />
        <stop offset="100%" :stop-color="isCreamy ? '#D9BE8C' : '#7E1C17'" />
      </radialGradient>
      <radialGradient :id="`${uid}-shine`" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stop-color="#fff" stop-opacity="0.28" />
        <stop offset="60%" stop-color="#fff" stop-opacity="0" />
      </radialGradient>
    </defs>

    <g class="pizza-scale" :style="{ transform: `scale(${scale})` }">
      <!-- shadow -->
      <ellipse cx="4" cy="10" rx="104" ry="102" fill="#000" opacity="0.18" />

      <!-- crust -->
      <circle r="100" :fill="`url(#${uid}-crust)`" class="transition-all duration-500" />
      <circle
        v-for="(s, i) in rimSpots"
        :key="`rim-${i}`"
        :cx="s.x"
        :cy="s.y"
        :r="s.r"
        fill="#7A4318"
        opacity="0.35"
      />

      <!-- sauce -->
      <circle :r="sauceR" :fill="`url(#${uid}-sauce)`" class="sauce-layer" />

      <!-- cheese -->
      <g>
        <circle :r="sauceR - 6" :fill="cheeseColor" :opacity="isCreamy ? 0.35 : 0.22" />
        <ellipse
          v-for="(b, i) in cheeseBlobs"
          :key="`ch-${cheese}-${i}`"
          :cx="b.x"
          :cy="b.y"
          :rx="10.5 * b.s"
          :ry="7.5 * b.s"
          :transform="`rotate(${b.rot} ${b.x} ${b.y})`"
          :fill="cheeseColor"
          opacity="0.82"
        />
        <circle
          v-for="(b, i) in browned"
          :key="`br-${i}`"
          :cx="b.x"
          :cy="b.y"
          :r="2.4 * b.s"
          fill="#D9963F"
          opacity="0.55"
        />
      </g>

      <!-- cheese-burst ooze on the rim -->
      <g v-if="crust && props.crust === 'cheese-burst'">
        <ellipse
          v-for="(d, i) in burstDrips"
          :key="`drip-${i}`"
          :cx="d.x"
          :cy="d.y"
          rx="7"
          ry="4"
          :transform="`rotate(${d.rot} ${d.x} ${d.y})`"
          fill="#FCD583"
          stroke="#F0B94A"
          stroke-width="1"
        />
      </g>

      <!-- toppings -->
      <TransitionGroup tag="g" :css="false" @enter="onEnter" @leave="onLeave">
        <g v-for="layer in layers" :key="layer.type" :data-topping="layer.type">
          <g
            v-for="(p, i) in layer.pieces"
            :key="i"
            :transform="`translate(${p.x} ${p.y}) rotate(${p.rot}) scale(${p.s})`"
          >
            <g v-if="layer.type === 'pepperoni'">
              <circle r="9" fill="#A61E22" />
              <circle r="7.6" fill="#C8352F" />
              <circle cx="-2.5" cy="-1.5" r="1.1" fill="#8E1B1F" />
              <circle cx="2.4" cy="1.8" r="1" fill="#8E1B1F" />
              <circle cx="1.6" cy="-3.2" r="0.8" fill="#8E1B1F" />
              <path d="M-5 -4 A7 7 0 0 1 2 -6.5" stroke="#fff" stroke-opacity=".35" stroke-width="1.2" fill="none" />
            </g>
            <g v-else-if="layer.type === 'chicken' || layer.type === 'tandoori'">
              <path
                d="M-7 -3 Q-6 -7 -1 -6 Q5 -8 7 -3 Q8 3 3 5 Q-3 7 -6 3 Z"
                :fill="layer.type === 'tandoori' ? '#D7642A' : '#ECCB9B'"
                :stroke="layer.type === 'tandoori' ? '#A3401A' : '#C69760'"
                stroke-width="1"
              />
              <path d="M-4 -2 L3 -4 M-3 2 L4 0" :stroke="layer.type === 'tandoori' ? '#7A2A10' : '#8A5A33'" stroke-width="1.1" opacity=".6" />
            </g>
            <g v-else-if="layer.type === 'sausage'">
              <circle r="6.4" fill="#7E3F27" />
              <circle r="5.2" fill="#9A5134" />
              <circle cx="-1.8" cy="-1" r="0.9" fill="#D19678" />
              <circle cx="1.6" cy="1.6" r="0.8" fill="#D19678" />
              <circle cx="1.8" cy="-2" r="0.6" fill="#D19678" />
            </g>
            <g v-else-if="layer.type === 'mushrooms'">
              <path
                d="M-8 0 Q-8 -8 0 -8 Q8 -8 8 0 Q5 1 3 1 L3 7 Q0 8.5 -3 7 L-3 1 Q-5 1 -8 0 Z"
                fill="#E3CFB2"
                stroke="#8C6B4F"
                stroke-width="1.2"
              />
              <path d="M-5 -2 Q0 -5 5 -2" stroke="#B49474" stroke-width="1" fill="none" />
            </g>
            <g v-else-if="layer.type === 'onions'">
              <path d="M-8 3 A8.5 8.5 0 0 1 7 -4" stroke="#B37AA3" stroke-width="2.4" fill="none" stroke-linecap="round" />
              <path d="M-5 4 A6 6 0 0 1 5 -2" stroke="#E2C5DA" stroke-width="1.4" fill="none" stroke-linecap="round" />
            </g>
            <g v-else-if="layer.type === 'capsicum'">
              <path d="M-7 2 Q-8 -7 0 -7 Q8 -7 7 2" stroke="#2F8A3A" stroke-width="3.2" fill="none" stroke-linecap="round" />
              <path d="M-5 1 Q-5.5 -4.5 0 -4.6" stroke="#6CC067" stroke-width="1" fill="none" opacity=".7" />
            </g>
            <g v-else-if="layer.type === 'olives'">
              <circle r="4.6" fill="none" stroke="#2A2320" stroke-width="3.2" />
              <circle r="4.6" fill="none" stroke="#5B4B44" stroke-width="0.8" opacity=".6" />
            </g>
            <g v-else-if="layer.type === 'jalapenos'">
              <circle r="5.6" fill="#4F8F28" />
              <circle r="3.8" fill="#C8E29A" />
              <circle cx="-1.3" cy="-0.5" r="0.8" fill="#F4F0D6" />
              <circle cx="1.2" cy="0.9" r="0.8" fill="#F4F0D6" />
              <circle cx="0.3" cy="-1.8" r="0.7" fill="#F4F0D6" />
            </g>
            <g v-else-if="layer.type === 'pineapple'">
              <path d="M-6 -5 L6 -5 L4 6 L-4 6 Z" fill="#F7D04E" stroke="#D9A42A" stroke-width="1.1" stroke-linejoin="round" />
              <path d="M-3 -3 L-2 4 M1 -3 L1 4" stroke="#E9B934" stroke-width="0.9" />
            </g>
            <g v-else-if="layer.type === 'extra-cheese'">
              <ellipse rx="8" ry="5.5" fill="#FFF4C8" stroke="#F0D17A" stroke-width="1" />
              <ellipse cx="-2" cy="-1.5" rx="3" ry="1.5" fill="#fff" opacity=".7" />
            </g>
            <g v-else-if="layer.type === 'basil'">
              <path d="M0 -9 Q8 -3 0 9 Q-8 -3 0 -9 Z" fill="#3E7B2B" />
              <path d="M0 -7 L0 7" stroke="#6BAE4A" stroke-width="0.9" />
            </g>
            <g v-else-if="layer.type === 'prawns'">
              <path d="M-6 -6 Q8 -8 7 3 Q5 9 -3 6" stroke="#F08A5D" stroke-width="5.5" fill="none" stroke-linecap="round" />
              <path d="M2 -6 L2 -2 M6 -1 L2 0 M4 5 L1 2" stroke="#FFD2B8" stroke-width="1.1" />
            </g>
            <g v-else-if="layer.type === 'chili'">
              <rect x="-2" y="-1" width="4" height="2" rx="0.6" fill="#D21F1F" />
            </g>
            <g v-else-if="layer.type === 'tomato'">
              <circle r="6.8" fill="#C92A22" />
              <circle r="5.4" fill="#EE5A3F" />
              <circle cx="-1.8" cy="0" r="1" fill="#F7C9A0" />
              <circle cx="1.8" cy="0" r="1" fill="#F7C9A0" />
            </g>
            <g v-else-if="layer.type === 'paneer'">
              <rect x="-5" y="-5" width="10" height="10" rx="2" fill="#F8EEDA" stroke="#D3B07F" stroke-width="1" />
              <path d="M-5 3 L-3 5 L-5 5 Z M3 -5 L5 -5 L5 -3 Z" fill="#9B5E2E" />
            </g>
            <g v-else-if="layer.type === 'corn'">
              <circle r="2.6" fill="#F7C631" stroke="#E0A817" stroke-width=".6" />
            </g>
          </g>
        </g>
      </TransitionGroup>

      <!-- glossy highlight -->
      <circle r="100" :fill="`url(#${uid}-shine)`" pointer-events="none" />
    </g>
  </svg>
</template>

<style scoped>
.pizza-scale {
  transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.sauce-layer {
  transition: fill 0.4s ease;
}
</style>
