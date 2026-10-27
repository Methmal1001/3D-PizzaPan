/** Reactive `prefers-reduced-motion` flag (false during SSR). */
export function useReducedMotion() {
  const reduced = useState('pp-reduced-motion', () => false)
  onMounted(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    reduced.value = mq.matches
    const onChange = (e) => (reduced.value = e.matches)
    mq.addEventListener('change', onChange)
    onBeforeUnmount(() => mq.removeEventListener('change', onChange))
  })
  return reduced
}

/** Animated number that tweens toward a target value (used for live prices). */
export function useTweenedNumber(source, duration = 0.45) {
  const display = ref(unref(source))
  let tween
  watch(
    () => unref(source),
    async (to) => {
      if (!import.meta.client) return (display.value = to)
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (reduced) return (display.value = to)
      const { gsap } = await import('gsap')
      tween?.kill()
      const obj = { v: display.value }
      tween = gsap.to(obj, {
        v: to,
        duration,
        ease: 'power2.out',
        onUpdate: () => (display.value = Math.round(obj.v)),
      })
    },
  )
  onBeforeUnmount(() => tween?.kill())
  return display
}
