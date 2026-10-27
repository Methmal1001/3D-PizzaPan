# PizzaPan Bakery — Immersive 3D Pizza Ordering Portal

A frontend-only prototype of an online pizza ordering portal. Customers walk through the glass doors of a
real-time **Three.js** bakery, explore the shop, build their own pizza, fill a cart and complete a
**simulated** checkout with order tracking.

> **Demo only.** All products, prices (LKR), ratings and orders are sample data. There is no backend,
> database, authentication, payment gateway or real order submission. Nothing leaves the browser.

---

## Quick start

Requirements: **Node.js 20.19+ or 22.12+** (Nuxt 3.21 does not run on Node 16/18).

```bash
# If you use nvm / nvm-windows, switch to Node 22 first (an .nvmrc is included)
nvm use 22

npm install
npm run dev          # http://localhost:3000
```

Production build:

```bash
npm run build
npm run preview      # or: node .output/server/index.mjs
```

| Script            | What it does                                |
| ----------------- | ------------------------------------------- |
| `npm run dev`     | Development server with hot reload          |
| `npm run build`   | Production build (SSR) into `.output/`      |
| `npm run preview` | Serve the production build locally          |
| `npm run generate`| Pre-render a static version of the site     |

No API keys or environment variables are needed.

---

## Tech stack

- **Nuxt 3.21** (Vue 3, SSR) with file-based routing
- **Tailwind CSS 3** via `@nuxtjs/tailwindcss` — custom warm pizza theme in `tailwind.config.js`
- **Three.js** — the 3D bakery, built entirely from primitives and procedural canvas textures (no model downloads)
- **GSAP** — door/camera choreography, topping drops, price tweens, success animation
- **Pinia** — cart, checkout and UI state (persisted to `localStorage` on the client)
- **lucide-vue-next** — icons
- Plain **JavaScript** throughout

---

## Features

### 1. 3D bakery entrance (`/`)
- A real-time Three.js scene of a dusk storefront: brick facade, glowing sign, striped awning, glass double
  doors with an OPEN sign, window lettering, street lamps, planters, bench and a chalkboard special.
- **Enter PizzaPan** swings the doors open and flies the camera inside. **Explore Menu** / **Skip intro** go straight to the menu.
- Inside: a checkered floor, marble counter, turning pizzas in a display case, a wood-fired dome oven with flickering
  fire light, a chalk menu board (generated from the product data), a bread rack, drinks fridge, tables, pendant
  lamps and a ceiling fan.
- **Hotspots**: click the 3D objects or the labelled markers (oven → Build Your Own, fridge → Beverages,
  display case → Signature Pizzas, register → Cart, …). Drag or use the arrow keys to look around.
- Loading screen while the scene initialises, plus a **CSS fallback bakery** (with its own opening doors and explorable
  corners) when WebGL is unavailable or the scene fails, so ordering is never blocked.

### 2. Menu (`/menu`)
- **3D Shop / Menu View** toggle. The 3D view embeds the interior; category chips turn the camera towards the
  matching corner and hotspots filter the products.
- 11 categories (Signature, Classic, Spicy, Vegetarian, Custom, Garlic Bread, Sides, Desserts, Beverages,
  Special Offers, All), search, Veg/Spicy filters, 6 sort orders, promo banners and a featured strip.
- 28 sample products with LKR prices, sizes, crusts, toppings, veg flag, spice level, prep time and clearly
  labelled sample ratings. Product art is drawn locally as SVG, so no external image hosting is needed.

### 3. Build Your Own Pizza (`/customize`)
- 6 steps: Size → Crust → Sauce → Cheese → Toppings (up to 10) → Review.
- Live layered SVG preview: the sauce colour, cheese coverage, crust style and pizza size update instantly, and
  toppings drop on and lift off with GSAP.
- Live animated price, a full price breakdown, quantity selector, and add-to-cart (or update-cart when editing).
- Customise a menu pizza via `/customize?product=<id>`; edit a cart line via `/customize?edit=<lineId>`.

### 4. Cart (drawer + `/cart`)
- Add, increase/decrease, remove, edit pizzas, clear the cart.
- Lines merge **only** when product and every customisation are identical.
- Discount codes, delivery fee rules, subtotal/discount/delivery/total, empty states.
- A floating cart indicator (bottom bar on mobile, pill on desktop) and a header cart with the running total.

### 5. Checkout (`/checkout`)
1. **Details**: name, Sri Lankan mobile, optional email, address, city, instructions, with inline validation.
2. **Delivery**: Home delivery or Pickup, ASAP or a client-generated time slot, with an estimated time.
3. **Payment**: **Cash on Delivery** (amount payable plus change preference) or **Card Payment**. The card form is a
   read-only simulation using the public test number `4242 4242 4242 4242`. It never asks for or stores
   real card data, and the customer must acknowledge it is a demo.
4. **Review**: every detail, with edit links back to each step.
5. **Place Order**: validation, a loading animation, a simulated delay and a client-generated order ID (`PP-YYMMDD-XXXX`).

### 6. Confirmation & tracking (`/order-confirmation`)
- Success animation, order number, estimated time, full summary, delivery and payment details.
- A visual 5-stage tracker (Placed → Preparing → Baking → Ready → Completed) that advances on a **demo timer**
  (about 20 s per stage) and is clearly labelled as simulated.
