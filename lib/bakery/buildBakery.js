// Builds the stylised-realistic PizzaPan bakery (exterior + interior) from Three.js primitives.
// Units are metres. The storefront sits on the z = 0 plane; the shop interior extends towards -z.
import { createTextureFactory, waitForFonts } from './textures'

/** World positions of interactive hotspots. Labels/actions live in the Vue component. */
export const HOTSPOT_POSITIONS = {
  door: [0, 1.75, 0.45],
  menu: [2.1, 3.15, -11.7],
  display: [-1.5, 1.85, -7.3],
  oven: [-2.6, 2.25, -9.5],
  fridge: [4.75, 2.1, -9.6],
  dessert: [0.95, 1.65, -7.3],
  register: [2.45, 1.6, -7.3],
  veg: [-3.15, 1.5, -7.3],
  bread: [-4.75, 2.05, -8.4],
  spicy: [-4.7, 2.75, -11.75],
  offers: [3.6, 1.75, -6.2],
}

export async function buildBakery(THREE, renderer, { low = false } = {}) {
  await waitForFonts()
  const T = createTextureFactory(THREE, renderer)
  const root = new THREE.Group()
  const interactive = []
  const animators = []
  const shadows = !low

  // ── helpers ──────────────────────────────────────────────────
  const std = (o) => new THREE.MeshStandardMaterial(o)
  const add = (mesh, parent = root, { cast = true, receive = true } = {}) => {
    mesh.castShadow = shadows && cast
    mesh.receiveShadow = shadows && receive
    parent.add(mesh)
    return mesh
  }
  const box = (w, h, d, mat, x, y, z, parent, opts) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
    m.position.set(x, y, z)
    return add(m, parent, opts)
  }
  const cyl = (rt, rb, h, mat, x, y, z, parent, seg = low ? 14 : 24, opts) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat)
    m.position.set(x, y, z)
    return add(m, parent, opts)
  }
  const sphere = (r, mat, x, y, z, parent, seg = low ? 10 : 18) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.round(seg * 0.7)), mat)
    m.position.set(x, y, z)
    return add(m, parent)
  }
  const plane = (w, h, mat, x, y, z, parent, opts) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat)
    m.position.set(x, y, z)
    return add(m, parent, { cast: false, ...opts })
  }
  const tag = (id, ...meshes) => {
    meshes.forEach((m) =>
      m.traverse((o) => {
        if (o.isMesh) {
          o.userData.hotspot = id
          interactive.push(o)
        }
      }),
    )
  }

  // ── shared materials ─────────────────────────────────────────
  const brickTex = T.brick([150, 62, 44], '#b59d86', 3)
  const brickMat = (w, h) => std({ map: T.repeat(brickTex, w / 1.6, h / 1.6), roughness: 0.92 })
  const trim = std({ color: '#1d1714', roughness: 0.45, metalness: 0.35 })
  const brass = std({ color: '#c9a55a', roughness: 0.3, metalness: 0.85 })
  const copper = std({ color: '#b8703f', roughness: 0.35, metalness: 0.8 })
  const glass = std({
    color: '#bcd6e2',
    roughness: 0.04,
    metalness: 0.1,
    transparent: true,
    opacity: 0.16,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
  const woodTex = T.wood('#7a4b2e', 11)
  const darkWoodTex = T.wood('#4a2c1c', 13, 8)
  const marble = std({ color: '#efe7dc', roughness: 0.28, metalness: 0.02 })
  const greenery = std({ color: '#3f6b2a', roughness: 0.85 })
  const greenery2 = std({ color: '#557f35', roughness: 0.85 })
  const terracotta = std({ color: '#a8532f', roughness: 0.8 })
  const red = std({ color: '#b81f21', roughness: 0.5, metalness: 0.2 })

  // ── sky, street & neighbours ────────────────────────────────
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(80, 24, 16),
    new THREE.MeshBasicMaterial({ map: T.sky(), side: THREE.BackSide, fog: false, depthWrite: false }),
  )
  root.add(sky)

  const concreteTex = T.concrete()
  plane(40, 7.2, std({ map: T.repeat(concreteTex, 40 / 1.5, 7.2 / 1.5), roughness: 0.95 }), 0, 0, 3.6, root).rotation.x =
    -Math.PI / 2
  box(40, 0.16, 0.3, std({ color: '#8d857d', roughness: 0.9 }), 0, 0.08, 7.35, root)
  const road = plane(80, 40, std({ color: '#1f1c1b', roughness: 0.75, metalness: 0.1 }), 0, -0.02, 27.5, root)
  road.rotation.x = -Math.PI / 2
  const dash = std({ color: '#d9b44a', roughness: 0.6 })
  for (let x = -24; x <= 24; x += 4) plane(1.8, 0.14, dash, x, -0.01, 12, root).rotation.x = -Math.PI / 2

  const neighbour = (x, h, tint, seed) => {
    const tex = T.brick(tint, '#6f6258', seed)
    box(10, h, 8, std({ map: T.repeat(tex, 10 / 1.6, h / 1.6), roughness: 0.95 }), x, h / 2, -4, root)
    const lit = std({ color: '#2a1d14', emissive: '#ff9f45', emissiveIntensity: 0.35 })
    const dark = std({ color: '#161a22', roughness: 0.2, metalness: 0.4 })
    for (let i = 0; i < 3; i++) {
      const wx = x - 3 + i * 3
      box(1.5, 1.7, 0.08, trim, wx, h - 2.2, 0, root)
      plane(1.3, 1.5, (i + seed) % 2 ? lit : dark, wx, h - 2.2, 0.05, root)
    }
    plane(6, 2.2, dark, x, 1.6, 0.01, root)
  }
  neighbour(-11.05, 7.6, [92, 74, 66], 17)
  neighbour(11.05, 6.8, [110, 84, 64], 19)

  // Street lamps
  const lampLights = []
  const streetLamp = (x, z) => {
    const g = new THREE.Group()
    g.position.set(x, 0, z)
    cyl(0.07, 0.1, 4.3, trim, 0, 2.15, 0, g)
    cyl(0.18, 0.22, 0.25, trim, 0, 0.12, 0, g)
    box(0.9, 0.06, 0.06, trim, 0.45, 4.25, 0, g).castShadow = false
    const head = cyl(0.22, 0.12, 0.3, trim, 0.85, 4.1, 0, g)
    head.castShadow = false
    sphere(0.12, new THREE.MeshBasicMaterial({ color: '#ffe2ad' }), 0.85, 3.93, 0, g)
    root.add(g)
    const light = new THREE.PointLight('#ffc98a', low ? 26 : 32, 16, 1.6)
    light.position.set(x + 0.85, 3.8, z)
    root.add(light)
    lampLights.push(light)
  }
  streetLamp(-7.4, 6.5)
  if (!low) streetLamp(7.4, 6.5)

  // ── facade ───────────────────────────────────────────────────
  const facadePiece = (x0, x1, y0, y1) => box(x1 - x0, y1 - y0, 0.3, brickMat(x1 - x0, y1 - y0), (x0 + x1) / 2, (y0 + y1) / 2, 0, root)
  ;[
    [-6, -5.2, 0, 3.4],
    [-5.2, -1.8, 0, 0.8],
    [-1.8, -1.12, 0, 3.4],
    [1.12, 1.8, 0, 3.4],
    [1.8, 5.2, 0, 0.8],
    [5.2, 6, 0, 3.4],
    [-1.12, 1.12, 2.92, 3.4],
    [-5.2, -1.8, 3.0, 3.4],
    [1.8, 5.2, 3.0, 3.4],
    [-6, 6, 3.4, 5.9],
  ].forEach((p) => facadePiece(...p))
  box(12.5, 0.28, 0.6, trim, 0, 5.95, 0.05, root)
  box(12.2, 0.12, 0.4, brass, 0, 3.42, 0.12, root, { cast: false })

  // windows
  const windowUnit = (x0, x1, decal) => {
    const w = x1 - x0
    const cx = (x0 + x1) / 2
    plane(w, 2.2, glass, cx, 1.9, 0, root, { receive: false })
    const t = 0.08
    box(w, t, 0.14, trim, cx, 3.0 - t / 2, 0.02, root)
    box(w + 0.2, 0.1, 0.42, std({ color: '#3a2f2a', roughness: 0.6 }), cx, 0.8, 0.14, root)
    box(t, 2.2, 0.14, trim, x0 + t / 2, 1.9, 0.02, root)
    box(t, 2.2, 0.14, trim, x1 - t / 2, 1.9, 0.02, root)
    box(0.06, 2.2, 0.1, trim, cx, 1.9, 0.02, root)
    box(w, 0.06, 0.1, trim, cx, 2.45, 0.02, root)
    const d = plane(w - 0.3, (w - 0.3) / 4, new THREE.MeshBasicMaterial({ map: decal, transparent: true, depthWrite: false }), cx, 1.75, 0.03, root)
    d.renderOrder = 2
  }
  windowUnit(-5.2, -1.8, T.windowDecal('Wood-Fired Pizza', 'FRESH DOUGH · DAILY'))
  windowUnit(1.8, 5.2, T.windowDecal('Bakery & Café', 'OPEN DAILY 10:00 – 23:00'))

  // door surround & threshold
  box(0.1, 2.97, 0.36, trim, -1.17, 1.485, 0, root)
  box(0.1, 2.97, 0.36, trim, 1.17, 1.485, 0, root)
  box(2.44, 0.1, 0.36, trim, 0, 2.95, 0, root)
  box(2.7, 0.06, 0.7, std({ color: '#8a7f75', roughness: 0.8 }), 0, 0.03, 0.4, root)

  // doors (pivot groups at the hinges, swing inwards)
  const makeLeaf = (dir) => {
    const pivot = new THREE.Group()
    pivot.position.set(-1.1 * dir, 0, 0)
    const u = (v) => v * dir
    const frame = std({ color: '#2b211c', roughness: 0.35, metalness: 0.5 })
    box(0.08, 2.88, 0.07, frame, u(0.04), 1.44, 0, pivot)
    box(0.08, 2.88, 0.07, frame, u(1.06), 1.44, 0, pivot)
    box(1.1, 0.1, 0.07, frame, u(0.55), 2.83, 0, pivot)
    box(1.1, 0.32, 0.07, frame, u(0.55), 0.16, 0, pivot)
    plane(0.94, 2.46, glass, u(0.55), 1.55, 0, pivot, { receive: false })
    const bar = cyl(0.022, 0.022, 0.72, brass, u(0.55), 1.12, 0.07, pivot, 10)
    bar.rotation.z = Math.PI / 2
    box(0.03, 0.03, 0.07, brass, u(0.22), 1.12, 0.04, pivot)
    box(0.03, 0.03, 0.07, brass, u(0.88), 1.12, 0.04, pivot)
    root.add(pivot)
    return pivot
  }
  const doorLeft = makeLeaf(1)
  const doorRight = makeLeaf(-1)
  const open = plane(0.44, 0.22, new THREE.MeshBasicMaterial({ map: T.openSign(), transparent: true }), 0.55, 1.95, 0.045, doorLeft)
  open.renderOrder = 3
  tag('door', doorLeft, doorRight)

  // awning + valance
  const awningTex = T.awning()
  awningTex.repeat.set(2.5, 1)
  const awningMat = std({ map: awningTex, roughness: 0.85, side: THREE.DoubleSide })
  const slope = Math.atan2(0.45, 1.1)
  const aw = plane(10.8, 1.19, awningMat, 0, 3.225, 0.7, root, { cast: true })
  aw.rotation.x = -Math.PI / 2 + slope
  const valTex = T.valance()
  valTex.wrapS = THREE.RepeatWrapping
  valTex.repeat.set(1.25, 1)
  plane(10.8, 0.3, std({ map: valTex, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.85 }), 0, 2.86, 1.26, root, { cast: true })

  // shop sign
  box(6.5, 1.42, 0.16, trim, 0, 4.62, 0.2, root)
  const signTex = T.sign()
  plane(6.2, 1.33, std({ map: signTex, emissive: '#ffffff', emissiveMap: signTex, emissiveIntensity: 0.85, roughness: 0.5 }), 0, 4.62, 0.29, root)
  for (const x of [-2.4, 0, 2.4]) {
    const arm = box(0.04, 0.04, 0.55, trim, x, 5.5, 0.45, root)
    arm.castShadow = false
    const shade = cyl(0.03, 0.13, 0.16, trim, x, 5.44, 0.72, root, 12)
    shade.rotation.x = 0.5
  }

  // planters & street furniture
  const planter = (x, z, big) => {
    box(big ? 1.0 : 0.55, big ? 0.6 : 0.5, big ? 0.6 : 0.55, std({ color: '#2e2622', roughness: 0.7 }), x, big ? 0.3 : 0.25, z, root)
    sphere(big ? 0.5 : 0.32, greenery, x, big ? 1.0 : 0.72, z, root)
    sphere(big ? 0.34 : 0.22, greenery2, x + 0.22, big ? 1.25 : 0.88, z + 0.05, root)
    sphere(big ? 0.3 : 0.2, greenery2, x - 0.25, big ? 1.18 : 0.84, z - 0.05, root)
  }
  planter(-1.62, 0.5, false)
  planter(1.62, 0.5, false)
  planter(-5.6, 0.55, true)
  planter(5.6, 0.55, true)

  // bench
  const bench = new THREE.Group()
  bench.position.set(-3.5, 0, 1.4)
  box(1.7, 0.07, 0.46, std({ map: woodTex, roughness: 0.7 }), 0, 0.47, 0, bench)
  box(1.7, 0.36, 0.05, std({ map: woodTex, roughness: 0.7 }), 0, 0.72, -0.22, bench)
  for (const x of [-0.7, 0.7]) box(0.06, 0.47, 0.42, trim, x, 0.235, 0, bench)
  root.add(bench)

  // A-frame specials board (outside)
  const aframe = new THREE.Group()
  aframe.position.set(3.3, 0, 1.6)
  aframe.rotation.y = -0.35
  const aBoard = T.specialsBoard('Today’s Special', ['Ceylon Devilled', 'Chicken Pizza', 'Only today', 'LKR 2,550'])
  const front = box(0.78, 1.05, 0.04, std({ map: woodTex }), 0, 0.5, 0.18, aframe)
  front.rotation.x = -0.2
  const back = box(0.78, 1.05, 0.04, std({ map: woodTex }), 0, 0.5, -0.18, aframe)
  back.rotation.x = 0.2
  const chalkFace = plane(0.66, 0.84, std({ map: aBoard, roughness: 0.9 }), 0, 0.52, 0.205, aframe)
  chalkFace.rotation.x = -0.2
  chalkFace.position.z = 0.205
  root.add(aframe)

  // ── interior shell ───────────────────────────────────────────
  const floorTex = T.checker()
  floorTex.repeat.set(2.9, 3)
  const floor = plane(11.7, 12, std({ map: floorTex, roughness: 0.42, metalness: 0.05 }), 0, 0.004, -6.1, root)
  floor.rotation.x = -Math.PI / 2

  const ceil = plane(11.7, 12, std({ map: T.repeat(darkWoodTex, 4, 4), roughness: 0.8 }), 0, 4.2, -6.1, root, { receive: false })
  ceil.rotation.x = Math.PI / 2
  for (let z = -1.5; z > -12; z -= 2.2) box(11.7, 0.18, 0.18, std({ map: darkWoodTex, roughness: 0.8 }), 0, 4.1, z, root, { cast: false })

  const whiteBrick = T.brick([214, 190, 162], '#efe3d0', 23)
  plane(11.7, 4.2, std({ map: T.repeat(whiteBrick, 11.7 / 1.8, 4.2 / 1.8), roughness: 0.9 }), 0, 2.1, -12, root)
  const plasterTex = T.plaster('#ead8bb')
  const lw = plane(12, 4.2, std({ map: T.repeat(plasterTex, 4, 1.4), roughness: 0.95 }), -5.85, 2.1, -6, root)
  lw.rotation.y = Math.PI / 2
  const rw = plane(12, 4.2, std({ map: T.repeat(plasterTex, 4, 1.4), roughness: 0.95 }), 5.85, 2.1, -6, root)
  rw.rotation.y = -Math.PI / 2
  const wainscot = std({ map: T.repeat(woodTex, 6, 1), roughness: 0.7 })
  box(0.06, 1.1, 11.8, wainscot, -5.82, 0.55, -6.05, root)
  box(0.06, 1.1, 11.8, wainscot, 5.82, 0.55, -6.05, root)
  box(11.6, 1.1, 0.06, wainscot, 0, 0.55, -11.96, root)
  box(0.08, 0.06, 11.8, brass, -5.78, 1.12, -6.05, root, { cast: false })
  box(0.08, 0.06, 11.8, brass, 5.78, 1.12, -6.05, root, { cast: false })

  // neon sign on the left wall
  const neon = plane(4.4, 0.69, new THREE.MeshBasicMaterial({ map: T.neon('Fresh · Hot · Made for You'), transparent: true, depthWrite: false }), -5.8, 3.25, -6.4, root)
  neon.rotation.y = Math.PI / 2

  // ── counter & display ───────────────────────────────────────
  const counter = new THREE.Group()
  root.add(counter)
  box(6.4, 1.0, 0.9, std({ map: T.repeat(woodTex, 3, 0.6), roughness: 0.6 }), 0.4, 0.5, -7.3, counter)
  box(6.62, 0.08, 1.06, marble, 0.4, 1.04, -7.3, counter)
  box(6.4, 0.12, 0.92, trim, 0.4, 0.06, -7.3, counter)
  const rail = cyl(0.025, 0.025, 6.2, brass, 0.4, 0.2, -6.72, counter, 10)
  rail.rotation.z = Math.PI / 2
  // tiled accent band
  const bandTex = T.checker('#D62828', '#FFF8ED', 8)
  bandTex.repeat.set(12, 0.6)
  box(6.42, 0.24, 0.02, std({ map: bandTex, roughness: 0.4 }), 0.4, 0.78, -6.84, counter, { cast: false })

  // display case with turning pizzas
  const display = new THREE.Group()
  display.position.set(-1.5, 1.08, -7.3)
  counter.add(display)
  const caseGlass = box(2.0, 0.6, 0.85, glass, 0, 0.3, 0, display, { cast: false, receive: false })
  box(2.04, 0.04, 0.89, trim, 0, 0.62, 0, display)
  box(2.04, 0.05, 0.89, trim, 0, 0.02, 0, display)
  box(1.9, 0.02, 0.05, new THREE.MeshBasicMaterial({ color: '#fff1cf' }), 0, 0.58, -0.3, display, { cast: false })
  const crust = std({ color: '#c9823c', roughness: 0.7 })
  const displayPizzas = [-0.62, 0, 0.62].map((x, i) => {
    const top = std({ map: T.pizzaTop(i), roughness: 0.55 })
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.035, 32), [crust, top, crust])
    p.position.set(x, 0.09, 0.02)
    display.add(add(p))
    return p
  })
  tag('display', caseGlass, ...displayPizzas)
  animators.push((t) => displayPizzas.forEach((p, i) => (p.rotation.y = t * 0.25 + i)))

  // dessert stand with glass dome
  const dessert = new THREE.Group()
  dessert.position.set(0.95, 1.08, -7.3)
  counter.add(dessert)
  cyl(0.24, 0.24, 0.02, marble, 0, 0.12, 0, dessert)
  cyl(0.03, 0.06, 0.12, brass, 0, 0.06, 0, dessert, 10)
  cyl(0.16, 0.17, 0.14, std({ color: '#3a1c12', roughness: 0.5 }), 0, 0.2, 0, dessert)
  cyl(0.165, 0.165, 0.025, std({ color: '#5a2c1b', roughness: 0.35 }), 0, 0.28, 0, dessert)
  sphere(0.03, red, 0.05, 0.31, 0.02, dessert, 10)
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.26, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), glass)
  dome.position.y = 0.13
  dessert.add(dome)
  sphere(0.025, brass, 0, 0.4, 0, dessert, 8)
  tag('dessert', dessert)

  // register
  const register = new THREE.Group()
  register.position.set(2.45, 1.08, -7.35)
  register.rotation.y = 0.35
  counter.add(register)
  box(0.48, 0.16, 0.4, trim, 0, 0.08, 0, register)
  const screen = box(0.38, 0.26, 0.03, std({ color: '#111', emissive: '#f7b267', emissiveIntensity: 0.6 }), 0, 0.33, 0.06, register)
  screen.rotation.x = -0.35
  box(0.05, 0.16, 0.05, trim, 0, 0.2, 0.08, register)
  tag('register', register)

  // pizza boxes
  const boxTop = T.pizzaBox()
  const kraft = std({ color: '#c99b64', roughness: 0.85 })
  for (let i = 0; i < 4; i++) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.5), [kraft, kraft, std({ map: boxTop, roughness: 0.85 }), kraft, kraft, kraft])
    b.position.set(3.3, 1.11 + i * 0.062, -7.3)
    b.rotation.y = (i % 2 ? 0.08 : -0.06) + 0.2
    counter.add(add(b))
  }

  // vegetable crate
  const crate = new THREE.Group()
  crate.position.set(-3.15, 1.08, -7.3)
  counter.add(crate)
  box(0.62, 0.22, 0.42, std({ map: woodTex, roughness: 0.75 }), 0, 0.11, 0, crate)
  const tomato = std({ color: '#d0302a', roughness: 0.35 })
  const pepper = std({ color: '#2f8a3a', roughness: 0.35 })
  const onion = std({ color: '#8d3f73', roughness: 0.45 })
  ;[
    [-0.2, 0.08, tomato],
    [-0.08, -0.08, tomato],
    [0.04, 0.1, tomato],
    [0.18, -0.06, pepper],
    [0.2, 0.1, pepper],
    [-0.18, -0.1, onion],
    [0.06, -0.08, onion],
  ].forEach(([x, z, m]) => sphere(0.075, m, x, 0.27, z, crate, 10))
  tag('veg', crate)

  // ── pendant lamps & ceiling fan ─────────────────────────────
  const bulbMat = new THREE.MeshBasicMaterial({ color: '#ffe3ae' })
  const pendantLights = []
  ;[-1.8, 0.4, 2.6].forEach((x, i) => {
    cyl(0.008, 0.008, 0.95, trim, x, 3.72, -7.0, root, 6).castShadow = false
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.3, low ? 14 : 24, 1, true), std({ color: '#b8703f', metalness: 0.75, roughness: 0.32, side: THREE.DoubleSide }))
    shade.position.set(x, 3.13, -7.0)
    add(shade, root, { cast: false })
    sphere(0.07, bulbMat, x, 2.99, -7.0, root, 10).castShadow = false
    if (i !== 1 || !low) {
      const l = new THREE.PointLight('#ffc27a', 9, 9, 1.8)
      l.position.set(x, 2.85, -7.0)
      root.add(l)
      pendantLights.push(l)
    }
  })

  const fan = new THREE.Group()
  fan.position.set(0, 3.95, -3.8)
  root.add(fan)
  cyl(0.02, 0.02, 0.25, trim, 0, 0.12, 0, fan, 8)
  cyl(0.12, 0.12, 0.1, brass, 0, 0, 0, fan, 16)
  for (let i = 0; i < 4; i++) {
    const blade = box(1.05, 0.015, 0.17, std({ map: darkWoodTex, roughness: 0.7 }), 0, -0.02, 0, fan, { cast: false })
    blade.geometry.translate(0.6, 0, 0)
    blade.rotation.y = (i * Math.PI) / 2
  }
  animators.push((t, dt) => (fan.rotation.y += dt * 2.2))

  // ── brick oven ──────────────────────────────────────────────
  const oven = new THREE.Group()
  oven.position.set(-2.6, 0, -10.8)
  root.add(oven)
  const ovenBrick = T.brick([128, 50, 34], '#5c4033', 29)
  box(3.0, 1.0, 2.2, std({ map: T.repeat(ovenBrick, 2, 0.7), roughness: 0.95 }), 0, 0.5, 0, oven)
  const domeMesh = new THREE.Mesh(
    new THREE.SphereGeometry(1.3, low ? 20 : 32, low ? 10 : 16, 0, Math.PI * 2, 0, Math.PI / 2),
    std({ map: T.repeat(ovenBrick, 4, 1.4), roughness: 0.95 }),
  )
  domeMesh.position.y = 1.0
  domeMesh.scale.y = 0.85
  add(domeMesh, oven)
  const arch = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.09, 8, 24, Math.PI), std({ color: '#5c2a1c', roughness: 0.9 }))
  arch.position.set(0, 1.4, 1.27)
  add(arch, oven)
  box(0.18, 0.4, 0.2, std({ color: '#5c2a1c', roughness: 0.9 }), -0.46, 1.2, 1.25, oven)
  box(0.18, 0.4, 0.2, std({ color: '#5c2a1c', roughness: 0.9 }), 0.46, 1.2, 1.25, oven)
  const mouthShape = new THREE.Shape()
  mouthShape.moveTo(-0.42, 0)
  mouthShape.lineTo(0.42, 0)
  mouthShape.lineTo(0.42, 0.4)
  mouthShape.absarc(0, 0.4, 0.42, 0, Math.PI, false)
  mouthShape.lineTo(-0.42, 0)
  const fireTex = T.fire()
  fireTex.repeat.set(1.2, 1.2)
  fireTex.offset.set(-0.1, -0.05)
  const mouth = new THREE.Mesh(new THREE.ShapeGeometry(mouthShape, 16), new THREE.MeshBasicMaterial({ map: fireTex }))
  mouth.position.set(0, 1.0, 1.3)
  oven.add(mouth)
  box(3.1, 0.08, 0.45, std({ color: '#8a7f75', roughness: 0.7 }), 0, 1.02, 1.2, oven)
  cyl(0.24, 0.3, 2.3, copper, 0, 3.1, -0.4, oven)
  // firewood stack
  const logMat = std({ color: '#5a3a22', roughness: 0.9 })
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3 - r; c++) {
      const log = cyl(0.08, 0.08, 0.7, logMat, 1.75, 0.09 + r * 0.15, -0.5 + c * 0.17 + r * 0.085, oven, 10)
      log.rotation.x = Math.PI / 2
    }
  }
  const ovenLight = new THREE.PointLight('#ff7a2e', 6, 7, 1.6)
  ovenLight.position.set(0, 1.3, 1.9)
  oven.add(ovenLight)
  animators.push((t) => {
    ovenLight.intensity = 5.5 + Math.sin(t * 7.3) * 0.8 + Math.sin(t * 13.1) * 0.5
    fireTex.offset.y = -0.05 + Math.sin(t * 3) * 0.015
  })
  tag('oven', domeMesh, mouth, arch)

  // chilli garland (spicy hotspot)
  const garland = new THREE.Group()
  garland.position.set(-4.7, 2.05, -11.9)
  root.add(garland)
  cyl(0.006, 0.006, 1.3, std({ color: '#c8b48a' }), 0, 0.6, 0.03, garland, 6)
  const chilli = std({ color: '#c41d1d', roughness: 0.35 })
  for (let i = 0; i < 9; i++) {
    const c = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.2, 10), chilli)
    c.position.set((i % 2 ? 0.07 : -0.07), 0.05 + i * 0.13, 0.06)
    c.rotation.z = i % 2 ? 0.5 : -0.5
    c.rotation.x = Math.PI
    add(c, garland)
  }
  tag('spicy', garland)

  // menu board
  box(3.85, 2.18, 0.08, std({ map: darkWoodTex, roughness: 0.7 }), 2.1, 2.85, -11.94, root)
  const menuTex = T.menuBoard()
  const board = plane(3.6, 1.97, std({ map: menuTex, emissive: '#ffffff', emissiveMap: menuTex, emissiveIntensity: 0.35, roughness: 0.9 }), 2.1, 2.85, -11.89, root)
  tag('menu', board)

  // bread rack (garlic bread & sides)
  const rack = new THREE.Group()
  rack.position.set(-4.85, 0, -8.4)
  rack.rotation.y = Math.PI / 2
  root.add(rack)
  const rackWood = std({ map: woodTex, roughness: 0.7 })
  for (const x of [-0.6, 0.6]) box(0.06, 2.0, 0.5, rackWood, x, 1.0, 0, rack)
  const loafMat = std({ color: '#d4954a', roughness: 0.6 })
  const loafMat2 = std({ color: '#b8742f', roughness: 0.6 })
  ;[0.5, 1.05, 1.6].forEach((y, si) => {
    box(1.26, 0.04, 0.5, rackWood, 0, y, 0, rack)
    for (let i = 0; i < 4; i++) {
      const loaf = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.26, 4, 10), (i + si) % 2 ? loafMat : loafMat2)
      loaf.rotation.z = Math.PI / 2
      loaf.rotation.y = (i % 2 ? 0.25 : -0.2) + 0.1 * si
      loaf.position.set(-0.4 + i * 0.27, y + 0.09, 0)
      add(loaf, rack)
    }
  })
  const basket = cyl(0.26, 0.2, 0.32, std({ color: '#9b6a3a', roughness: 0.9 }), 0, 0.16, 0.55, rack)
  for (let i = 0; i < 5; i++) {
    const bag = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.6, 4, 8), loafMat)
    bag.position.set(-0.12 + i * 0.06, 0.55, 0.55 + (i % 2 ? 0.05 : -0.05))
    bag.rotation.z = -0.25 + i * 0.12
    add(bag, rack)
  }
  tag('bread', rack, basket)

  // decorative wall shelves (jars) on the left wall
  const shelf = new THREE.Group()
  shelf.position.set(-5.6, 0, -4.4)
  root.add(shelf)
  const jarColors = ['#c0302a', '#7c8445', '#e0a43a', '#6b3a1f', '#efe0c0']
  ;[1.6, 2.2].forEach((y, si) => {
    box(0.4, 0.05, 2.2, rackWood, 0, y, 0, shelf)
    for (let i = 0; i < 6; i++) {
      cyl(0.07, 0.07, 0.22, std({ color: jarColors[(i + si) % 5], roughness: 0.25, metalness: 0.05 }), 0, y + 0.14, -0.9 + i * 0.36, shelf, 12)
      cyl(0.075, 0.075, 0.04, brass, 0, y + 0.27, -0.9 + i * 0.36, shelf, 12)
    }
  })

  // drinks fridge
  const fridge = new THREE.Group()
  fridge.position.set(5.3, 0, -9.6)
  root.add(fridge)
  box(1.0, 2.15, 1.25, red, 0, 1.075, 0, fridge)
  const fridgeGlow = plane(1.05, 1.75, new THREE.MeshBasicMaterial({ color: '#dff1ff' }), 0.42, 1.12, 0, fridge)
  fridgeGlow.rotation.y = -Math.PI / 2
  const bottleColors = ['#7a1d12', '#3f8e2f', '#e0a43a', '#c41d1d', '#2a6db3']
  ;[0.45, 0.95, 1.45].forEach((y) => {
    box(0.6, 0.02, 1.05, std({ color: '#cfd8de', metalness: 0.6, roughness: 0.3 }), -0.1, y, 0, fridge, { cast: false })
    for (let i = 0; i < 5; i++) {
      const b = cyl(0.045, 0.05, 0.28, std({ color: bottleColors[(i + Math.round(y * 2)) % 5], roughness: 0.2, metalness: 0.1 }), -0.25, y + 0.15, -0.4 + i * 0.2, fridge, 10)
      b.castShadow = false
    }
  })
  const fridgeDoor = plane(1.15, 1.85, glass, -0.51, 1.12, 0, fridge)
  fridgeDoor.rotation.y = -Math.PI / 2
  box(0.06, 0.25, 1.25, std({ color: '#211a17' }), -0.5, 2.0, 0, fridge)
  box(0.04, 0.6, 0.04, brass, -0.56, 1.15, -0.5, fridge)
  tag('fridge', fridge)

  // offers standee (inside)
  const standee = new THREE.Group()
  standee.position.set(3.6, 0, -6.2)
  standee.rotation.y = -0.45
  root.add(standee)
  const dealsTex = T.specialsBoard('Today’s Deals', ['Family Feast', 'LKR 6,950', 'Use code PIZZA10', '10% OFF'])
  box(0.82, 1.15, 0.05, std({ map: woodTex }), 0, 1.0, 0, standee)
  plane(0.7, 0.98, std({ map: dealsTex, roughness: 0.9, emissive: '#ffffff', emissiveMap: dealsTex, emissiveIntensity: 0.2 }), 0, 1.0, 0.03, standee)
  for (const x of [-0.3, 0.3]) {
    const leg = box(0.04, 0.5, 0.04, trim, x, 0.25, 0, standee)
    leg.rotation.x = 0.1
  }
  tag('offers', standee)

  // bistro tables & chairs
  const table = (x, z) => {
    const g = new THREE.Group()
    g.position.set(x, 0, z)
    root.add(g)
    cyl(0.5, 0.5, 0.04, marble, 0, 0.76, 0, g, low ? 18 : 32)
    cyl(0.04, 0.05, 0.72, trim, 0, 0.38, 0, g, 10)
    cyl(0.28, 0.3, 0.03, trim, 0, 0.015, 0, g)
    const tp = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.03, 24), [crust, std({ map: T.pizzaTop(x > 0 ? 2 : 0), roughness: 0.55 }), crust])
    tp.position.set(0.05, 0.795, 0.05)
    g.add(add(tp))
    cyl(0.03, 0.03, 0.08, new THREE.MeshBasicMaterial({ color: '#ffd28a' }), -0.28, 0.82, -0.12, g, 10)
    if (!low) {
      for (const s of [-1, 1]) {
        const chair = new THREE.Group()
        chair.position.set(s * 0.78, 0, 0.1)
        chair.rotation.y = s * -Math.PI / 2
        g.add(chair)
        cyl(0.21, 0.21, 0.04, red, 0, 0.46, 0, chair)
        for (const [lx, lz] of [[-0.14, -0.14], [0.14, -0.14], [-0.14, 0.14], [0.14, 0.14]]) cyl(0.012, 0.012, 0.46, trim, lx, 0.23, lz, chair, 6)
        box(0.38, 0.3, 0.03, red, 0, 0.78, -0.2, chair)
        box(0.03, 0.34, 0.03, trim, -0.16, 0.62, -0.2, chair)
        box(0.03, 0.34, 0.03, trim, 0.16, 0.62, -0.2, chair)
      }
    }
  }
  table(-3.3, -3.6)
  table(2.9, -3.4)

  // indoor plants
  const pot = (x, z) => {
    cyl(0.24, 0.18, 0.45, terracotta, x, 0.225, z, root)
    sphere(0.38, greenery, x, 0.78, z, root)
    sphere(0.26, greenery2, x + 0.15, 1.05, z + 0.08, root)
    sphere(0.22, greenery2, x - 0.16, 1.0, z - 0.1, root)
  }
  pot(-5.2, -1.0)
  pot(5.2, -1.0)

  // ── lights ───────────────────────────────────────────────────
  const hemi = new THREE.HemisphereLight('#8d86c4', '#3a2a22', 0.9)
  root.add(hemi)

  const dusk = new THREE.DirectionalLight('#ffb98a', 1.6)
  dusk.position.set(-9, 11, 14)
  dusk.target.position.set(0, 1.5, 0)
  root.add(dusk, dusk.target)
  if (shadows) {
    dusk.castShadow = true
    dusk.shadow.mapSize.set(2048, 2048)
    Object.assign(dusk.shadow.camera, { left: -10, right: 10, top: 9, bottom: -4, near: 1, far: 40 })
    dusk.shadow.bias = -0.0008
    dusk.shadow.normalBias = 0.02
  }

  const seating = new THREE.PointLight('#ffd1a1', 10, 10, 1.6)
  seating.position.set(-2.4, 3.7, -3.5)
  root.add(seating)
  if (!low) {
    const seating2 = new THREE.PointLight('#ffd1a1', 10, 10, 1.6)
    seating2.position.set(2.4, 3.7, -3.5)
    root.add(seating2)
  }

  const counterSpot = new THREE.SpotLight('#ffe0b8', low ? 30 : 45, 14, 0.9, 0.55, 1.4)
  counterSpot.position.set(0.4, 4.1, -4.6)
  counterSpot.target.position.set(0.2, 1.0, -8.5)
  root.add(counterSpot, counterSpot.target)
  if (shadows) {
    counterSpot.castShadow = true
    counterSpot.shadow.mapSize.set(1024, 1024)
    counterSpot.shadow.bias = -0.0006
  }

  // ── public API ───────────────────────────────────────────────
  const hotspots = Object.fromEntries(Object.entries(HOTSPOT_POSITIONS).map(([id, p]) => [id, new THREE.Vector3(...p)]))

  return {
    root,
    doors: { left: doorLeft, right: doorRight },
    hotspots,
    interactive,
    update(t, dt) {
      for (const fn of animators) fn(t, dt)
    },
    dispose() {
      root.traverse((o) => {
        if (o.geometry) o.geometry.dispose()
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose())
      })
      T.dispose()
    },
  }
}
