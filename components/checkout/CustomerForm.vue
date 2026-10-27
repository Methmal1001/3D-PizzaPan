<script setup>
import { Info } from 'lucide-vue-next'
import { useCheckoutStore } from '~/stores/checkout'
import { CITIES } from '~/utils/validation'

const props = defineProps({
  /** Show every error (after the customer tried to continue) */
  showAll: { type: Boolean, default: false },
})

const checkout = useCheckoutStore()
const c = computed(() => checkout.customer)
const touched = reactive({})
const err = (field) => ((props.showAll || touched[field]) && checkout.customerErrors[field]) || ''
const touch = (field) => (touched[field] = true)
const needsAddress = computed(() => checkout.deliveryMethod === 'delivery')
</script>

<template>
  <div class="grid gap-5 sm:grid-cols-2">
    <FormField id="fullName" label="Full name" :error="err('fullName')" class="sm:col-span-2">
      <template #default="{ describedby, invalid }">
        <input id="fullName" v-model="c.fullName" type="text" autocomplete="name" class="input" :class="{ 'input-error': invalid }" :aria-invalid="invalid" :aria-describedby="describedby" placeholder="e.g. Nimali Perera" @blur="touch('fullName')" />
      </template>
    </FormField>

    <FormField id="mobile" label="Mobile number" :error="err('mobile')" hint="Sri Lankan mobile, e.g. 077 123 4567">
      <template #default="{ describedby, invalid }">
        <input id="mobile" v-model="c.mobile" type="tel" inputmode="tel" autocomplete="tel" class="input" :class="{ 'input-error': invalid }" :aria-invalid="invalid" :aria-describedby="describedby" placeholder="077 123 4567" @blur="touch('mobile')" />
      </template>
    </FormField>

    <FormField id="email" label="Email address" optional :error="err('email')" hint="For your (demo) receipt">
      <template #default="{ describedby, invalid }">
        <input id="email" v-model="c.email" type="email" autocomplete="email" class="input" :class="{ 'input-error': invalid }" :aria-invalid="invalid" :aria-describedby="describedby" placeholder="you@example.com" @blur="touch('email')" />
      </template>
    </FormField>

    <FormField id="address" label="Delivery address" :optional="!needsAddress" :error="err('address')" class="sm:col-span-2">
      <template #default="{ describedby, invalid }">
        <input id="address" v-model="c.address" type="text" autocomplete="street-address" class="input" :class="{ 'input-error': invalid }" :aria-invalid="invalid" :aria-describedby="describedby" placeholder="House no., street, landmark" @blur="touch('address')" />
      </template>
    </FormField>

    <FormField id="city" label="City / area" :optional="!needsAddress" :error="err('city')">
      <template #default="{ describedby, invalid }">
        <select id="city" v-model="c.city" autocomplete="address-level2" class="input" :class="{ 'input-error': invalid, 'text-charcoal-300': !c.city }" :aria-invalid="invalid" :aria-describedby="describedby" @blur="touch('city')">
          <option value="" disabled>Select your area</option>
          <option v-for="city in CITIES" :key="city" :value="city" class="text-charcoal-800">{{ city }}</option>
        </select>
      </template>
    </FormField>

    <FormField id="instructions" label="Delivery instructions" optional :error="err('instructions')" :hint="`${c.instructions.length}/200`">
      <template #default="{ describedby, invalid }">
        <input id="instructions" v-model="c.instructions" type="text" maxlength="220" class="input" :class="{ 'input-error': invalid }" :aria-invalid="invalid" :aria-describedby="describedby" placeholder="e.g. Ring the bell, 2nd floor" @blur="touch('instructions')" />
      </template>
    </FormField>

    <p class="flex items-start gap-2 rounded-2xl bg-gold-100/70 px-4 py-3 text-xs text-charcoal-600 sm:col-span-2">
      <Info class="mt-0.5 h-4 w-4 shrink-0 text-gold-600" aria-hidden="true" />
      <span>
        Picking up instead? Choose <strong>Pickup from bakery</strong> in the next step — the address then becomes optional. Your details stay
        in this browser only (demo).
      </span>
    </p>
  </div>
</template>