- **View Order Summary**, **Return to Menu**, **Start a New Order**.

---

## Dummy pricing rules (`data/pizzaOptions.js`, `utils/pricing.js`)

```
unit price = base + size + crust + sauce + cheese + every topping not already included
```

| Item          | Price (LKR)                                                        |
| ------------- | ------------------------------------------------------------------ |
| Base          | Build Your Own 1,490 · menu pizzas use their Regular price         |
| Size          | Regular +0 · Medium +700 · Large +1,300 · Family +2,100            |
| Crust         | Classic/Thin +0 · Pan +250 · Cheese Burst +550                     |
| Sauce         | Tomato +0 · BBQ +100 · Spicy +100 · Creamy Garlic +150             |
| Cheese        | Mozzarella +0 · Extra +300 · Double +500 · Vegan +400              |
| Toppings      | Meats 350 · Veg 150–200 · Extra Cheese 300 (a menu pizza's own toppings are included) |
| Delivery      | 350, free over 6,000, free for pickup                              |

**Discount codes**: `PIZZA10` (10% off over 3,000, max 1,500), `WELCOME500` (500 off over 4,000), `FREEDEL` (free delivery).

---

## Project structure

```
├── app.vue                     # Root: layout + page + loading bar
├── error.vue                   # Branded 404 / error page
├── nuxt.config.js              # Modules, head, fonts, page transitions
├── tailwind.config.js          # Theme: tomato, ember, gold, cream, charcoal, olive
├── assets/css/main.css         # Tailwind layers, component classes, transitions
├── layouts/default.vue         # Header, footer, cart drawer, toasts, floating cart
├── pages/
│   ├── index.vue               # 3D entrance + welcome + below-the-fold highlights
│   ├── menu.vue                # 3D Shop / Menu View, categories, search, filters
│   ├── customize.vue           # Build Your Own / customise / edit cart line
│   ├── cart.vue
│   ├── checkout.vue
│   └── order-confirmation.vue
├── components/
│   ├── bakery/                 # BakeryScene (Three.js), BakeryFallback, SceneLoader
│   ├── menu/                   # ProductCard, ProductVisual, CategoryNav, MenuToolbar, ViewToggle, PromoBanners
│   ├── pizza/                  # PizzaArt (layered SVG), BuilderStepper, OptionCard, ToppingPicker
│   ├── cart/                   # CartDrawer, CartItem, CartSummary, DiscountCode, MobileCartBar
│   ├── checkout/               # CheckoutSteps, CustomerForm, DeliveryOptions, PaymentOptions, DemoCardForm, OrderReview, …
│   ├── order/                  # OrderTracker, SuccessBurst
│   ├── layout/                 # AppHeader, AppFooter
│   └── common/                 # BrandLogo, QuantityStepper, ToastStack, EmptyState
├── composables/                # useMenu, useCart, usePricing, useHotspotActions, useReducedMotion
├── stores/                     # cart.js, checkout.js, ui.js (Pinia)
├── data/                       # products.js, categories.js, offers.js, pizzaOptions.js
├── lib/bakery/                 # buildBakery.js (scene graph), textures.js (procedural canvas textures)
├── plugins/
│   ├── three.client.js         # Lazy loader for Three.js + GSAP, WebGL detection
│   └── persist.client.js       # Restores/saves cart & checkout in localStorage after hydration
└── utils/                      # pricing.js, validation.js, seeded.js
```

Components are auto-imported by name (`pathPrefix: false`), so `components/menu/ProductCard.vue` is `<ProductCard>`.

---

## Implementation notes

- **SSR-safe**: Three.js only runs inside `<ClientOnly>` and is loaded with a dynamic import in its own chunk
  (prefetched at idle priority, never render-blocking). `window`, `document` and `localStorage` are only touched in
  `onMounted` or client plugins. Persisted state is restored in `onNuxtReady` (after hydration) to avoid mismatches.
- **Resource cleanup**: on unmount the scene cancels its animation frame, kills GSAP timelines, disconnects
  `ResizeObserver`/`IntersectionObserver`, removes listeners, disposes every geometry, material and texture, and
  releases the WebGL context.
- **Performance**: rendering pauses when the canvas is off-screen or the tab is hidden. On touch, small or
  low-core devices it uses a lower pixel ratio, no antialiasing or shadows, fewer lights and simpler furniture.
  Mobile defaults to the lightweight Menu View.
- **Accessibility**: semantic landmarks, skip link, labelled controls, visible focus rings, keyboard-reachable
  hotspot buttons, arrow-key look-around, `aria-live` price/status updates, a focus-trapped cart drawer, and
  `prefers-reduced-motion` support (instant camera moves, no idle spins or bursts).
- **Deterministic art**: pizza toppings are placed with a seeded random generator, so server and client render the
  same SVG.

---

## Tested

- Production build (`nuxt build`) with no errors.
- End-to-end journeys in headless Chrome: entrance → enter shop → hotspot navigation → menu → quick add →
  build your own → cart (discount code, edit custom pizza) → checkout validation → card and cash payment →
  place order → confirmation. No console errors or hydration warnings.
- Layouts checked at 360, 390, 768 and 1440 px with no horizontal overflow (1024 px spot-checked on the landing and checkout pages).
- WebGL disabled: the CSS fallback bakery appears and ordering still works.
