// Pizza builder options and the dummy pricing rules used across the app.
// All prices are in Sri Lankan rupees (LKR).
//
// Pricing rules (custom & customised pizzas):
//   unit price = base price
//              + size surcharge
//              + crust surcharge
//              + sauce surcharge
//              + cheese surcharge
//              + price of every topping that is NOT already included in the base pizza
//
// - "Build Your Own" pizzas start from CUSTOM_BASE_PRICE with no included toppings.
// - Menu pizzas start from their listed (Regular size) price and include their signature toppings.
// - Removing an included topping does not reduce the price.

export const CUSTOM_BASE_PRICE = 1490

export const SIZES = [
  { id: 'regular', name: 'Regular', detail: '7" · serves 1', price: 0, scale: 0.78 },
  { id: 'medium', name: 'Medium', detail: '10" · serves 2', price: 700, scale: 0.86 },
  { id: 'large', name: 'Large', detail: '12" · serves 3', price: 1300, scale: 0.93 },
  { id: 'family', name: 'Family', detail: '14" · serves 4–5', price: 2100, scale: 1 },
]

export const CRUSTS = [
  { id: 'classic', name: 'Classic', detail: 'Hand-tossed, golden & airy', price: 0 },
  { id: 'thin', name: 'Thin Crust', detail: 'Light, crisp Roman-style base', price: 0 },
  { id: 'pan', name: 'Pan Crust', detail: 'Thick, buttery & soft inside', price: 250 },
  { id: 'cheese-burst', name: 'Cheese Burst', detail: 'Molten cheese-filled edge', price: 550 },
]

export const SAUCES = [
  { id: 'tomato', name: 'Classic Tomato', detail: 'San Marzano style, basil & oregano', price: 0, color: '#C0302A' },
  { id: 'bbq', name: 'BBQ', detail: 'Smoky, sweet & sticky', price: 100, color: '#6E2B17' },
  { id: 'spicy', name: 'Spicy Sauce', detail: 'Roasted chilli & garlic kick', price: 100, color: '#A3161A' },
  { id: 'garlic', name: 'Creamy Garlic', detail: 'Roasted garlic béchamel', price: 150, color: '#EAD7B1' },
]

export const CHEESES = [
  { id: 'mozzarella', name: 'Mozzarella', detail: 'Classic melt, perfectly stretchy', price: 0, coverage: 1 },
  { id: 'extra', name: 'Extra Cheese', detail: '50% more mozzarella', price: 300, coverage: 1.5 },
  { id: 'double', name: 'Double Cheese', detail: 'Mozzarella + aged cheddar blend', price: 500, coverage: 2 },
  { id: 'vegan', name: 'Vegan Cheese', detail: 'Plant-based, dairy-free melt', price: 400, coverage: 1 },
]

export const TOPPINGS = [
  { id: 'chicken', name: 'Chicken', price: 350, veg: false, group: 'Meat' },
  { id: 'pepperoni', name: 'Pepperoni', price: 350, veg: false, group: 'Meat' },
  { id: 'sausage', name: 'Sausage', price: 350, veg: false, group: 'Meat' },
  { id: 'mushrooms', name: 'Mushrooms', price: 200, veg: true, group: 'Veggies' },
  { id: 'onions', name: 'Onions', price: 150, veg: true, group: 'Veggies' },
  { id: 'capsicum', name: 'Capsicum', price: 150, veg: true, group: 'Veggies' },
  { id: 'olives', name: 'Olives', price: 200, veg: true, group: 'Veggies' },
  { id: 'jalapenos', name: 'Jalapeños', price: 200, veg: true, group: 'Veggies' },
  { id: 'pineapple', name: 'Pineapple', price: 200, veg: true, group: 'Veggies' },
  { id: 'extra-cheese', name: 'Extra Cheese', price: 300, veg: true, group: 'Cheese' },
]

export const MAX_TOPPINGS = 10

export const DEFAULT_PIZZA_OPTIONS = {
  size: 'regular',
  crust: 'classic',
  sauce: 'tomato',
  cheese: 'mozzarella',
  toppings: [],
}

export const BUILDER_STEPS = [
  { id: 'size', title: 'Size', subtitle: 'How hungry are you?' },
  { id: 'crust', title: 'Crust', subtitle: 'The foundation of greatness' },
  { id: 'sauce', title: 'Sauce', subtitle: 'Spread the flavour' },
  { id: 'cheese', title: 'Cheese', subtitle: 'Melt matters' },
  { id: 'toppings', title: 'Toppings', subtitle: 'Pile it on' },
  { id: 'review', title: 'Review', subtitle: 'Fresh from your imagination' },
]

export const findOption = (list, id) => list.find((o) => o.id === id)
