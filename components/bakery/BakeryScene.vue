<script setup>
// Real-time Three.js bakery. Always render inside <ClientOnly>.
// - Lazy-loads Three.js + GSAP via the three.client plugin
// - Door-opening + camera fly-through when `inside` becomes true
// - Drag / arrow keys to look around inside, clickable 3D objects + accessible DOM hotspots
// - Cleans up renderer, GPU resources, RAF, observers and listeners on unmount
import { CakeSlice, ChefHat, Crown, CupSoda, DoorOpen, Flame, Leaf, ShoppingBag, Tag, UtensilsCrossed, Wheat } from 'lucide-vue-next'

const props = defineProps({
  inside: { type: Boolean, default: false },
  /** Interior hotspots to display (ids from HOTSPOT_META) */
  hotspotIds: {
    type: Array,
    default: () => ['menu', 'display', 'oven', 'fridge', 'dessert', 'register', 'veg', 'bread', 'spicy', 'offers'],
  },
  activeHotspot: { type: String, default: null },
  /** Hide hotspot labels until hover/focus (compact embeds) */
  compactLabels: { type: Boolean, default: false },
})
const emit = defineEmits(['ready', 'failed', 'progress', 'entered', 'exited', 'hotspot'])

const HOTSPOT_META = {
  door: { label: 'Enter PizzaPan', icon: DoorOpen },
  menu: { label: 'Full Menu', icon: UtensilsCrossed },
  display: { label: 'Signature Pizzas', icon: Crown },
  oven: { label: 'Build Your Own', icon: ChefHat },
  fridge: { label: 'Beverages', icon: CupSoda },
  dessert: { label: 'Desserts', icon: CakeSlice },
  register: { label: 'Your Cart', icon: ShoppingBag },
  veg: { label: 'Vegetarian', icon: Leaf },
  bread: { label: 'Garlic Bread & Sides', icon: Wheat },
  spicy: { label: 'Spicy Pizzas', icon: Flame },
  offers: { label: 'Special Offers', icon: Tag },
}

const { $loadThree, $detectWebGL } = useNuxtApp()

const wrap = ref(null)
const canvasEl = ref(null)
const hotspotEls = {}
const mode = ref(props.inside ? 'inside' : 'outside') // outside | entering | inside | exiting
const hovered = ref(null)
const ready = ref(false)

const visibleHotspots = computed(() => {
  if (!ready.value) return []
  if (mode.value === 'outside') return ['door']
  if (mode.value === 'inside') return props.hotspotIds
  return []
})

// Everything below is non-reactive engine state
let THREE, gsap, renderer, scene, camera, bakery, raf, timer, ro, io, pmrem
let disposed = false
let isVisible = true
let tl = null
let elapsed = 0
const cam = { pos: null, look: null }
const view = { yaw: 0, pitch: 0, tYaw: 0, tPitch: 0, px: 0, py: 0, tpx: 0, tpy: 0 }
const pointer = { down: false, x: 0, y: 0, sx: 0, sy: 0, moved: 0, startYaw: 0, startPitch: 0, ndc: null, dirty: false }
let reducedMotion = false
let lowQuality = false

const YAW_LIMIT = 0.9
const PITCH_LIMIT = 0.35

function poses(aspect) {
  const portrait = aspect < 1
  // On wide screens, frame the storefront to the right of the headline copy
  const shift = aspect > 1.25 ? -2.6 : 0
  return {
    fov: portrait ? 66 : 52,
    outside: {
      // Portrait: tilt down so the storefront fills the top half, leaving room for the copy below
      pos: [shift, portrait ? 2.0 : 1.8, portrait ? 9 + (1 - aspect) * 7.5 : 10.8],
      look: [shift, portrait ? -1.0 : 2.35, 0],
    },
    approach: { pos: [0, 1.65, 2.4], look: [0, 1.6, -6] },
    inside: { pos: [0, 1.72, portrait ? -0.9 : -1.4], look: [0, 1.5, -9] },
  }
}

function applyPose(name) {
  const p = poses(camera.aspect)[name]
  cam.pos.set(...p.pos)
  cam.look.set(...p.look)
}

function setDoors(open) {
  bakery.doors.left.rotation.y = open ? 1.45 : 0
  bakery.doors.right.rotation.y = open ? -1.45 : 0
}

