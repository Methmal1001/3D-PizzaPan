// Restores and saves cart / checkout state in localStorage — browser only.
// Restoration runs after hydration (onNuxtReady) so server and client markup always match.
import { useCartStore } from '~/stores/cart'
import { useCheckoutStore } from '~/stores/checkout'
import { useUiStore } from '~/stores/ui'

const KEY = 'pizzapan-bakery:v1'

function read() {
  try {
    return JSON.parse(window.localStorage.getItem(KEY) || 'null')
  } catch {
    return null
  }
}

export default defineNuxtPlugin(() => {
  const cart = useCartStore()
  const checkout = useCheckoutStore()
  const ui = useUiStore()

  onNuxtReady(() => {
    const saved = read()
    if (saved) {
      if (Array.isArray(saved.cart?.items)) cart.items = saved.cart.items
      if (saved.cart?.promoCode) cart.promoCode = saved.cart.promoCode
      if (saved.checkout) {
        // Card details are never persisted — only non-sensitive checkout fields.
        const { customer, deliveryMethod, lastOrder, orderHistory } = saved.checkout
        if (customer) Object.assign(checkout.customer, customer)
        if (deliveryMethod) checkout.deliveryMethod = deliveryMethod
        if (lastOrder) checkout.lastOrder = lastOrder
        if (Array.isArray(orderHistory)) checkout.orderHistory = orderHistory
      }
      if (saved.ui?.viewMode) ui.setViewMode(saved.ui.viewMode)
      if (saved.ui?.enteredShop) ui.enteredShop = true
    }
    if (!ui.viewModeChosen) {
      // Lightweight menu by default on small or low-power screens
      ui.viewMode = window.matchMedia('(min-width: 1024px)').matches ? '3d' : 'menu'
    }
    ui.restored = true

    let timer
    const save = () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        try {
          window.localStorage.setItem(
            KEY,
            JSON.stringify({
              cart: { items: cart.items, promoCode: cart.promoCode },
              checkout: {
                customer: checkout.customer,
                deliveryMethod: checkout.deliveryMethod,
                lastOrder: checkout.lastOrder,
                orderHistory: checkout.orderHistory,
              },
              ui: { viewMode: ui.viewModeChosen ? ui.viewMode : null, enteredShop: ui.enteredShop },
            }),
          )
        } catch {
          /* storage full or disabled — the app keeps working in memory */
        }
      }, 150)
    }
    cart.$subscribe(save)
    checkout.$subscribe(save)
    ui.$subscribe(save)
  })
})
