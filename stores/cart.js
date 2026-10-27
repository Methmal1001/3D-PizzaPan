import { defineStore } from 'pinia'
import { findProduct } from '~/data/products'
import { DEFAULT_PIZZA_OPTIONS } from '~/data/pizzaOptions'
import { deliveryFee, discountAmount, findDiscountCode, pizzaUnitPrice, validateDiscountCode } from '~/utils/pricing'
import { useCheckoutStore } from './checkout'

const MAX_QTY = 20

/** Normalised options so that identical customisations always produce the same key. */
export function normaliseOptions(options) {
  if (!options) return null
  return {
    size: options.size,
    crust: options.crust,
    sauce: options.sauce,
    cheese: options.cheese,
    toppings: [...new Set(options.toppings || [])].sort(),
  }
}

/** Cart lines only merge when product AND every customisation are identical. */
export function lineKey(productId, options) {
  const o = normaliseOptions(options)
  return o ? `${productId}|${o.size}|${o.crust}|${o.sauce}|${o.cheese}|${o.toppings.join(',')}` : productId
}

/** Default options for a menu pizza (used by quick-add and as the builder's starting point). */
export function defaultOptionsFor(product) {
  if (!product || product.type === 'item') return null
  if (product.type === 'builder') return { ...DEFAULT_PIZZA_OPTIONS, toppings: [] }
  return {
    size: 'regular',
    crust: product.defaultCrust || 'classic',
    sauce: product.defaultSauce || 'tomato',
    cheese: product.defaultCheese || 'mozzarella',
    toppings: [...(product.includedToppings || [])],
  }
}

/** The "base" used by the pricing rules: menu pizzas include their signature toppings. */
export function pricingBaseFor(product) {
  if (!product || product.type !== 'pizza') return null
  return { price: product.price, includedToppings: product.includedToppings || [] }
}

const newLineId = () => `ln_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [],
    promoCode: null,
    lastChangedLineId: null,
  }),

  getters: {
    count: (s) => s.items.reduce((n, i) => n + i.quantity, 0),
    isEmpty: (s) => s.items.length === 0,
    subtotal: (s) => s.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
    promo() {
      return findDiscountCode(this.promoCode)
    },
    /** A code can become invalid when items are removed; surface that in the UI. */
    promoValid() {
      return !!this.promo && this.subtotal >= this.promo.minSubtotal
    },
    discount() {
      return this.promoValid ? discountAmount(this.promo, this.subtotal) : 0
    },
    deliveryMethod() {
      return useCheckoutStore().deliveryMethod
    },
    deliveryFee() {
      return deliveryFee({
        subtotal: this.subtotal,
        method: this.deliveryMethod,
        promo: this.promoValid ? this.promo : null,
      })
    },
    total() {
      return Math.max(0, this.subtotal - this.discount + this.deliveryFee)
    },
    lineById: (s) => (lineId) => s.items.find((i) => i.lineId === lineId),
  },

  actions: {
    /** Quick-add a menu product with its default options. */
    addProduct(productId, quantity = 1) {
      const product = findProduct(productId)
      if (!product) return null
      if (product.type === 'item') {
        return this._upsert({ productId, kind: 'item', options: null, unitPrice: product.price, quantity })
      }
      return this.addPizza({ productId, options: defaultOptionsFor(product), quantity })
    },

    /** Add a customised (menu or Build Your Own) pizza. */
    addPizza({ productId, options, quantity = 1 }) {
      const product = findProduct(productId)
      if (!product) return null
      const opts = normaliseOptions(options)
      return this._upsert({
        productId,
        kind: product.type === 'builder' ? 'custom' : 'pizza',
        options: opts,
        unitPrice: pizzaUnitPrice(opts, pricingBaseFor(product)),
        quantity,
      })
    },

    /** Replace a pizza line's customisation. Merges with an identical existing line if needed. */
    updatePizza(lineId, { options, quantity }) {
      const line = this.lineById(lineId)
      if (!line) return null
      const product = findProduct(line.productId)
      const opts = normaliseOptions(options)
      const key = lineKey(line.productId, opts)
      const twin = this.items.find((i) => i.key === key && i.lineId !== lineId)
      const qty = Math.min(MAX_QTY, Math.max(1, quantity ?? line.quantity))
      if (twin) {
        twin.quantity = Math.min(MAX_QTY, twin.quantity + qty)
        this.items = this.items.filter((i) => i.lineId !== lineId)
        this.lastChangedLineId = twin.lineId
        return twin
      }
      Object.assign(line, {
        key,
        options: opts,
        quantity: qty,
        unitPrice: pizzaUnitPrice(opts, pricingBaseFor(product)),
      })
      this.lastChangedLineId = line.lineId
      return line
    },

    increment(lineId) {
      const line = this.lineById(lineId)
      if (line && line.quantity < MAX_QTY) line.quantity++
    },
    decrement(lineId) {
      const line = this.lineById(lineId)
      if (!line) return
      if (line.quantity > 1) line.quantity--
      else this.remove(lineId)
    },
    setQuantity(lineId, qty) {
      const line = this.lineById(lineId)
      if (!line) return
      const n = Math.floor(Number(qty))
      if (!Number.isFinite(n) || n < 1) return this.remove(lineId)
      line.quantity = Math.min(MAX_QTY, n)
    },
    remove(lineId) {
      this.items = this.items.filter((i) => i.lineId !== lineId)
    },
    clear() {
      this.items = []
      this.promoCode = null
    },

    applyCode(code) {
      const res = validateDiscountCode(code, this.subtotal)
      if (res.ok) this.promoCode = res.promo.code
      return res
    },
    removeCode() {
      this.promoCode = null
    },

    _upsert({ productId, kind, options, unitPrice, quantity }) {
      const product = findProduct(productId)
      const key = lineKey(productId, options)
      const existing = this.items.find((i) => i.key === key)
      if (existing) {
        existing.quantity = Math.min(MAX_QTY, existing.quantity + quantity)
        this.lastChangedLineId = existing.lineId
        return existing
      }
      const line = {
        lineId: newLineId(),
        key,
        productId,
        name: kind === 'custom' ? 'Custom Pizza' : product.name,
        kind,
        options,
        unitPrice,
        quantity: Math.min(MAX_QTY, quantity),
      }
      this.items.push(line)
      this.lastChangedLineId = line.lineId
      return line
    },
  },
})
