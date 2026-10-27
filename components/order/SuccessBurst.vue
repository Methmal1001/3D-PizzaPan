<script setup>
// GSAP success animation: ring pop, check-mark draw and a small burst of pizza confetti.
const root = ref(null)
const pieces = Array.from({ length: 12 }, (_, i) => ({
  angle: (i / 12) * Math.PI * 2,
  color: ['#D62828', '#F77F00', '#FCBF49', '#7C8445'][i % 4],
  shape: i % 3,
}))

let tl
onBeforeUnmount(() => tl?.kill())

onMounted(async () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const { gsap } = await import('gsap')
  const el = root.value
  if (!el) return
  tl = gsap.timeline()
  tl.from(el.querySelector('.burst-ring'), { scale: 0, duration: 0.6, ease: 'back.out(2)' })
    .from(el.querySelector('.check'), { strokeDashoffset: 60, duration: 0.5, ease: 'power2.out' }, '-=0.2')
    .fromTo(
      el.querySelectorAll('.piece'),
      { x: 0, y: 0, scale: 0, opacity: 1 },
      {
        x: (i) => Math.cos(pieces[i].angle) * (70 + (i % 3) * 18),
        y: (i) => Math.sin(pieces[i].angle) * (70 + (i % 3) * 18),
        rotation: (i) => i * 47,
        scale: 1,
        opacity: 0,
        duration: 1.2,
        ease: 'power3.out',
        stagger: 0.01,
      },
      0.35,
    )
})
</script>

<template>
  <div ref="root" class="relative mx-auto grid h-28 w-28 place-items-center" aria-hidden="true">
    <span
      v-for="(p, i) in pieces"
      :key="i"
      class="piece absolute left-1/2 top-1/2 -ml-1.5 -mt-1.5 h-3 w-3 opacity-0"
      :class="p.shape === 0 ? 'rounded-full' : p.shape === 1 ? 'rounded-sm' : ''"
      :style="{ background: p.color, clipPath: p.shape === 2 ? 'polygon(50% 0, 100% 100%, 0 100%)' : undefined }"
    />
    <svg viewBox="0 0 80 80" class="burst-ring h-28 w-28 drop-shadow-lg">
      <circle cx="40" cy="40" r="36" fill="#7C8445" />
      <circle cx="40" cy="40" r="30" fill="#8E974F" />
      <path class="check" d="M25 41 L35 51 L56 29" fill="none" stroke="#FFF8ED" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="60" stroke-dashoffset="0" />
    </svg>
  </div>
</template>
