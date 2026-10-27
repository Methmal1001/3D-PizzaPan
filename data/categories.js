// Menu categories. `icon` maps to a lucide-vue-next component in components/menu/CategoryIcon.vue
export const CATEGORIES = [
  { id: 'all', name: 'All Items', short: 'All', icon: 'LayoutGrid', blurb: 'Everything fresh out of the oven today.' },
  { id: 'signature', name: 'Signature Pizzas', short: 'Signature', icon: 'Crown', blurb: 'House favourites crafted by our head baker.' },
  { id: 'classic', name: 'Classic Pizzas', short: 'Classic', icon: 'Pizza', blurb: 'Timeless recipes, done right.' },
  { id: 'spicy', name: 'Spicy Pizzas', short: 'Spicy', icon: 'Flame', blurb: 'For those who like it hot.' },
  { id: 'vegetarian', name: 'Vegetarian Pizzas', short: 'Veggie', icon: 'Leaf', blurb: 'Garden-fresh and full of flavour.' },
  { id: 'custom', name: 'Custom Pizza', short: 'Custom', icon: 'ChefHat', blurb: 'Build your own masterpiece, step by step.' },
  { id: 'garlic-bread', name: 'Garlic Bread', short: 'Garlic Bread', icon: 'Wheat', blurb: 'Buttery, garlicky, irresistible.' },
  { id: 'sides', name: 'Sides', short: 'Sides', icon: 'Drumstick', blurb: 'The perfect sidekicks.' },
  { id: 'desserts', name: 'Desserts', short: 'Desserts', icon: 'CakeSlice', blurb: 'Save room for something sweet.' },
  { id: 'beverages', name: 'Beverages', short: 'Drinks', icon: 'CupSoda', blurb: 'Chilled and refreshing.' },
  { id: 'offers', name: 'Special Offers', short: 'Offers', icon: 'BadgePercent', blurb: 'Combos and deals worth sharing.' },
]

// Pizza categories that also list pizzas tagged with them (e.g. a spicy signature pizza)
export const PIZZA_CATEGORY_IDS = ['signature', 'classic', 'spicy', 'vegetarian']

export const findCategory = (id) => CATEGORIES.find((c) => c.id === id) || CATEGORIES[0]
