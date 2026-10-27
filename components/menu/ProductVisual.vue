<script setup>
// Local, CSS/SVG-based product imagery — no external image hosts required.
import { ChefHat } from 'lucide-vue-next'

const props = defineProps({
  product: { type: Object, required: true },
  /** Override pizza options (e.g. a customised cart line) */
  options: { type: Object, default: null },
  size: { type: String, default: 'md' }, // 'sm' | 'md' | 'lg'
})

const isPizza = computed(() => props.product.type === 'pizza' || props.product.type === 'builder' || props.options)
const pizzaProps = computed(() => {
  const p = props.product
  const o = props.options
  if (p.type === 'builder' && !o) {
    return { sauce: 'tomato', cheese: 'mozzarella', crust: 'classic', toppings: ['mushrooms', 'capsicum', 'pepperoni'], garnish: [] }
  }
  return {
    sauce: o?.sauce || p.defaultSauce || 'tomato',
    cheese: o?.cheese || p.defaultCheese || 'mozzarella',
    crust: o?.crust || p.defaultCrust || 'classic',
    toppings: o?.toppings || p.includedToppings || [],
    garnish: p.garnish || [],
  }
})
const kind = computed(() => props.product.visual)
const combo = computed(() => ['combo', 'duo', 'lunch'].includes(kind.value))
</script>

