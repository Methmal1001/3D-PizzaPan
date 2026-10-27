// Lazy loaders for heavy browser-only libraries. Three.js is code-split and only
// downloaded when a 3D scene actually mounts.

let threePromise = null

/** Detects WebGL support without keeping a context alive. */
function detectWebGL() {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    const ok = !!(gl && typeof gl.getParameter === 'function')
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
    return ok
  } catch {
    return false
  }
}

export default defineNuxtPlugin(() => {
  return {
    provide: {
      loadThree: () => {
        if (!threePromise) {
          threePromise = Promise.all([import('three'), import('gsap')]).then(([THREE, gsapMod]) => {
            const gsap = gsapMod.gsap || gsapMod.default
            // Keep camera choreography in real time even if a slow device drops frames
            gsap.ticker.lagSmoothing(0)
            return { THREE, gsap }
          })
          threePromise.catch(() => (threePromise = null))
        }
        return threePromise
      },
      detectWebGL,
    },
  }
})