// ── camera ──────────────────────────────────────────────────
let tmpDir, tmpRight, tmpTarget, UP

function updateCamera(dt) {
  const k = Math.min(1, dt * 6)
  view.yaw += (view.tYaw - view.yaw) * k
  view.pitch += (view.tPitch - view.pitch) * k
  view.px += (view.tpx - view.px) * Math.min(1, dt * 3)
  view.py += (view.tpy - view.py) * Math.min(1, dt * 3)

  camera.position.copy(cam.pos)
  if (mode.value === 'outside') {
    camera.position.x += view.px * 0.6
    camera.position.y += view.py * 0.25
  }
  tmpDir.copy(cam.look).sub(cam.pos)
  tmpDir.applyAxisAngle(UP, -view.yaw)
  tmpRight.crossVectors(tmpDir, UP).normalize()
  tmpDir.applyAxisAngle(tmpRight, view.pitch)
  tmpTarget.copy(camera.position).add(tmpDir)
  camera.lookAt(tmpTarget)
}

function lookAtHotspot(id) {
  const p = bakery.hotspots[id]
  if (!p) return
  const base = tmpDir.copy(cam.look).sub(cam.pos)
  const baseYaw = Math.atan2(base.x, -base.z)
  const basePitch = Math.atan2(base.y, Math.hypot(base.x, base.z))
  const tx = p.x - cam.pos.x
  const ty = p.y - cam.pos.y
  const tz = p.z - cam.pos.z
  view.tYaw = clamp(Math.atan2(tx, -tz) - baseYaw, -YAW_LIMIT, YAW_LIMIT)
  view.tPitch = clamp(Math.atan2(ty, Math.hypot(tx, tz)) - basePitch, -PITCH_LIMIT, PITCH_LIMIT)
}

const clamp = (v, a, b) => Math.max(a, Math.min(b, v))

// ── door / fly-through choreography ─────────────────────────
function enter() {
  if (!bakery || mode.value === 'inside' || mode.value === 'entering') return
  tl?.kill()
  view.tYaw = view.tPitch = view.tpx = view.tpy = 0
  const P = poses(camera.aspect)
  if (reducedMotion) {
    setDoors(true)
    applyPose('inside')
    mode.value = 'inside'
    emit('entered')
    return
  }
  mode.value = 'entering'
  tl = gsap.timeline({
    onComplete: () => {
      mode.value = 'inside'
      emit('entered')
    },
  })
  tl.to(bakery.doors.left.rotation, { y: 1.45, duration: 1.4, ease: 'power3.inOut' }, 0)
    .to(bakery.doors.right.rotation, { y: -1.45, duration: 1.4, ease: 'power3.inOut' }, 0.08)
    .to(cam.pos, { x: P.approach.pos[0], y: P.approach.pos[1], z: P.approach.pos[2], duration: 1.5, ease: 'power2.inOut' }, 0.25)
    .to(cam.look, { x: P.approach.look[0], y: P.approach.look[1], z: P.approach.look[2], duration: 1.5, ease: 'power2.inOut' }, 0.25)
    .to(cam.pos, { x: P.inside.pos[0], y: P.inside.pos[1], z: P.inside.pos[2], duration: 1.6, ease: 'power2.inOut' }, 1.6)
    .to(cam.look, { x: P.inside.look[0], y: P.inside.look[1], z: P.inside.look[2], duration: 1.6, ease: 'power2.inOut' }, 1.6)
    .fromTo(camera, { fov: P.fov }, { fov: P.fov + 6, duration: 1.2, ease: 'sine.inOut', yoyo: true, repeat: 1, onUpdate: () => camera.updateProjectionMatrix() }, 0.9)
}

