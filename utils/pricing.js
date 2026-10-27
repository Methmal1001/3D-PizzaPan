// Pure pricing helpers shared by the builder, cart and checkout.
import { CRUSTS, CHEESES, CUSTOM_BASE_PRICE, SAUCES, SIZES, TOPPINGS, findOption } from '~/data/pizzaOptions'
import { DELIVERY_RULES, DISCOUNT_CODES } from '~/data/offers'

const lkrFormatter = new Intl.NumberFormat('en-LK', { maximumFractionDigits: 0 })

/** Format a number as "LKR 2,450" */
export function formatLKR(value) {
  const n = Math.round(Number(value) || 0)
  return `LKR ${lkrFormatter.format(n)}`
}

/**
 * Breakdown of a pizza's unit price.
 * @param {object} options  { size, crust, sauce, cheese, toppings[] }
 * @param {object} [base]   { price, includedToppings[] } — the menu pizza being customised (omit for Build Your Own)
 */
export function pizzaPriceBreakdown(options, base = null) {
  const basePrice = base ? base.price : CUSTOM_BASE_PRICE
  const included = new Set(base?.includedToppings || [])
  const size = findOption(SIZES, options.size) || SIZES[0]
  const crust = findOption(CRUSTS, options.crust) || CRUSTS[0]
  const sauce = findOption(SAUCES, options.sauce) || SAUCES[0]
  const cheese = findOption(CHEESES, options.cheese) || CHEESES[0]

  const toppingLines = (options.toppings || [])
    .map((id) => findOption(TOPPINGS, id))
    .filter(Boolean)
    .map((t) => ({ id: t.id, name: t.name, price: included.has(t.id) ? 0 : t.price, included: included.has(t.id) }))

  const lines = [
    { label: base ? 'Base pizza' : 'Hand-made base', amount: basePrice },
    { label: `Size · ${size.name}`, amount: size.price },
    { label: `Crust · ${crust.name}`, amount: crust.price },
    { label: `Sauce · ${sauce.name}`, amount: sauce.price },
    { label: `Cheese · ${cheese.name}`, amount: cheese.price },
    ...toppingLines.map((t) => ({ label: `${t.name}${t.included ? ' (included)' : ''}`, amount: t.price, topping: true })),
  ]

  const total = lines.reduce((sum, l) => sum + l.amount, 0)
  return { lines, total, size, crust, sauce, cheese, toppings: toppingLines }
}

export function pizzaUnitPrice(options, base = null) {
  return pizzaPriceBreakdown(options, base).total
}

/** Look up a discount code and check whether it applies to the subtotal. */
export function validateDiscountCode(rawCode, subtotal) {
  const code = String(rawCode || '').trim().toUpperCase()
  if (!code) return { ok: false, message: 'Please enter a discount code.' }
  const promo = DISCOUNT_CODES.find((d) => d.code === code)
  if (!promo) return { ok: false, message: `“${code}” isn’t a valid code. Try PIZZA10, WELCOME500 or FREEDEL.` }
  if (subtotal < promo.minSubtotal) {
    return { ok: false, message: `${promo.code} needs a subtotal of at least ${formatLKR(promo.minSubtotal)}.` }
  }
  return { ok: true, promo, message: `${promo.code} applied — ${promo.label}.` }
}

export function discountAmount(promo, subtotal) {
  if (!promo || subtotal < promo.minSubtotal) return 0
  if (promo.type === 'percent') {
    const amt = Math.round((subtotal * promo.value) / 100)
    return promo.maxDiscount ? Math.min(amt, promo.maxDiscount) : amt
  }
  if (promo.type === 'flat') return Math.min(promo.value, subtotal)
  return 0
}

export function deliveryFee({ subtotal, method, promo }) {
  if (method === 'pickup' || subtotal <= 0) return 0
  if (promo?.type === 'delivery') return 0
  if (subtotal >= DELIVERY_RULES.freeDeliveryThreshold) return 0
  return DELIVERY_RULES.baseFee
}

export function findDiscountCode(code) {
  return DISCOUNT_CODES.find((d) => d.code === String(code || '').toUpperCase()) || null
}
