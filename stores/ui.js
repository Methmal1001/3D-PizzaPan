import { defineStore } from 'pinia'

let toastSeq = 0

export const useUiStore = defineStore('ui', {
  state: () => ({
    cartOpen: false,
    mobileNavOpen: false,
    /** '3d' immersive shop or 'menu' practical grid. Chosen on the client after hydration. */
    viewMode: 'menu',
    viewModeChosen: false,
    /** Set once the visitor has walked through the bakery door (or skipped the intro). */
    enteredShop: false,
    /** True once client-side persisted state has been restored (avoids hydration mismatches). */
    restored: false,
    webgl: null, // null = unknown, true/false after detection
    toasts: [],
  }),

  actions: {
    openCart() {
      this.cartOpen = true
      this.mobileNavOpen = false
    },
    closeCart() {
      this.cartOpen = false
    },
    toggleCart() {
      this.cartOpen ? this.closeCart() : this.openCart()
    },
    setViewMode(mode) {
      this.viewMode = mode === '3d' ? '3d' : 'menu'
      this.viewModeChosen = true
    },
    toast({ title, message = '', tone = 'success', action = null, duration = 3200 }) {
      const id = ++toastSeq
      this.toasts.push({ id, title, message, tone, action })
      if (this.toasts.length > 3) this.toasts.shift()
      if (import.meta.client && duration) setTimeout(() => this.dismissToast(id), duration)
      return id
    },
    dismissToast(id) {
      this.toasts = this.toasts.filter((t) => t.id !== id)
    },
  },
})
