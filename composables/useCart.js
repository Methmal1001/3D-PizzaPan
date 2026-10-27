import { storeToRefs } from 'pinia'
import { findProduct } from '~/data/products'
import { useCartStore } from '~/stores/cart'
import { useUiStore } from '~/stores/ui'

/** Cart operations with user feedback (toasts) layered on top of the Pinia store. */
export function useCart() {
  const cart = useCartStore()
  const ui = useUiStore()
  const refs = storeToRefs(cart)

  const quickAdd = (productId, quantity = 1) => {
    const product = findProduct(productId)
    if (!product) return
    if (product.type === 'builder') return navigateTo('/customize')
    cart.addProduct(productId, quantity)
    ui.toast({
      title: `${product.name} added`,
      message: product.type === 'pizza' ? 'Regular · Classic crust — tap Customize to change.' : 'Added to your cart.',
      action: { label: 'View cart', type: 'open-cart' },
    })
  }

  const addCustomPizza = ({ productId, options, quantity }) => {
    const line = cart.addPizza({ productId, options, quantity })
    ui.toast({
      title: `${quantity} × ${line?.name || 'pizza'} added`,
      message: 'Your custom creation is in the cart.',
      action: { label: 'View cart', type: 'open-cart' },
    })
    return line
  }

  const removeLine = (lineId) => {
    const line = cart.lineById(lineId)
    cart.remove(lineId)
    if (line) ui.toast({ title: 'Item removed', message: line.name, tone: 'info' })
  }

  return { cart, ...refs, quickAdd, addCustomPizza, removeLine, openCart: ui.openCart, closeCart: ui.closeCart }
}
