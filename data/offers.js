// Sample discount codes & promotional banners (demo only).
export const DISCOUNT_CODES = [
  {
    code: 'PIZZA10',
    label: '10% off your order',
    type: 'percent',
    value: 10,
    minSubtotal: 3000,
    maxDiscount: 1500,
  },
  {
    code: 'WELCOME500',
    label: 'LKR 500 off orders above LKR 4,000',
    type: 'flat',
    value: 500,
    minSubtotal: 4000,
  },
  {
    code: 'FREEDEL',
    label: 'Free home delivery',
    type: 'delivery',
    value: 0,
    minSubtotal: 0,
  },
]

export const DELIVERY_RULES = {
  baseFee: 350,
  freeDeliveryThreshold: 6000,
}

export const PROMO_BANNERS = [
  {
    id: 'promo-family',
    title: 'Family Feast Friday',
    text: '2 Large pizzas, garlic bread & a 1.5L drink — save over LKR 1,500.',
    cta: 'View combo',
    productId: 'family-feast-combo',
    tone: 'tomato',
  },
  {
    id: 'promo-code',
    title: 'Use code PIZZA10',
    text: '10% off orders above LKR 3,000. Apply it in your cart.',
    cta: 'Start ordering',
    category: 'signature',
    tone: 'gold',
  },
  {
    id: 'promo-build',
    title: 'Be the chef today',
    text: 'Build your own pizza with 10 fresh toppings and 4 crusts.',
    cta: 'Build yours',
    route: '/customize',
    tone: 'charcoal',
  },
]