function exit() {
  if (!bakery || mode.value === 'outside' || mode.value === 'exiting') return
  tl?.kill()
  view.tYaw = view.tPitch = 0
  const P = poses(camera.aspect)
  if (reducedMotion) {
    setDoors(false)
    applyPose('outside')
    mode.value = 'outside'
    emit('exited')
    return
  }
  mode.value = 'exiting'
  tl = gsap.timeline({
    onComplete: () => {
      mode.value = 'outside'
      emit('exited')
    },
  })
  tl.to(cam.pos, { x: P.approach.pos[0], y: P.approach.pos[1], z: P.approach.pos[2] + 1, duration: 1.3, ease: 'power2.inOut' }, 0)
    .to(cam.look, { x: P.outside.look[0], y: P.outside.look[1], z: P.outside.look[2], duration: 1.3, ease: 'power2.inOut' }, 0)
    .to(cam.pos, { x: P.outside.pos[0], y: P.outside.pos[1], z: P.outside.pos[2], duration: 1.4, ease: 'power2.inOut' }, 1.2)
    .to(bakery.doors.left.rotation, { y: 0, duration: 1.2, ease: 'power2.inOut' }, 1.0)
    .to(bakery.doors.right.rotation, { y: 0, duration: 1.2, ease: 'power2.inOut' }, 1.05)
}

watch(
  () => props.inside,
  (v) => (v ? enter() : exit()),
)

watch(
  () => props.activeHotspot,
  (id) => {
    if (id && mode.value === 'inside') lookAtHotspot(id)
  },
)

// ── interaction ─────────────────────────────────────────────
function activate(id) {
  if (id === 'door') {
    emit('hotspot', 'door')
    return
  }
  lookAtHotspot(id)
  emit('hotspot', id)
}

function setNdc(e) {
  const r = canvasEl.value.getBoundingClientRect()
  pointer.ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
}

let raycaster
function pick() {
  if (!bakery) return null
  raycaster.setFromCamera(pointer.ndc, camera)
  const hits = raycaster.intersectObjects(bakery.interactive, false)
  const id = hits[0]?.object.userData.hotspot || null
  if (!id) return null
  if (mode.value === 'outside') return id === 'door' ? id : null
  if (mode.value === 'inside') return props.hotspotIds.includes(id) ? id : null
  return null
}

function onPointerDown(e) {
  pointer.down = true
  pointer.sx = pointer.x = e.clientX
  pointer.sy = pointer.y = e.clientY
  pointer.moved = 0
  pointer.startYaw = view.tYaw
  pointer.startPitch = view.tPitch
}
function onPointerMove(e) {
  if (!canvasEl.value) return
  setNdc(e)
  pointer.dirty = true
  if (mode.value === 'outside' && e.pointerType === 'mouse') {
    view.tpx = pointer.ndc.x
    view.tpy = pointer.ndc.y
  }
  if (pointer.down) {
    const dx = e.clientX - pointer.sx
    const dy = e.clientY - pointer.sy
    pointer.moved = Math.max(pointer.moved, Math.hypot(dx, dy))
    if (mode.value === 'inside') {
      view.tYaw = clamp(pointer.startYaw - dx * 0.0035, -YAW_LIMIT, YAW_LIMIT)
      view.tPitch = clamp(pointer.startPitch + dy * 0.0025, -PITCH_LIMIT, PITCH_LIMIT)
    }
  }
}
function onPointerUp(e) {
  if (!pointer.down) return
  pointer.down = false
  if (pointer.moved < 8) {
    setNdc(e)
    const id = pick()
    if (id) activate(id)
  }
}
function onPointerLeave() {
  pointer.down = false
  hovered.value = null
  view.tpx = view.tpy = 0
}
function onKey(e) {
  if (mode.value !== 'inside') {
    if ((e.key === 'Enter' || e.key === ' ') && mode.value === 'outside') {
      e.preventDefault()
      emit('hotspot', 'door')
    }
    return
  }
  const step = 0.12
  if (e.key === 'ArrowLeft') view.tYaw = clamp(view.tYaw - step, -YAW_LIMIT, YAW_LIMIT)
  else if (e.key === 'ArrowRight') view.tYaw = clamp(view.tYaw + step, -YAW_LIMIT, YAW_LIMIT)
  else if (e.key === 'ArrowUp') view.tPitch = clamp(view.tPitch + step, -PITCH_LIMIT, PITCH_LIMIT)
  else if (e.key === 'ArrowDown') view.tPitch = clamp(view.tPitch - step, -PITCH_LIMIT, PITCH_LIMIT)
  else return
  e.preventDefault()
}

