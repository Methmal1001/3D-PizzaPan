import { defineStore } from 'pinia'
import { findProduct } from '~/data/products'
import { validateCustomer } from '~/utils/validation'
import { useCartStore } from './cart'

export const CHECKOUT_STEPS = [
  { id: 1, key: 'details', title: 'Your details' },
  { id: 2, key: 'delivery', title: 'Delivery' },
  { id: 3, key: 'payment', title: 'Payment' },
  { id: 4, key: 'review', title: 'Review' },
]

const emptyCustomer = () => ({
  fullName: '',
  mobile: '',
  email: '',
  address: '',
  city: '',
  instructions: '',
})

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

/** e.g. PP-261027-K7Q2 — generated on the client, demo only. */
function generateOrderId(existing = []) {
  const d = new Date()
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let id
  do {
    const bytes = new Uint8Array(4)
    globalThis.crypto?.getRandomValues ? crypto.getRandomValues(bytes) : bytes.forEach((_, i) => (bytes[i] = Math.random() * 255))
    id = `PP-${ymd}-${[...bytes].map((b) => alphabet[b % alphabet.length]).join('')}`
  } while (existing.includes(id))
  return id
}

export function estimateMinutes(items, method) {
  const pizzas = items.filter((i) => i.kind !== 'item').reduce((n, i) => n + i.quantity, 0)
  const longest = Math.max(10, ...items.map((i) => findProduct(i.productId)?.prepTime || 10))
  const prep = Math.min(45, longest + Math.max(0, pizzas - 2) * 3)
  const travel = method === 'delivery' ? 20 : 0
  return { prep, total: prep + travel, window: `${prep + travel}–${prep + travel + 10} min` }
}

export const useCheckoutStore = defineStore('checkout', {
  state: () => ({
    step: 1,
    customer: emptyCustomer(),
    deliveryMethod: 'delivery', // 'delivery' | 'pickup'
    deliverySlot: 'asap', // 'asap' or a "HH:MM" label generated on the client
    paymentMethod: null, // 'cod' | 'card'
    cashChangeFor: 'exact',
    cardDemoAcknowledged: false,
    placing: false,
    lastOrder: null,
    orderHistory: [], // ids of previously placed demo orders
  }),

  getters: {
    customerErrors: (s) => validateCustomer(s.customer, s.deliveryMethod),
    detailsValid() {
      return Object.keys(this.customerErrors).length === 0
    },
    paymentValid: (s) => s.paymentMethod === 'cod' || (s.paymentMethod === 'card' && s.cardDemoAcknowledged),
    canPlaceOrder() {
      return this.detailsValid && this.paymentValid && !useCartStore().isEmpty
    },
  },

  actions: {
    goTo(step) {
      this.step = Math.min(4, Math.max(1, step))
    },

    setDeliveryMethod(method) {
      this.deliveryMethod = method === 'pickup' ? 'pickup' : 'delivery'
    },

    /**
     * Simulates order processing. Nothing leaves the browser: no API, no payment gateway.
     * @returns {Promise<object>} the dummy order object
     */
    async placeOrder() {
      const cart = useCartStore()
      if (!this.canPlaceOrder) throw new Error('Order details are incomplete.')
      this.placing = true
      try {
        await wait(2400)
        const items = cart.items.map((i) => ({
          ...JSON.parse(JSON.stringify(i)),
          lineTotal: i.unitPrice * i.quantity,
        }))
        const order = {
          id: generateOrderId(this.orderHistory),
          placedAt: new Date().toISOString(),
          demo: true,
          items,
          itemCount: cart.count,
          subtotal: cart.subtotal,
          discount: cart.discount,
          promoCode: cart.promoValid ? cart.promoCode : null,
          deliveryFee: cart.deliveryFee,
          total: cart.total,
          customer: { ...this.customer },
          deliveryMethod: this.deliveryMethod,
          deliverySlot: this.deliverySlot,
          payment:
            this.paymentMethod === 'card'
              ? { method: 'card', label: 'Card payment (simulated demo)', card: 'Demo card •••• 4242', simulated: true }
              : { method: 'cod', label: this.deliveryMethod === 'pickup' ? 'Cash at pickup' : 'Cash on Delivery', changeFor: this.cashChangeFor },
          estimate: estimateMinutes(cart.items, this.deliveryMethod),
        }
        this.lastOrder = order
        this.orderHistory = [order.id, ...this.orderHistory].slice(0, 20)
        cart.clear()
        this.step = 1
        this.paymentMethod = null
        this.cardDemoAcknowledged = false
        this.deliverySlot = 'asap'
        return order
      } finally {
        this.placing = false
      }
    },

    startNewOrder() {
      this.step = 1
      this.paymentMethod = null
      this.cardDemoAcknowledged = false
      this.deliverySlot = 'asap'
    },
  },
})
