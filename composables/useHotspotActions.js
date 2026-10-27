import { useUiStore } from '~/stores/ui'

/** Where each bakery hotspot leads. Shared by the landing scene, the 3D shop view and the fallback. */
export const HOTSPOT_TARGETS = {
  menu: { category: 'all' },
  display: { category: 'signature' },
  oven: { route: '/customize' },
  fridge: { category: 'beverages' },
  dessert: { category: 'desserts' },
  register: { cart: true },
  veg: { category: 'vegetarian' },
  bread: { category: 'garlic-bread' },
  spicy: { category: 'spicy' },
  offers: { category: 'offers' },
}

export const HOTSPOT_LIST = [
  { id: 'display', label: 'Signature Pizzas' },
  { id: 'oven', label: 'Build Your Own' },
  { id: 'menu', label: 'Full Menu' },
  { id: 'spicy', label: 'Spicy' },
  { id: 'veg', label: 'Vegetarian' },
  { id: 'bread', label: 'Garlic Bread & Sides' },
  { id: 'dessert', label: 'Desserts' },
  { id: 'fridge', label: 'Beverages' },
  { id: 'offers', label: 'Special Offers' },
  { id: 'register', label: 'Your Cart' },
]

export function useHotspotActions() {
  const ui = useUiStore()

  /**
   * @param {string} id hotspot id
   * @param {(category:string)=>void} [onCategory] handle categories in place (3D shop view) instead of navigating
   */
  const run = (id, onCategory) => {
    const target = HOTSPOT_TARGETS[id]
    if (!target) return
    ui.enteredShop = true
    if (target.cart) return ui.openCart()
    if (target.route) return navigateTo(target.route)
    if (onCategory) return onCategory(target.category)
    return navigateTo({ path: '/menu', query: target.category === 'all' ? {} : { category: target.category } })
  }

  return { run, targets: HOTSPOT_TARGETS, list: HOTSPOT_LIST }
}