// ── hotspot overlay positioning (direct DOM writes, no reactivity per frame) ──
let projV
function updateHotspots() {
  const w = canvasEl.value.clientWidth
  const h = canvasEl.value.clientHeight
  for (const id of visibleHotspots.value) {
    const el = hotspotEls[id]
    const p = bakery.hotspots[id]
    if (!el || !p) continue
    projV.copy(p).project(camera)
    const off = projV.z > 1 || Math.abs(projV.x) > 1.05 || Math.abs(projV.y) > 1.05
    if (off) {
      el.style.visibility = 'hidden'
      continue
    }
    el.style.visibility = 'visible'
    el.style.transform = `translate3d(${((projV.x + 1) / 2) * w}px, ${((1 - projV.y) / 2) * h}px, 0)`
  }
}

// ── lifecycle ───────────────────────────────────────────────
function resize() {
  if (!renderer || !wrap.value) return
  const w = wrap.value.clientWidth
  const h = wrap.value.clientHeight
  if (!w || !h) return
  renderer.setSize(w, h, false)
  camera.aspect = w / h
  camera.fov = poses(camera.aspect).fov
  camera.updateProjectionMatrix()
  if (mode.value === 'outside') applyPose('outside')
  else if (mode.value === 'inside') applyPose('inside')
}

function frame(now) {
  raf = requestAnimationFrame(frame)
  if (!isVisible || document.hidden) return
  timer.update(now)
  const dt = Math.min(timer.getDelta(), 0.05)
  elapsed += dt
  bakery.update(elapsed, dt)
  updateCamera(dt)
  if (pointer.dirty && !pointer.down && pointer.ndc) {
    pointer.dirty = false
    const id = pick()
    if (id !== hovered.value) {
      hovered.value = id
      canvasEl.value.style.cursor = id ? 'pointer' : mode.value === 'inside' ? 'grab' : 'default'
    }
  }
  renderer.render(scene, camera)
  updateHotspots()
}

function onContextLost(e) {
  e.preventDefault()
  emit('failed', 'context-lost')
}

onMounted(async () => {
  reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  lowQuality =
    window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768 || (navigator.hardwareConcurrency || 8) <= 4

  if (!$detectWebGL()) return emit('failed', 'no-webgl')
  emit('progress', 15)

  try {
    const libs = await $loadThree()
    if (disposed) return
    THREE = libs.THREE
    gsap = libs.gsap
    emit('progress', 45)

    tmpDir = new THREE.Vector3()
    tmpRight = new THREE.Vector3()
    tmpTarget = new THREE.Vector3()
    projV = new THREE.Vector3()
    UP = new THREE.Vector3(0, 1, 0)
    cam.pos = new THREE.Vector3()
    cam.look = new THREE.Vector3()
    pointer.ndc = new THREE.Vector2()
    raycaster = new THREE.Raycaster()
    timer = new THREE.Timer()

    renderer = new THREE.WebGLRenderer({
      canvas: canvasEl.value,
      antialias: !lowQuality,
      powerPreference: 'high-performance',
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowQuality ? 1.25 : 1.75))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.08
    renderer.shadowMap.enabled = !lowQuality
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    canvasEl.value.addEventListener('webglcontextlost', onContextLost)

    scene = new THREE.Scene()
    scene.fog = new THREE.Fog('#1b1517', 24, 75)
    camera = new THREE.PerspectiveCamera(52, 1, 0.1, 200)

    if (!lowQuality) {
      const { RoomEnvironment } = await import('three/examples/jsm/environments/RoomEnvironment.js')
      pmrem = new THREE.PMREMGenerator(renderer)
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
      scene.environmentIntensity = 0.28
    }

    const { buildBakery } = await import('~/lib/bakery/buildBakery')
    bakery = await buildBakery(THREE, renderer, { low: lowQuality })
    if (disposed) return bakery.dispose()
    scene.add(bakery.root)
    emit('progress', 85)

    resize()
    if (props.inside) {
      setDoors(true)
      applyPose('inside')
    } else {
      applyPose('outside')
    }
    updateCamera(0)
    renderer.compile(scene, camera)
    renderer.render(scene, camera)

    ro = new ResizeObserver(resize)
    ro.observe(wrap.value)
    io = new IntersectionObserver(([entry]) => (isVisible = entry.isIntersecting))
    io.observe(wrap.value)

    raf = requestAnimationFrame(frame)
    ready.value = true
    emit('progress', 100)
    emit('ready', { lowQuality })
  } catch (err) {
    console.error('[PizzaPan] 3D scene failed to initialise', err)
    emit('failed', 'error')
  }
})