<template>
  <div class="relative h-full w-full">
    <!-- Pizza -->
    <div v-if="isPizza" class="absolute inset-[6%]">
      <PizzaArt v-bind="pizzaProps" :label="product.name" />
      <span
        v-if="product.type === 'builder' && !options && size !== 'sm'"
        class="absolute -right-1 -top-1 grid h-12 w-12 place-items-center rounded-full bg-charcoal-800 text-gold-300 shadow-warm"
      >
        <ChefHat class="h-6 w-6" aria-hidden="true" />
      </span>
    </div>

    <!-- Combos: composed from smaller visuals -->
    <div v-else-if="combo" class="absolute inset-0" role="img" :aria-label="product.name">
      <div class="absolute left-[4%] top-[10%] h-[64%] w-[64%]">
        <PizzaArt :toppings="['pepperoni', 'olives']" :garnish="[]" label="" />
      </div>
      <div v-if="kind === 'combo'" class="absolute right-[2%] top-[4%] h-[52%] w-[52%]">
        <PizzaArt :toppings="['chicken', 'onions', 'capsicum']" sauce="bbq" label="" />
      </div>
      <div class="absolute bottom-[2%] right-[22%] h-[44%] w-[44%]">
        <ProductVisual :product="{ visual: kind === 'duo' ? 'lava-cake' : kind === 'lunch' ? 'wedges' : 'garlic-bread', type: 'item' }" size="sm" />
      </div>
      <div class="absolute bottom-[4%] right-[0%] h-[50%] w-[26%]">
        <ProductVisual :product="{ visual: kind === 'duo' ? 'lime' : 'cola', type: 'item' }" size="sm" />
      </div>
    </div>

    <!-- Other items -->
    <svg v-else viewBox="0 0 200 200" class="h-full w-full" role="img" :aria-label="product.name || 'Menu item'">
      <!-- Garlic bread & cheesy garlic bread -->
      <g v-if="kind === 'garlic-bread' || kind === 'cheesy-garlic-bread'">
        <ellipse cx="100" cy="150" rx="88" ry="26" fill="#000" opacity=".14" />
        <rect x="14" y="70" width="172" height="80" rx="20" fill="#8A5A3B" />
        <rect x="14" y="64" width="172" height="80" rx="20" fill="#A8714A" />
        <path d="M30 80 H170 M30 100 H170 M30 120 H170" stroke="#93603E" stroke-width="2" opacity=".5" />
        <g v-for="(x, i) in [52, 84, 116, 148]" :key="i" :transform="`rotate(${-12 + i * 3} ${x} 100)`">
          <ellipse :cx="x" cy="100" rx="20" ry="34" fill="#C77F35" />
          <ellipse :cx="x" cy="98" rx="16" ry="29" fill="#F3CF86" />
          <ellipse :cx="x - 3" cy="92" rx="9" ry="14" fill="#F9E3AE" opacity=".8" />
          <template v-if="kind === 'cheesy-garlic-bread'">
            <ellipse :cx="x + 2" cy="104" rx="13" ry="19" fill="#FCD583" opacity=".95" />
            <circle :cx="x - 4" cy="96" r="3" fill="#E9A23B" opacity=".6" />
            <rect :x="x + 3" y="94" width="3" height="1.6" fill="#D21F1F" />
            <rect :x="x - 6" y="110" width="3" height="1.6" fill="#D21F1F" />
          </template>
          <circle :cx="x - 5" cy="88" r="1.6" fill="#3E7B2B" />
          <circle :cx="x + 6" cy="104" r="1.4" fill="#3E7B2B" />
          <circle :cx="x - 2" cy="116" r="1.3" fill="#3E7B2B" />
        </g>
      </g>

      <!-- Breadsticks -->
      <g v-else-if="kind === 'breadsticks'">
        <ellipse cx="100" cy="160" rx="84" ry="20" fill="#000" opacity=".14" />
        <circle cx="100" cy="112" r="78" fill="#F4E8D4" stroke="#E2D2B8" stroke-width="3" />
        <g v-for="i in 6" :key="i" :transform="`rotate(${-40 + i * 13} 100 150)`">
          <rect x="91" y="40" width="18" height="100" rx="9" fill="#C9863E" />
          <rect x="94" y="44" width="12" height="92" rx="6" fill="#EDBB6C" />
          <rect x="96" y="60" width="8" height="40" rx="4" fill="#FCE3A2" opacity=".9" />
        </g>
        <circle cx="152" cy="150" r="20" fill="#fff" stroke="#E6DCCB" stroke-width="2" />
        <circle cx="152" cy="150" r="15" fill="#B5281F" />
        <circle cx="147" cy="146" r="4" fill="#D9473B" />
      </g>

      <!-- Wings -->
      <g v-else-if="kind === 'wings'">
        <ellipse cx="100" cy="165" rx="84" ry="18" fill="#000" opacity=".14" />
        <circle cx="100" cy="110" r="82" fill="#FBF6EE" stroke="#E8DCC8" stroke-width="3" />
        <circle cx="100" cy="110" r="66" fill="none" stroke="#EFE4D3" stroke-width="2" />
        <g v-for="(w, i) in [[70, 86, -20], [112, 76, 25], [138, 112, 70], [74, 128, -60], [110, 140, 15], [92, 106, 40]]" :key="i" :transform="`rotate(${w[2]} ${w[0]} ${w[1]})`">
          <ellipse :cx="w[0]" :cy="w[1]" rx="21" ry="13" fill="#9E3014" />
          <ellipse :cx="w[0] - 2" :cy="w[1] - 2" rx="17" ry="9.5" fill="#C9461E" />
          <ellipse :cx="w[0] - 6" :cy="w[1] - 5" rx="6" ry="2.5" fill="#F08A5D" opacity=".7" />
          <circle :cx="w[0] + 5" :cy="w[1]" r="1" fill="#FFF4D6" />
          <circle :cx="w[0] - 3" :cy="w[1] + 3" r="1" fill="#FFF4D6" />
        </g>
        <circle cx="150" cy="58" r="17" fill="#fff" stroke="#E6DCCB" stroke-width="2" />
        <circle cx="150" cy="58" r="12" fill="#F3EEDF" />
        <circle cx="146" cy="55" r="1.4" fill="#3E7B2B" />
        <circle cx="153" cy="60" r="1.2" fill="#3E7B2B" />
      </g>

      <!-- Wedges -->
      <g v-else-if="kind === 'wedges'">
        <ellipse cx="100" cy="168" rx="70" ry="14" fill="#000" opacity=".15" />
        <path d="M40 90 L160 90 L146 166 L54 166 Z" fill="#D62828" />
        <path d="M40 90 L160 90 L157 104 L43 104 Z" fill="#B81F21" />
        <path d="M70 96 L76 166 M100 96 L100 166 M130 96 L124 166" stroke="#FFF8ED" stroke-width="4" opacity=".9" />
        <g v-for="(w, i) in [[60, 82, -25], [80, 70, -10], [100, 64, 5], [122, 70, 18], [142, 82, 30], [90, 80, -5], [112, 80, 10]]" :key="i" :transform="`rotate(${w[2]} ${w[0]} ${w[1]})`">
          <path :d="`M${w[0] - 8} ${w[1] + 26} L${w[0]} ${w[1] - 26} L${w[0] + 9} ${w[1] + 26} Z`" fill="#C57A2C" />
          <path :d="`M${w[0] - 5} ${w[1] + 24} L${w[0]} ${w[1] - 20} L${w[0] + 5} ${w[1] + 24} Z`" fill="#F2C46A" />
          <circle :cx="w[0]" :cy="w[1]" r="1" fill="#B22A1A" />
        </g>
      </g>

      <!-- Lava cake -->
      <g v-else-if="kind === 'lava-cake'">
        <ellipse cx="100" cy="160" rx="86" ry="20" fill="#000" opacity=".14" />
        <ellipse cx="100" cy="140" rx="84" ry="34" fill="#FBF6EE" stroke="#E8DCC8" stroke-width="3" />
        <path d="M100 136 Q140 140 152 152 Q130 160 100 156 Z" fill="#3B1A10" />
        <path d="M58 70 L58 130 Q100 150 142 130 L142 70 Z" fill="#3A1C12" />
        <ellipse cx="100" cy="70" rx="42" ry="15" fill="#5A2C1B" />
        <path d="M98 74 Q104 100 120 112 Q132 122 146 132 Q120 140 104 118 Q94 100 98 74 Z" fill="#2A0F08" />
        <path d="M100 76 Q108 100 124 114" stroke="#7A3A22" stroke-width="2" fill="none" opacity=".7" />
        <g fill="#FFFFFF" opacity=".85">
          <circle cx="80" cy="66" r="1.6" /><circle cx="92" cy="72" r="1.2" /><circle cx="112" cy="64" r="1.5" />
          <circle cx="122" cy="72" r="1.1" /><circle cx="86" cy="76" r="1" /><circle cx="104" cy="68" r="1.3" />
        </g>
        <path d="M128 58 Q138 48 146 54 Q138 62 128 58 Z" fill="#3E7B2B" />
        <circle cx="74" cy="148" r="7" fill="#D62828" />
        <circle cx="72" cy="146" r="2" fill="#F3B0AA" />
      </g>

      <!-- Cinnamon knots -->
      <g v-else-if="kind === 'knots'">
        <ellipse cx="100" cy="165" rx="84" ry="18" fill="#000" opacity=".14" />
        <circle cx="100" cy="110" r="82" fill="#FBF6EE" stroke="#E8DCC8" stroke-width="3" />
        <g v-for="(k, i) in [[70, 90], [118, 82], [140, 124], [92, 136], [100, 108]]" :key="i">
          <circle :cx="k[0]" :cy="k[1]" r="19" fill="#B66A2A" />
          <circle :cx="k[0]" :cy="k[1]" r="15" fill="#D99550" />
          <path :d="`M${k[0] - 10} ${k[1]} Q${k[0]} ${k[1] - 14} ${k[0] + 10} ${k[1]} Q${k[0]} ${k[1] + 12} ${k[0] - 6} ${k[1] + 2}`" stroke="#8A4A1C" stroke-width="2.5" fill="none" />
          <circle :cx="k[0] - 5" :cy="k[1] - 6" r="1.2" fill="#FFF3DA" />
          <circle :cx="k[0] + 6" :cy="k[1] + 5" r="1.2" fill="#FFF3DA" />
        </g>
        <circle cx="152" cy="62" r="18" fill="#fff" stroke="#E6DCCB" stroke-width="2" />
        <circle cx="152" cy="62" r="13" fill="#9A5A12" />
        <ellipse cx="148" cy="58" rx="5" ry="3" fill="#C98A2E" />
      </g>

      <!-- Cola (generic bottle, no brand marks) -->
      <g v-else-if="kind === 'cola'">
        <ellipse cx="100" cy="186" rx="34" ry="7" fill="#000" opacity=".2" />
        <path d="M86 14 L114 14 L114 30 Q116 50 128 66 Q134 76 134 92 L134 172 Q134 186 120 186 L80 186 Q66 186 66 172 L66 92 Q66 76 72 66 Q84 50 86 30 Z" fill="#3A1810" />
        <path d="M86 14 L114 14 L114 30 Q116 50 128 66 Q134 76 134 92 L134 172 Q134 186 120 186 L80 186 Q66 186 66 172 L66 92 Q66 76 72 66 Q84 50 86 30 Z" fill="url(#cola-shine)" />
        <rect x="84" y="6" width="32" height="12" rx="3" fill="#D62828" />
        <rect x="66" y="108" width="68" height="42" fill="#D62828" />
        <path d="M66 136 Q100 116 134 132" stroke="#fff" stroke-width="5" fill="none" />
        <text x="100" y="128" text-anchor="middle" font-family="Fraunces, serif" font-size="15" font-weight="700" fill="#fff">COLA</text>
        <g fill="#fff" opacity=".5">
          <circle cx="78" cy="96" r="1.6" /><circle cx="122" cy="160" r="1.4" /><circle cx="84" cy="168" r="1.2" /><circle cx="118" cy="90" r="1.1" />
        </g>
        <defs>
          <linearGradient id="cola-shine" x1="0" x2="1">
            <stop offset="0.15" stop-color="#fff" stop-opacity=".25" />
            <stop offset="0.3" stop-color="#fff" stop-opacity="0" />
            <stop offset="0.8" stop-color="#000" stop-opacity="0" />
            <stop offset="1" stop-color="#000" stop-opacity=".25" />
          </linearGradient>
        </defs>
      </g>

      <!-- Fresh lime & iced coffee (glass) -->
      <g v-else-if="kind === 'lime' || kind === 'coffee'">
        <ellipse cx="100" cy="186" rx="40" ry="7" fill="#000" opacity=".18" />
        <rect x="118" y="6" width="8" height="90" rx="3" transform="rotate(12 122 50)" :fill="kind === 'lime' ? '#D62828' : '#211A17'" />
        <path d="M58 40 L142 40 L132 180 Q131 186 124 186 L76 186 Q69 186 68 180 Z" fill="#EAF4F4" opacity=".55" stroke="#C9DADA" stroke-width="2" />
        <path v-if="kind === 'lime'" d="M62 66 L138 66 L132 178 Q131 182 124 182 L76 182 Q69 182 68 178 Z" fill="#CDE7A0" opacity=".9" />
        <template v-else>
          <path d="M62 66 L138 66 L136 100 L64 100 Z" fill="#EFE1C8" />
          <path d="M64 100 L136 100 L132 178 Q131 182 124 182 L76 182 Q69 182 68 178 Z" fill="#7A4A2A" />
          <path d="M64 100 Q100 112 136 100 L135 112 Q100 122 65 112 Z" fill="#A8744C" opacity=".8" />
        </template>
        <g opacity=".75">
          <rect x="74" y="74" width="20" height="20" rx="4" fill="#fff" transform="rotate(-12 84 84)" />
          <rect x="104" y="82" width="20" height="20" rx="4" fill="#fff" transform="rotate(14 114 92)" />
          <rect x="86" y="108" width="18" height="18" rx="4" fill="#fff" transform="rotate(6 95 117)" />
        </g>
        <template v-if="kind === 'lime'">
          <circle cx="138" cy="44" r="20" fill="#5C9E31" />
          <circle cx="138" cy="44" r="16" fill="#D7EE9A" />
          <path d="M138 28 L138 60 M122 44 L154 44 M127 33 L149 55 M149 33 L127 55" stroke="#9CC95B" stroke-width="1.4" />
          <path d="M70 46 Q62 30 76 26 Q80 40 70 46 Z" fill="#3E7B2B" />
          <path d="M80 44 Q84 28 96 32 Q90 44 80 44 Z" fill="#4F8F28" />
        </template>
        <path d="M66 46 L70 176" stroke="#fff" stroke-width="4" opacity=".55" stroke-linecap="round" />
      </g>

      <!-- Fallback plate -->
      <g v-else>
        <circle cx="100" cy="100" r="80" fill="#FBF6EE" stroke="#E8DCC8" stroke-width="3" />
        <text x="100" y="108" text-anchor="middle" font-size="22" font-family="Fraunces, serif" fill="#D62828">PizzaPan</text>
      </g>
    </svg>
  </div>
</template>