onBeforeUnmount(() => {
  disposed = true
  cancelAnimationFrame(raf)
  tl?.kill()
  ro?.disconnect()
  io?.disconnect()
  canvasEl.value?.removeEventListener('webglcontextlost', onContextLost)
  bakery?.dispose()
  scene?.environment?.dispose()
  pmrem?.dispose()
  if (renderer) {
    renderer.dispose()
    renderer.forceContextLoss()
  }
  renderer = scene = camera = bakery = null
})

defineExpose({ enter, exit, lookAtHotspot })
</script>

<template>
  <div ref="wrap" class="relative h-full w-full overflow-hidden bg-[#1b1517]">
    <canvas
      ref="canvasEl"
      class="block h-full w-full outline-none"
      :class="mode === 'inside' ? 'cursor-grab active:cursor-grabbing' : ''"
      style="touch-action: pan-y"
      tabindex="0"
      role="img"
      :aria-label="
        mode === 'inside'
          ? 'Inside the PizzaPan bakery. Use the arrow keys or drag to look around, and the labelled buttons to explore.'
          : 'The PizzaPan bakery storefront at dusk. Press Enter to walk in.'
      "
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointerleave="onPointerLeave"
      @pointercancel="onPointerLeave"
      @keydown="onKey"
    />

    <!-- Hotspot overlay -->
    <div class="pointer-events-none absolute inset-0" aria-label="Bakery hotspots">
      <button
        v-for="id in visibleHotspots"
        :key="id"
        :ref="(el) => (hotspotEls[id] = el)"
        type="button"
        class="hotspot pointer-events-auto absolute left-0 top-0"
        :class="{ 'is-active': hovered === id || activeHotspot === id, 'is-compact': compactLabels }"
        style="visibility: hidden"
        :aria-label="HOTSPOT_META[id].label"
        @click="activate(id)"
        @mouseenter="hovered = id"
        @mouseleave="hovered = null"
      >
        <span class="hotspot-dot">
          <component :is="HOTSPOT_META[id].icon" class="h-4 w-4" aria-hidden="true" />
        </span>
        <span class="hotspot-label">{{ HOTSPOT_META[id].label }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.hotspot {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: -18px 0 0 -18px;
  will-change: transform;
  transition: opacity 0.3s;
}
.hotspot-dot {
  position: relative;
  display: grid;
  place-items: center;
  height: 36px;
  width: 36px;
  border-radius: 9999px;
  background: rgba(33, 26, 23, 0.82);
  color: #fcbf49;
  border: 2px solid rgba(252, 191, 73, 0.85);
  box-shadow: 0 6px 20px -6px rgba(0, 0, 0, 0.6);
  transition: transform 0.2s, background 0.2s, color 0.2s;
}
.hotspot-dot::after {
  content: '';
  position: absolute;
  inset: -6px;
  border-radius: 9999px;
  border: 2px solid rgba(252, 191, 73, 0.6);
  animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
}
.hotspot-label {
  white-space: nowrap;
  border-radius: 9999px;
  background: rgba(255, 248, 237, 0.94);
  color: #211a17;
  font-size: 12px;
  font-weight: 700;
  padding: 6px 12px;
  box-shadow: 0 8px 24px -10px rgba(0, 0, 0, 0.5);
  transition: opacity 0.2s, transform 0.2s;
}
.hotspot.is-compact .hotspot-label {
  opacity: 0;
  transform: translateX(-6px);
}
.hotspot.is-active .hotspot-dot,
.hotspot:focus-visible .hotspot-dot {
  transform: scale(1.12);
  background: #d62828;
  color: #fff;
  border-color: #fff;
}
.hotspot.is-active .hotspot-label,
.hotspot:focus-visible .hotspot-label {
  opacity: 1;
  transform: none;
}
@keyframes ping {
  75%,
  100% {
    transform: scale(1.6);
    opacity: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .hotspot-dot::after {
    animation: none;
  }
}
</style>
