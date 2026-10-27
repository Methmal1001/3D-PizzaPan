// Builds the PizzaPan bakery (exterior + interior) with physically based materials, procedural
// normal/roughness maps, contact shadows and detailed props. Units are metres.
// The storefront sits on the z = 0 plane; the shop interior extends towards -z.
import { createTextureFactory, waitForFonts } from './textures'
import { createMaterialFactory } from './materials'
import { createProps } from './props'
import { mulberry32 } from '~/utils/seeded'

/** World positions of interactive hotspots. Labels/actions live in the Vue component. */
export const HOTSPOT_POSITIONS = {
  door: [0, 1.75, 0.45],
  menu: [2.1, 3.15, -11.7],
  display: [-1.5, 1.8, -7.3],
  oven: [-2.6, 2.3, -9.3],
  fridge: [4.75, 2.1, -9.6],
  dessert: [0.95, 1.62, -7.3],
  register: [2.45, 1.55, -7.3],
  veg: [-3.15, 1.45, -7.3],
  bread: [-4.75, 2.05, -8.4],
  spicy: [-4.7, 2.75, -11.75],
  offers: [3.6, 1.75, -6.2],
}

/** Small helper to build a CanvasTexture from a draw callback. */
function canvasTexture(THREE, w, h, draw, made) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  draw(c.getContext('2d'), w, h)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  made.push(t)
  return t
}

export async function buildBakery(THREE, renderer, { low = false } = {}) {
  await waitForFonts()
  const { RoundedBoxGeometry } = await import('three/examples/jsm/geometries/RoundedBoxGeometry.js')
  const T = createTextureFactory(THREE, renderer)
  const M = createMaterialFactory(THREE, renderer)
  const shadows = !low
  const P = createProps(THREE, M, { low, shadows })
  const extraTextures = []
  const root = new THREE.Group()
  const interactive = []
  const animators = []
  const V2 = (x, y = x) => new THREE.Vector2(x, y)

  // ── helpers ──────────────────────────────────────────────────
  const std = (o) => new THREE.MeshStandardMaterial(o)
  const add = (mesh, parent = root, { cast = true, receive = true } = {}) => {
    mesh.castShadow = shadows && cast
    mesh.receiveShadow = shadows && receive
    parent.add(mesh)
    return mesh
  }
  const place = (geo, mat, x, y, z, parent, opts) => {
    const m = new THREE.Mesh(geo, mat)
    m.position.set(x, y, z)
    return add(m, parent, opts)
  }
  const box = (w, h, d, mat, x, y, z, parent, opts) => place(new THREE.BoxGeometry(w, h, d), mat, x, y, z, parent, opts)
  const rbox = (w, h, d, r, mat, x, y, z, parent, opts) =>
    place(new RoundedBoxGeometry(w, h, d, low ? 1 : 2, r), mat, x, y, z, parent, opts)
  const cyl = (rt, rb, h, mat, x, y, z, parent, seg = low ? 14 : 24, opts) =>
    place(new THREE.CylinderGeometry(rt, rb, h, seg), mat, x, y, z, parent, opts)
  const sphere = (r, mat, x, y, z, parent, seg = low ? 10 : 18) =>
    place(new THREE.SphereGeometry(r, seg, Math.round(seg * 0.7)), mat, x, y, z, parent)
  const plane = (w, h, mat, x, y, z, parent, opts) => place(new THREE.PlaneGeometry(w, h), mat, x, y, z, parent, { cast: false, ...opts })
  const tag = (id, ...objs) =>
    objs.forEach((o) =>
      o.traverse((c) => {
        if (c.isMesh) {
          c.userData.hotspot = id
          interactive.push(c)
        }
      }),
    )
  const shadowAt = (w, d, x, z, opts) => {
    const s = P.contactShadow(w, d, opts)
    s.position.x = x
    s.position.z = z
    root.add(s)
    return s
  }
  const gradTex = M.gradientTex()
  const aoMat = (opacity) =>
    new THREE.MeshBasicMaterial({ map: gradTex, color: '#000', transparent: true, opacity, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 })
  /** Darken where floor meets a wall (fake ambient occlusion). rotY: direction the dark edge faces. */
  const floorAO = (len, width, x, z, rotY, opacity = 0.45) => {
    const g = new THREE.Group()
    g.position.set(x, 0.005, z)
    g.rotation.y = rotY
    const p = new THREE.Mesh(new THREE.PlaneGeometry(len, width), aoMat(opacity))
    p.rotation.x = -Math.PI / 2
    p.position.z = -width / 2
    p.renderOrder = 1
    g.add(p)
    root.add(g)
  }
  const wallAO = (len, height, x, y, z, rotY, flip, opacity = 0.35) => {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(len, height), aoMat(opacity))
    p.position.set(x, y, z)
    p.rotation.set(0, rotY, flip ? Math.PI : 0)
    p.renderOrder = 1
    root.add(p)
  }

  // ── shared materials ─────────────────────────────────────────
  const brickSet = M.brick({ base: [150, 62, 44], mortar: [182, 162, 140], seed: 3 })
  const brickMat = (w, h) => M.pbr(M.repeat(brickSet, w / 1.6, h / 1.6), { normalScale: V2(1.1) })
  const trim = std({ color: '#1d1714', roughness: 0.4, metalness: 0.4 })
  const brass = P.mats.brass
  const copper = std({ color: '#b8703f', roughness: 0.28, metalness: 1 })
  const glass = P.mats.glass
  const woodSet = M.wood({ base: [124, 78, 48], seed: 11 })
  const darkWoodSet = M.wood({ base: [66, 40, 25], seed: 13, planks: 8, gloss: 170 })
  const boardSet = M.wood({ base: [138, 90, 56], seed: 17, planks: 1, gloss: 140 })
  const woodMat = (rx = 1, ry = 1) => M.pbr(M.repeat(woodSet, rx, ry), { normalScale: V2(0.6) })
  const marbleSet = M.marble()
  const marble = M.pbr(marbleSet, { normalScale: V2(0) })
  const steelSet = M.brushedMetal()
  const steel = M.pbr(steelSet, { metalness: 1 })
  const greenery = std({ color: '#3f6b2a', roughness: 0.85 })
  const greenery2 = std({ color: '#557f35', roughness: 0.85 })
  const red = std({ color: '#a51c1e', roughness: 0.38, metalness: 0.25 })
  const soot = std({ color: '#140c08', roughness: 1, side: THREE.DoubleSide })

  // ── sky, street & neighbours ────────────────────────────────
  root.add(new THREE.Mesh(new THREE.SphereGeometry(80, 24, 16), new THREE.MeshBasicMaterial({ map: T.sky(), side: THREE.BackSide, fog: false, depthWrite: false })))

  const concreteSet = M.concrete()
  const sidewalk = plane(40, 7.2, M.pbr(M.repeat(concreteSet, 40 / 1.5, 7.2 / 1.5), { roughness: 0.9 }), 0, 0, 3.6, root, { receive: true })
  sidewalk.rotation.x = -Math.PI / 2
  box(40, 0.16, 0.3, std({ color: '#8d857d', roughness: 0.9 }), 0, 0.08, 7.35, root)
  const road = plane(80, 40, std({ color: '#1c1918', roughness: 0.55, metalness: 0.1 }), 0, -0.02, 27.5, root, { receive: true })
  road.rotation.x = -Math.PI / 2
  const dash = std({ color: '#d9b44a', roughness: 0.6 })
  for (let x = -24; x <= 24; x += 4) plane(1.8, 0.14, dash, x, -0.01, 12, root).rotation.x = -Math.PI / 2

  const neighbour = (x, h, tint, seed) => {
    const set = M.brick({ base: tint, mortar: [111, 98, 88], seed })
    box(10, h, 8, M.pbr(M.repeat(set, 10 / 1.6, h / 1.6)), x, h / 2, -4, root)
    const lit = std({ color: '#2a1d14', emissive: '#ff9f45', emissiveIntensity: 0.35 })
    const dark = std({ color: '#161a22', roughness: 0.15, metalness: 0.5 })
    for (let i = 0; i < 3; i++) {
      const wx = x - 3 + i * 3
      box(1.5, 1.7, 0.08, trim, wx, h - 2.2, 0, root)
      plane(1.3, 1.5, (i + seed) % 2 ? lit : dark, wx, h - 2.2, 0.05, root)
    }
    plane(6, 2.2, dark, x, 1.6, 0.01, root)
  }
  neighbour(-11.05, 7.6, [92, 74, 66], 17)
  neighbour(11.05, 6.8, [110, 84, 64], 19)

  const streetLamp = (x, z) => {
    const g = new THREE.Group()
    g.position.set(x, 0, z)
    cyl(0.07, 0.1, 4.3, trim, 0, 2.15, 0, g)
    cyl(0.18, 0.22, 0.25, trim, 0, 0.12, 0, g)
    box(0.9, 0.06, 0.06, trim, 0.45, 4.25, 0, g).castShadow = false
    cyl(0.22, 0.12, 0.3, trim, 0.85, 4.1, 0, g).castShadow = false
    sphere(0.12, std({ color: '#fff', emissive: '#ffd9a0', emissiveIntensity: 6 }), 0.85, 3.93, 0, g)
    root.add(g)
    const light = new THREE.PointLight('#ffc98a', low ? 26 : 32, 16, 1.6)
    light.position.set(x + 0.85, 3.8, z)
    root.add(light)
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

  box(0.1, 2.97, 0.36, trim, -1.17, 1.485, 0, root)
  box(0.1, 2.97, 0.36, trim, 1.17, 1.485, 0, root)
  box(2.44, 0.1, 0.36, trim, 0, 2.95, 0, root)
  box(2.7, 0.06, 0.7, std({ color: '#8a7f75', roughness: 0.8 }), 0, 0.03, 0.4, root)

  const makeLeaf = (dir) => {
    const pivot = new THREE.Group()
    pivot.position.set(-1.1 * dir, 0, 0)
    const u = (v) => v * dir
    const frame = std({ color: '#2b211c', roughness: 0.3, metalness: 0.6 })
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
  plane(0.44, 0.22, new THREE.MeshBasicMaterial({ map: T.openSign(), transparent: true }), 0.55, 1.95, 0.045, doorLeft).renderOrder = 3
  tag('door', doorLeft, doorRight)

  const awningTex = T.awning()
  awningTex.repeat.set(2.5, 1)
  const aw = plane(10.8, 1.19, std({ map: awningTex, roughness: 0.85, side: THREE.DoubleSide }), 0, 3.225, 0.7, root, { cast: true })
  aw.rotation.x = -Math.PI / 2 + Math.atan2(0.45, 1.1)
  const valTex = T.valance()
  valTex.wrapS = THREE.RepeatWrapping
  valTex.repeat.set(1.25, 1)
  plane(10.8, 0.3, std({ map: valTex, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.85 }), 0, 2.86, 1.26, root, { cast: true })

  box(6.5, 1.42, 0.16, trim, 0, 4.62, 0.2, root)
  const signTex = T.sign()
  plane(6.2, 1.33, std({ map: signTex, emissive: '#ffffff', emissiveMap: signTex, emissiveIntensity: 1.1, roughness: 0.5 }), 0, 4.62, 0.29, root)
  for (const x of [-2.4, 0, 2.4]) {
    box(0.04, 0.04, 0.55, trim, x, 5.5, 0.45, root).castShadow = false
    cyl(0.03, 0.13, 0.16, trim, x, 5.44, 0.72, root, 12).rotation.x = 0.5
  }

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

  const benchWood = woodMat(1, 0.3)
  const bench = new THREE.Group()
  bench.position.set(-3.5, 0, 1.4)
  box(1.7, 0.07, 0.46, benchWood, 0, 0.47, 0, bench)
  box(1.7, 0.36, 0.05, benchWood, 0, 0.72, -0.22, bench)
  for (const x of [-0.7, 0.7]) box(0.06, 0.47, 0.42, trim, x, 0.235, 0, bench)
  root.add(bench)

  const aframe = new THREE.Group()
  aframe.position.set(3.3, 0, 1.6)
  aframe.rotation.y = -0.35
  const aBoard = T.specialsBoard('Today’s Special', ['Ceylon Devilled', 'Chicken Pizza', 'Only today', 'LKR 2,550'])
  box(0.78, 1.05, 0.04, benchWood, 0, 0.5, 0.18, aframe).rotation.x = -0.2
  box(0.78, 1.05, 0.04, benchWood, 0, 0.5, -0.18, aframe).rotation.x = 0.2
  const chalkFace = plane(0.66, 0.84, std({ map: aBoard, roughness: 0.9 }), 0, 0.52, 0.205, aframe)
  chalkFace.rotation.x = -0.2
  root.add(aframe)

  // ── interior shell ───────────────────────────────────────────
  const floorSet = M.floorTiles()
  const floor = plane(11.7, 12, M.pbr(M.repeat(floorSet, 11.7 / 4, 12 / 4), { normalScale: V2(0.35), envMapIntensity: 1.2 }), 0, 0.002, -6.1, root, { receive: true })
  floor.rotation.x = -Math.PI / 2

  const ceilMat = M.pbr(M.repeat(darkWoodSet, 4, 4), { normalScale: V2(0.6) })
  const ceil = plane(11.7, 12, ceilMat, 0, 4.2, -6.1, root)
  ceil.rotation.x = Math.PI / 2
  const beamMat = M.pbr(M.repeat(darkWoodSet, 3, 0.1), { normalScale: V2(0.6) })
  for (let z = -1.5; z > -12; z -= 2.2) box(11.7, 0.2, 0.18, beamMat, 0, 4.1, z, root, { cast: false })

  // exposed galvanised duct
  const duct = cyl(0.2, 0.2, 8.4, steel, 4.6, 3.82, -7.7, root, low ? 12 : 20, { cast: false })
  duct.rotation.x = Math.PI / 2
  for (let z = -4.2; z > -11.6; z -= 1.8) {
    place(new THREE.TorusGeometry(0.205, 0.008, 6, 20), trim, 4.6, 3.82, z, root, { cast: false })
  }

  const whiteBrick = M.brick({ base: [214, 196, 172], mortar: [236, 226, 210], seed: 23, whitewash: 0.35 })
  plane(11.7, 4.2, M.pbr(M.repeat(whiteBrick, 11.7 / 1.8, 4.2 / 1.8), { normalScale: V2(1.3) }), 0, 2.1, -12, root, { receive: true })
  // subway-tile backsplash behind the prep area
  const subway = M.subwayTiles()
  plane(5.9, 1.75, M.pbr(M.repeat(subway, 5.9 / 1.2, 1.75 / 1.2), { normalScale: V2(0.6), envMapIntensity: 1.2 }), 2.95, 0.875, -11.985, root, { receive: true })
  box(5.9, 0.04, 0.04, brass, 2.95, 1.76, -11.97, root, { cast: false })

  const plasterSet = M.plaster()
  const lw = plane(12, 4.2, M.pbr(M.repeat(plasterSet, 3, 1.05), { normalScale: V2(0.8) }), -5.85, 2.1, -6, root, { receive: true })
  lw.rotation.y = Math.PI / 2
  const rw = plane(12, 4.2, M.pbr(M.repeat(plasterSet, 3, 1.05), { normalScale: V2(0.8) }), 5.85, 2.1, -6, root, { receive: true })
  rw.rotation.y = -Math.PI / 2
  const wainscot = M.pbr(M.repeat(boardSet, 60, 1), { normalScale: V2(0.6) })
  box(0.05, 1.1, 11.8, wainscot, -5.82, 0.55, -6.05, root)
  box(0.05, 1.1, 11.8, wainscot, 5.82, 0.55, -6.05, root)
  box(0.08, 0.05, 11.8, brass, -5.78, 1.12, -6.05, root, { cast: false })
  box(0.08, 0.05, 11.8, brass, 5.78, 1.12, -6.05, root, { cast: false })
  box(0.06, 0.12, 11.8, trim, -5.8, 0.06, -6.05, root, { cast: false })
  box(0.06, 0.12, 11.8, trim, 5.8, 0.06, -6.05, root, { cast: false })

  // ambient occlusion where surfaces meet
  floorAO(11.7, 0.8, 0, -11.95, 0, 0.5)
  floorAO(12, 0.7, -5.8, -6.1, Math.PI / 2, 0.45)
  floorAO(12, 0.7, 5.8, -6.1, -Math.PI / 2, 0.45)
  floorAO(11.7, 0.6, 0, -0.18, Math.PI, 0.35)
  wallAO(11.7, 0.9, 0, 3.75, -11.97, 0, false, 0.4)
  wallAO(12, 0.9, -5.83, 3.75, -6.05, Math.PI / 2, false, 0.4)
  wallAO(12, 0.9, 5.83, 3.75, -6.05, -Math.PI / 2, false, 0.4)
  wallAO(11.7, 0.5, 0, 0.25, -11.96, 0, true, 0.3)

  // neon sign (blooms on capable devices)
  const neonMat = new THREE.MeshBasicMaterial({ map: T.neon('Fresh · Hot · Made for You'), transparent: true, depthWrite: false })
  neonMat.color.multiplyScalar(low ? 1.2 : 4)
  plane(4.4, 0.69, neonMat, -5.785, 3.25, -6.4, root).rotation.y = Math.PI / 2

  // framed photos on the right wall
  ;[
    [-2.7, 0],
    [-4.2, 1],
  ].forEach(([z, v]) => {
    box(0.04, 0.66, 0.54, trim, 5.81, 2.3, z, root, { cast: false })
    plane(0.46, 0.58, std({ color: '#f6f0e4', roughness: 0.9 }), 5.785, 2.3, z, root).rotation.y = -Math.PI / 2
    plane(0.36, 0.45, std({ map: M.photo(v), roughness: 0.6 }), 5.78, 2.31, z, root).rotation.y = -Math.PI / 2
  })

  // ── counter ─────────────────────────────────────────────────
  const counter = new THREE.Group()
  root.add(counter)
  box(6.36, 0.98, 0.86, std({ color: '#2a1a12', roughness: 0.8 }), 0.4, 0.55, -7.3, counter)
  const slatGeo = new THREE.BoxGeometry(0.078, 0.86, 0.025)
  const slatMat = M.pbr(M.repeat(boardSet, 0.25, 1), { normalScale: V2(0.6) })
  const slatR = mulberry32(5)
  const slats = []
  for (let x = 0.4 - 3.16; x <= 0.4 + 3.16; x += 0.086) slats.push({ x, y: 0.565, z: -6.855 + slatR() * 0.004 })
  counter.add(
    P.instanced(
      slatGeo,
      slatMat,
      slats,
      slats.map(() => {
        const v = 0.82 + slatR() * 0.3
        return new THREE.Color(v, v * 0.97, v * 0.93)
      }),
    ),
  )
  box(6.36, 0.13, 0.8, trim, 0.4, 0.065, -7.32, counter)
  rbox(6.7, 0.06, 1.1, 0.02, marble, 0.4, 1.05, -7.3, counter)
  const rail = cyl(0.024, 0.024, 6.2, brass, 0.4, 0.2, -6.62, counter, 12)
  rail.rotation.z = Math.PI / 2
  for (let x = -2.6; x <= 3.4; x += 1.5) box(0.03, 0.03, 0.22, brass, x, 0.2, -6.73, counter)
  shadowAt(7.1, 1.7, 0.4, -7.25, { opacity: 0.6 })

  // deli display case with real pizzas
  const display = new THREE.Group()
  display.position.set(-1.5, 1.08, -7.3)
  counter.add(display)
  box(2.0, 0.05, 0.84, steel, 0, 0.025, 0, display)
  box(2.0, 0.5, 0.03, std({ color: '#2a2522', metalness: 0.8, roughness: 0.3 }), 0, 0.3, -0.4, display)
  for (const x of [-0.99, 0.99]) box(0.02, 0.55, 0.84, glass, x, 0.3, 0, display, { cast: false, receive: false })
  const topGlass = plane(2.0, 0.6, glass, 0, 0.56, -0.12, display)
  topGlass.rotation.x = -Math.PI / 2
  const frontGlass = plane(2.0, 0.52, glass, 0, 0.3, 0.3, display)
  frontGlass.rotation.x = -0.35
  box(2.02, 0.025, 0.03, steel, 0, 0.56, 0.2, display)
  box(1.95, 0.012, 0.025, std({ color: '#fff', emissive: '#ffe7c2', emissiveIntensity: low ? 2 : 6 }), 0, 0.54, -0.3, display, { cast: false })
  ;[
    { x: -0.64, kind: 'pepperoni' },
    { x: 0, kind: 'margherita' },
    { x: 0.64, kind: 'veg' },
  ].forEach(({ x, kind }, i) => {
    const pz = P.pizza({ radius: 0.24, kind, seed: i + 1, board: true })
    pz.position.set(x, 0.05, 0.02)
    pz.rotation.y = i * 0.7
    display.add(pz)
  })
  tag('display', display)

  // dessert stand under a glass cloche
  const dessert = new THREE.Group()
  dessert.position.set(0.95, 1.08, -7.3)
  counter.add(dessert)
  cyl(0.22, 0.2, 0.02, P.mats.ceramic, 0, 0.13, 0, dessert)
  cyl(0.025, 0.07, 0.12, brass, 0, 0.06, 0, dessert, 12)
  cyl(0.16, 0.16, 0.05, std({ color: '#3c1d12', roughness: 0.55 }), 0, 0.165, 0, dessert)
  cyl(0.162, 0.162, 0.015, std({ color: '#f1e3c8', roughness: 0.5 }), 0, 0.197, 0, dessert)
  cyl(0.16, 0.16, 0.05, std({ color: '#3c1d12', roughness: 0.55 }), 0, 0.23, 0, dessert)
  const drip = place(new THREE.TorusGeometry(0.155, 0.014, 8, 32), std({ color: '#2a120a', roughness: 0.2 }), 0, 0.254, 0, dessert)
  drip.rotation.x = Math.PI / 2
  cyl(0.158, 0.158, 0.01, std({ color: '#2a120a', roughness: 0.18 }), 0, 0.258, 0, dessert)
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2
    sphere(0.022, red, Math.cos(a) * 0.1, 0.275, Math.sin(a) * 0.1, dessert, 10)
  }
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.25, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), glass)
  dome.position.y = 0.14
  dome.scale.y = 1.25
  dessert.add(dome)
  sphere(0.022, brass, 0, 0.455, 0, dessert, 10)
  tag('dessert', dessert)

  // POS tablet + card terminal + tip jar
  const register = new THREE.Group()
  register.position.set(2.45, 1.08, -7.35)
  register.rotation.y = 0.35
  counter.add(register)
  cyl(0.08, 0.09, 0.015, P.mats.blackMetal, 0, 0.008, 0, register)
  cyl(0.015, 0.015, 0.18, P.mats.blackMetal, 0, 0.1, 0, register, 8)
  const tablet = rbox(0.34, 0.24, 0.015, 0.01, std({ color: '#111', roughness: 0.3 }), 0, 0.27, 0.03, register)
  tablet.rotation.x = -0.45
  const posTex = canvasTexture(THREE, 256, 180, (ctx) => {
    ctx.fillStyle = '#f6f1e8'
    ctx.fillRect(0, 0, 256, 180)
    ctx.fillStyle = '#211a17'
    ctx.fillRect(0, 0, 256, 26)
    const cols = ['#d62828', '#f77f00', '#fcbf49', '#7c8445', '#4d3f38', '#d62828']
    cols.forEach((c, i) => {
      ctx.fillStyle = c
      ctx.fillRect(12 + (i % 3) * 80, 38 + Math.floor(i / 3) * 62, 70, 52)
    })
  }, extraTextures)
  const screen = plane(0.31, 0.21, std({ map: posTex, emissive: '#ffffff', emissiveMap: posTex, emissiveIntensity: 0.9, roughness: 0.2 }), 0, 0.27, 0.039, register)
  screen.rotation.x = -0.45
  const terminal = rbox(0.08, 0.025, 0.15, 0.008, std({ color: '#151515', roughness: 0.35 }), 0.28, 0.0125, 0.06, register)
  terminal.rotation.y = -0.2
  place(new THREE.CylinderGeometry(0.06, 0.06, 0.14, 18, 1, true), glass, -0.25, 0.07, 0.08, register, { cast: false })
  tag('register', register)

  // pizza boxes
  const boxTop = T.pizzaBox()
  const kraft = std({ color: '#c99b64', roughness: 0.85 })
  for (let i = 0; i < 5; i++) {
    const b = new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.055, 0.5, 1, 0.006), [kraft, kraft, std({ map: boxTop, roughness: 0.85 }), kraft, kraft, kraft])
    b.position.set(3.35, 1.108 + i * 0.057, -7.3)
    b.rotation.y = (i % 2 ? 0.07 : -0.05) + 0.2
    counter.add(add(b))
  }

  // vegetable crate with a potted basil
  const crate = new THREE.Group()
  crate.position.set(-3.15, 1.08, -7.3)
  counter.add(crate)
  const crateWood = M.pbr(M.repeat(boardSet, 1, 0.3), { normalScale: V2(0.5) })
  for (const y of [0.03, 0.12, 0.2]) {
    box(0.62, 0.05, 0.015, crateWood, 0, y, 0.2, crate)
    box(0.62, 0.05, 0.015, crateWood, 0, y, -0.2, crate)
    box(0.015, 0.05, 0.4, crateWood, -0.3, y, 0, crate)
    box(0.015, 0.05, 0.4, crateWood, 0.3, y, 0, crate)
  }
  box(0.6, 0.012, 0.4, crateWood, 0, 0.006, 0, crate)
  const tomato = std({ color: '#c8231c', roughness: 0.22 })
  const pepperMat = std({ color: '#2f7d2e', roughness: 0.25 })
  const stem = std({ color: '#3e6b23', roughness: 0.7 })
  const veg = mulberry32(31)
  for (let i = 0; i < 9; i++) {
    const x = -0.22 + (i % 3) * 0.2 + (veg() - 0.5) * 0.04
    const z = -0.12 + Math.floor(i / 3) * 0.12
    const isPepper = i % 4 === 3
    const s = sphere(isPepper ? 0.06 : 0.058, isPepper ? pepperMat : tomato, x, 0.24, z, crate, 14)
    if (isPepper) s.scale.set(0.9, 1.2, 0.9)
    else {
      s.scale.y = 0.85
      const c = place(new THREE.ConeGeometry(0.018, 0.02, 5), stem, x, 0.29, z, crate, { cast: false })
      c.rotation.x = Math.PI
    }
  }
  const basil = P.plant({ height: 0.28, spread: 0.18, leaves: 40, seed: 12, pot: false })
  basil.position.set(0.5, 0, 0)
  crate.add(basil)
  cyl(0.08, 0.06, 0.12, std({ color: '#a8532f', roughness: 0.85 }), 0.5, 0.06, 0, crate, 16)
  tag('veg', crate)

  // bar stools
  if (!low) {
    for (const x of [-0.1, 1.3, 2.7]) {
      const s = P.stool()
      s.position.set(x, 0, -6.35)
      root.add(s)
    }
  }

  // ── pendant lights ──────────────────────────────────────────
  const pendantLight = (x, z, drop, intensity, color = '#1f3a2e') => {
    const { group, bulbY } = P.pendant({ drop, color })
    group.position.set(x, 4.2, z)
    root.add(group)
    const l = new THREE.PointLight('#ffb466', intensity, 9, 1.8)
    l.position.set(x, 4.2 + bulbY - 0.05, z)
    root.add(l)
    return l
  }
  ;[-1.8, 0.4, 2.6].forEach((x, i) => {
    if (low && i === 1) {
      const { group } = P.pendant({ drop: 0.95 })
      group.position.set(x, 4.2, -7.0)
      root.add(group)
    } else pendantLight(x, -7.0, 0.95, low ? 9 : 7)
  })

  const fan = new THREE.Group()
  fan.position.set(0, 3.95, -3.8)
  root.add(fan)
  cyl(0.02, 0.02, 0.25, trim, 0, 0.12, 0, fan, 8)
  cyl(0.12, 0.12, 0.1, brass, 0, 0, 0, fan, 16)
  const bladeMat = M.pbr(M.repeat(darkWoodSet, 0.3, 0.3))
  for (let i = 0; i < 4; i++) {
    const blade = box(1.05, 0.015, 0.17, bladeMat, 0, -0.02, 0, fan, { cast: false })
    blade.geometry.translate(0.6, 0, 0)
    blade.rotation.y = (i * Math.PI) / 2
  }
  animators.push((t, dt) => (fan.rotation.y += dt * 2.2))

  // ── wood-fired oven ─────────────────────────────────────────
  const oven = new THREE.Group()
  oven.position.set(-2.6, 0, -10.8)
  root.add(oven)
  const ovenBrick = M.brick({ base: [128, 52, 36], mortar: [96, 74, 60], seed: 29 })
  const domeBrick = M.brick({ base: [140, 58, 40], mortar: [110, 88, 72], seed: 33, rows: 16, cols: 6 })
  rbox(3.0, 1.0, 2.8, 0.03, M.pbr(M.repeat(ovenBrick, 3 / 1.6, 1 / 1.6), { normalScale: V2(1.2) }), 0, 0.5, 0.2, oven)
  // firewood niche
  plane(1.3, 0.5, soot, 0, 0.42, 1.605, oven)
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 6 - r; c++) {
      const log = cyl(0.055, 0.06, 0.3, std({ color: c % 2 ? '#6b4528' : '#5a3a22', roughness: 0.95 }), -0.5 + c * 0.12 + r * 0.06, 0.24 + r * 0.1, 1.48, oven, 10)
      log.rotation.x = Math.PI / 2
    }
  }
  box(1.4, 0.06, 0.08, std({ color: '#7a7068', roughness: 0.8 }), 0, 0.7, 1.6, oven)
  const domeMesh = new THREE.Mesh(
    new THREE.SphereGeometry(1.3, low ? 24 : 40, low ? 12 : 20, 0, Math.PI * 2, 0, Math.PI / 2),
    M.pbr(M.repeat(domeBrick, 4, 1.5), { normalScale: V2(1.3) }),
  )
  domeMesh.position.set(0, 1.0, -0.2)
  domeMesh.scale.y = 0.82
  add(domeMesh, oven)
  // brick portal with an arched mouth
  const portal = new THREE.Shape()
  portal.moveTo(-0.72, -0.02)
  portal.lineTo(0.72, -0.02)
  portal.lineTo(0.72, 0.78)
  portal.quadraticCurveTo(0.72, 0.95, 0.5, 0.95)
  portal.lineTo(-0.5, 0.95)
  portal.quadraticCurveTo(-0.72, 0.95, -0.72, 0.78)
  portal.closePath()
  const hole = new THREE.Path()
  hole.moveTo(-0.42, 0)
  hole.lineTo(-0.42, 0.26)
  hole.absarc(0, 0.26, 0.42, Math.PI, 0, true)
  hole.lineTo(0.42, 0)
  hole.closePath()
  portal.holes.push(hole)
  const portalSet = M.repeat(ovenBrick, 1 / 1.6, 1 / 1.6)
  const portalMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(portal, { depth: 0.45, bevelEnabled: false, curveSegments: 16 }), M.pbr(portalSet, { normalScale: V2(1.2) }))
  portalMesh.position.set(0, 1.0, 1.15)
  add(portalMesh, oven)
  // arch voussoirs + jambs
  const vous = []
  for (let i = 0; i <= 12; i++) {
    const a = (i / 12) * Math.PI
    vous.push({ x: Math.cos(a) * 0.5, y: 1.26 + Math.sin(a) * 0.5, z: 1.62, rz: a - Math.PI / 2 })
  }
  for (const s of [-1, 1]) for (let i = 0; i < 2; i++) vous.push({ x: s * 0.5, y: 1.06 + i * 0.13, z: 1.62, rz: 0 })
  oven.add(P.instanced(new THREE.BoxGeometry(0.11, 0.16, 0.08), std({ color: '#6e2a1a', roughness: 0.9 }), vous))
  // the tunnel into the fire
  const tunnelFloor = plane(0.84, 0.47, std({ color: '#2a1408', emissive: '#ff6a1a', emissiveIntensity: 0.35, roughness: 1 }), 0, 1.003, 1.38, oven)
  tunnelFloor.rotation.x = -Math.PI / 2
  for (const s of [-1, 1]) plane(0.47, 0.26, soot, s * 0.42, 1.13, 1.38, oven).rotation.y = (s * Math.PI) / 2
  const roof = place(new THREE.CylinderGeometry(0.42, 0.42, 0.47, 20, 1, true, -Math.PI / 2, Math.PI), soot, 0, 1.26, 1.38, oven, { cast: false })
  roof.rotation.x = Math.PI / 2
  const mouthShape = new THREE.Shape()
  mouthShape.moveTo(-0.42, 0)
  mouthShape.lineTo(0.42, 0)
  mouthShape.lineTo(0.42, 0.26)
  mouthShape.absarc(0, 0.26, 0.42, 0, Math.PI, false)
  mouthShape.closePath()
  const fireTex = T.fire()
  fireTex.repeat.set(1.2, 1.2)
  fireTex.offset.set(-0.1, -0.05)
  const fireMat = new THREE.MeshBasicMaterial({ map: fireTex })
  fireMat.color.multiplyScalar(low ? 1.1 : 3.4)
  const mouth = new THREE.Mesh(new THREE.ShapeGeometry(mouthShape, 16), fireMat)
  mouth.position.set(0, 1.0, 1.16)
  oven.add(mouth)
  // logs and embers at the back of the oven
  const charred = std({ color: '#1a0d07', emissive: '#ff4d0a', emissiveIntensity: 0.6, roughness: 1 })
  for (let i = 0; i < 3; i++) {
    const log = cyl(0.045, 0.05, 0.42, charred, -0.12 + i * 0.12, 1.05 + (i === 1 ? 0.06 : 0), 1.24, oven, 10)
    log.rotation.z = Math.PI / 2 + (i - 1) * 0.3
  }
  const emberR = mulberry32(44)
  oven.add(
    P.instanced(
      new THREE.SphereGeometry(0.014, 6, 4),
      std({ color: '#ff8a2a', emissive: '#ff6a00', emissiveIntensity: low ? 2 : 5 }),
      Array.from({ length: 26 }, () => ({ x: (emberR() - 0.5) * 0.6, y: 1.012, z: 1.22 + emberR() * 0.12, s: 0.6 + emberR() })),
    ),
  )
  box(1.6, 0.07, 0.32, M.pbr(M.repeat(concreteSet, 0.6, 0.2), { roughness: 0.7 }), 0, 0.97, 1.78, oven)
  // copper hood + flue
  place(new THREE.CylinderGeometry(0.22, 0.5, 0.42, low ? 16 : 28, 1, true), std({ color: '#b8703f', roughness: 0.28, metalness: 1, side: THREE.DoubleSide }), 0, 2.18, 1.3, oven, { cast: false })
  cyl(0.2, 0.2, 2.0, copper, 0, 3.3, 1.3, oven)
  // pizza peel leaning on the oven
  const peel = new THREE.Group()
  peel.position.set(1.62, 0, 1.0)
  peel.rotation.z = 0.12
  oven.add(peel)
  cyl(0.018, 0.018, 1.5, M.pbr(M.repeat(boardSet, 0.1, 1)), 0, 1.05, 0, peel, 8)
  rbox(0.32, 0.38, 0.006, 0.004, steel, 0, 0.2, 0, peel)
  shadowAt(3.4, 3.4, -2.6, -10.55, { opacity: 0.55 })
  // flour sacks
  const sack = std({ color: '#d8c8a8', roughness: 0.95 })
  ;[
    [-0.55, -9.0, 0],
    [-0.15, -9.15, 0.4],
  ].forEach(([x, z, ry]) => {
    const s = sphere(0.24, sack, x, 0.28, z, root, 16)
    s.scale.set(1, 1.25, 0.75)
    s.rotation.y = ry
    shadowAt(0.7, 0.6, x, z, { round: true, opacity: 0.5 })
  })

  const ovenLight = new THREE.PointLight('#ff7a2e', low ? 7 : 9, 7, 1.6)
  ovenLight.position.set(0, 1.25, 1.95)
  oven.add(ovenLight)
  animators.push((t) => {
    const f = Math.sin(t * 7.3) * 0.9 + Math.sin(t * 13.1) * 0.55 + Math.sin(t * 2.1) * 0.4
    ovenLight.intensity = (low ? 7 : 9) + f
    charred.emissiveIntensity = 0.55 + f * 0.08
    fireTex.offset.y = -0.05 + Math.sin(t * 3) * 0.015
  })
  tag('oven', domeMesh, mouth, portalMesh)

  // chilli garland (spicy hotspot)
  const garland = new THREE.Group()
  garland.position.set(-4.7, 2.05, -11.9)
  root.add(garland)
  cyl(0.004, 0.004, 1.3, std({ color: '#c8b48a' }), 0, 0.6, 0.03, garland, 6)
  const chilli = std({ color: '#b5161a', roughness: 0.2 })
  for (let i = 0; i < 11; i++) {
    const c = place(new THREE.ConeGeometry(0.035, 0.2, 10), chilli, i % 2 ? 0.06 : -0.06, 0.02 + i * 0.11, 0.06, garland)
    c.rotation.set(Math.PI, 0, i % 2 ? 0.5 : -0.5)
    place(new THREE.CylinderGeometry(0.008, 0.012, 0.03, 6), stem, i % 2 ? 0.03 : -0.03, 0.12 + i * 0.11, 0.06, garland, { cast: false })
  }
  tag('spicy', garland)

  // menu board with gallery lamps
  box(3.85, 2.18, 0.08, M.pbr(M.repeat(darkWoodSet, 1, 0.5)), 2.1, 2.85, -11.94, root)
  const menuTex = T.menuBoard()
  const board = plane(3.6, 1.97, std({ map: menuTex, emissive: '#ffffff', emissiveMap: menuTex, emissiveIntensity: 0.22, roughness: 0.92 }), 2.1, 2.85, -11.89, root)
  tag('menu', board)
  for (const x of [1.2, 3.0]) {
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(x, 4.0, -11.97), new THREE.Vector3(x, 4.12, -11.75), new THREE.Vector3(x, 4.08, -11.55)])
    place(new THREE.TubeGeometry(curve, 12, 0.012, 6), trim, 0, 0, 0, root, { cast: false })
    const shade = place(new THREE.CylinderGeometry(0.04, 0.09, 0.12, 16, 1, true), std({ color: '#1d1714', metalness: 0.5, roughness: 0.4, side: THREE.DoubleSide }), x, 4.03, -11.53, root, { cast: false })
    shade.rotation.x = 0.7
  }
  const boardSpot = new THREE.SpotLight('#ffe2b8', low ? 6 : 10, 6, 0.75, 0.6, 1.5)
  boardSpot.position.set(2.1, 4.05, -11.2)
  boardSpot.target.position.set(2.1, 2.7, -11.9)
  root.add(boardSpot, boardSpot.target)

  // stainless prep counter with dough balls
  const prep = new THREE.Group()
  prep.position.set(2.3, 0, -11.55)
  root.add(prep)
  box(3.6, 0.86, 0.75, steel, 0, 0.43, 0, prep)
  rbox(3.7, 0.04, 0.8, 0.01, steel, 0, 0.88, 0.0, prep)
  box(0.7, 0.05, 0.45, std({ color: '#2d2d2d', roughness: 0.5 }), -0.9, 0.925, 0.05, prep)
  const dough = []
  for (let i = 0; i < 8; i++) dough.push({ x: -1.15 + (i % 4) * 0.165, y: 0.975, z: -0.06 + Math.floor(i / 4) * 0.2, sx: 1, sy: 0.6, sz: 1 })
  prep.add(P.instanced(new THREE.SphereGeometry(0.07, 16, 10), std({ color: '#f3e3c6', roughness: 0.65 }), dough))
  cyl(0.11, 0.1, 0.16, steel, 0.2, 0.98, 0, prep, 18)
  cyl(0.1, 0.1, 0.01, std({ color: '#a72b1c', roughness: 0.25 }), 0.2, 1.055, 0, prep, 18)
  cyl(0.11, 0.1, 0.16, steel, 0.48, 0.98, 0, prep, 18)
  cyl(0.1, 0.1, 0.01, std({ color: '#f6dd9a', roughness: 0.6 }), 0.48, 1.055, 0, prep, 18)
  shadowAt(3.9, 1.2, 2.3, -11.5, { opacity: 0.5 })

  // bread rack (garlic bread & sides)
  const rack = new THREE.Group()
  rack.position.set(-4.85, 0, -8.4)
  rack.rotation.y = Math.PI / 2
  root.add(rack)
  const rackWood = M.pbr(M.repeat(boardSet, 0.3, 1), { normalScale: V2(0.5) })
  for (const x of [-0.62, 0.62]) box(0.05, 2.0, 0.5, rackWood, x, 1.0, 0, rack)
  const crustMat = P.mats.crust
  const loafGeo = new THREE.CapsuleGeometry(0.075, 0.26, 6, 14)
  ;[0.5, 1.05, 1.6].forEach((y, si) => {
    box(1.26, 0.035, 0.5, rackWood, 0, y, 0, rack)
    for (let i = 0; i < 4; i++) {
      const loaf = place(loafGeo, crustMat, -0.4 + i * 0.27, y + 0.09, (i % 2 ? 0.05 : -0.05), rack)
      loaf.rotation.set(0, (i % 2 ? 0.25 : -0.2) + 0.1 * si, Math.PI / 2)
      loaf.scale.set(1, 1, 0.85)
    }
  })
  const basketPts = [
    [0, 0],
    [0.2, 0],
    [0.26, 0.3],
    [0.24, 0.31],
    [0.19, 0.02],
    [0, 0.02],
  ].map(([x, y]) => new THREE.Vector2(x, y))
  place(new THREE.LatheGeometry(basketPts, 20), std({ color: '#9b6a3a', roughness: 0.95, side: THREE.DoubleSide }), 0, 0, 0.62, rack)
  for (let i = 0; i < 6; i++) {
    const bag = place(new THREE.CapsuleGeometry(0.035, 0.62, 4, 10), crustMat, -0.12 + i * 0.05, 0.45, 0.62 + (i % 2 ? 0.05 : -0.05), rack)
    bag.rotation.z = -0.3 + i * 0.12
  }
  shadowAt(0.8, 1.6, -4.85, -8.3, { opacity: 0.55 })
  tag('bread', rack)

  // wall shelves with jars, cans & oil (decor)
  const shelf = new THREE.Group()
  shelf.position.set(-5.6, 0, -4.4)
  root.add(shelf)
  const oilGlass = std({ color: '#5b6b1e', roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.85 })
  const canSide = std({ map: M.canLabel(), roughness: 0.4 })
  const canMats = [canSide, P.mats.chrome, P.mats.chrome]
  ;[1.6, 2.2].forEach((y, si) => {
    box(0.36, 0.045, 2.3, rackWood, 0, y, 0, shelf)
    for (const z of [-0.9, 0, 0.9]) box(0.25, 0.03, 0.03, P.mats.blackMetal, 0.06, y - 0.06, z, shelf, { cast: false })
    for (let i = 0; i < 7; i++) {
      const z = -1.0 + i * 0.33
      const kind = (i + si) % 3
      if (kind === 0) {
        const b = new THREE.Mesh(P.bottleGeo, oilGlass)
        b.position.set(0, y + 0.022, z)
        add(b, shelf)
      } else if (kind === 1) {
        const c = new THREE.Mesh(P.canGeo, canMats)
        c.position.set(0, y + 0.083, z)
        c.rotation.y = -Math.PI / 2
        add(c, shelf)
      } else {
        cyl(0.06, 0.06, 0.2, glass, 0, y + 0.122, z, shelf, 16, { cast: false })
        cyl(0.052, 0.052, 0.15, std({ color: '#e8c06a', roughness: 0.8 }), 0, y + 0.1, z, shelf, 14)
        cyl(0.062, 0.062, 0.03, P.mats.blackMetal, 0, y + 0.235, z, shelf, 16)
      }
    }
  })
  const trailing = P.trailingPlant({ strands: 6, length: 0.8, seed: 9 })
  trailing.position.set(0.05, 2.22, 0.9)
  trailing.rotation.y = Math.PI / 2
  shelf.add(trailing)
  cyl(0.1, 0.08, 0.14, std({ color: '#efe6d6', roughness: 0.4 }), 0, 2.29, 0.9, shelf, 16)

  // commercial drinks cooler
  const fridge = new THREE.Group()
  fridge.position.set(5.3, 0, -9.6)
  root.add(fridge)
  const fridgeBody = std({ color: '#151414', roughness: 0.35, metalness: 0.6 })
  rbox(1.0, 2.15, 1.25, 0.03, fridgeBody, 0.02, 1.075, 0, fridge)
  const glow = plane(1.1, 1.75, std({ color: '#ffffff', emissive: '#e6f2ff', emissiveIntensity: low ? 1.2 : 2.2 }), 0.42, 1.08, 0, fridge)
  glow.rotation.y = -Math.PI / 2
  const bottleList = []
  const bottleColors = ['#7a1d12', '#2f7d2e', '#e0a43a', '#b5161a', '#2a6db3', '#efe4c8']
  ;[0.3, 0.75, 1.2, 1.62].forEach((y, row) => {
    box(0.75, 0.015, 1.12, P.mats.chrome, 0, y, 0, fridge, { cast: false })
    for (let i = 0; i < 7; i++) {
      bottleList.push({ x: -0.15 + (i % 2) * 0.12, y: y + 0.008, z: -0.48 + i * 0.16, s: row === 3 ? 0.8 : 1 })
    }
  })
  fridge.add(P.instanced(P.bottleGeo, std({ roughness: 0.15, metalness: 0.1 }), bottleList, bottleColors))
  // glass door with frame & handle
  plane(1.12, 1.95, glass, -0.49, 1.05, 0, fridge).rotation.y = -Math.PI / 2
  for (const z of [-0.6, 0.6]) box(0.04, 2.0, 0.05, fridgeBody, -0.5, 1.05, z, fridge)
  for (const y of [0.06, 2.04]) box(0.04, 0.05, 1.25, fridgeBody, -0.5, y, 0, fridge)
  cyl(0.014, 0.014, 0.8, P.mats.chrome, -0.56, 1.1, -0.5, fridge, 8)
  const headerTex = canvasTexture(THREE, 512, 96, (ctx) => {
    ctx.fillStyle = '#b81f21'
    ctx.fillRect(0, 0, 512, 96)
    ctx.fillStyle = '#fff8ed'
    ctx.font = '800 54px "Plus Jakarta Sans", system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('COLD DRINKS', 256, 52)
  }, extraTextures)
  const header = plane(1.15, 0.22, std({ map: headerTex, emissive: '#ffffff', emissiveMap: headerTex, emissiveIntensity: 0.9 }), -0.535, 2.0, 0, fridge)
  header.rotation.y = -Math.PI / 2
  if (!low) {
    const coolLight = new THREE.PointLight('#dcecff', 3, 3, 2)
    coolLight.position.set(-0.9, 1.2, 0)
    fridge.add(coolLight)
  }
  shadowAt(1.3, 1.6, 5.25, -9.6, { opacity: 0.6 })
  tag('fridge', fridge)

  // offers standee
  const standee = new THREE.Group()
  standee.position.set(3.6, 0, -6.2)
  standee.rotation.y = -0.45
  root.add(standee)
  const dealsTex = T.specialsBoard('Today’s Deals', ['Family Feast', 'LKR 6,950', 'Use code PIZZA10', '10% OFF'])
  rbox(0.84, 1.18, 0.05, 0.015, M.pbr(M.repeat(boardSet, 0.5, 1)), 0, 1.0, 0, standee)
  plane(0.7, 0.98, std({ map: dealsTex, roughness: 0.92, emissive: '#ffffff', emissiveMap: dealsTex, emissiveIntensity: 0.12 }), 0, 1.0, 0.03, standee)
  for (const x of [-0.3, 0.3]) box(0.035, 0.5, 0.035, trim, x, 0.25, 0, standee).rotation.x = 0.1
  shadowAt(1.0, 0.5, 3.6, -6.2, { opacity: 0.45 })
  tag('offers', standee)

  // bistro tables with place settings
  const tableTop = M.pbr(M.repeat(marbleSet, 1, 1))
  const table = (x, z, kind, seed) => {
    const g = new THREE.Group()
    g.position.set(x, 0, z)
    root.add(g)
    cyl(0.48, 0.48, 0.03, tableTop, 0, 0.76, 0, g, low ? 24 : 40)
    cyl(0.485, 0.485, 0.012, brass, 0, 0.742, 0, g, low ? 24 : 40)
    cyl(0.035, 0.045, 0.72, P.mats.blackMetal, 0, 0.38, 0, g, 12)
    for (let i = 0; i < 4; i++) {
      const foot = box(0.42, 0.03, 0.05, P.mats.blackMetal, 0, 0.02, 0, g)
      foot.geometry.translate(0.21, 0, 0)
      foot.rotation.y = (i * Math.PI) / 2 + Math.PI / 4
    }
    const pz = P.pizza({ radius: 0.17, kind, seed, board: true })
    pz.position.set(0.02, 0.775, 0.02)
    g.add(pz)
    for (const s of [-1, 1]) {
      cyl(0.11, 0.09, 0.015, P.mats.ceramic, s * 0.3, 0.783, 0.12, g, 24)
      const t = P.glassTumbler()
      t.position.set(s * 0.33, 0.775, -0.18)
      g.add(t)
      cyl(0.032, 0.03, 0.07, std({ color: '#b5651d', roughness: 0.1, transparent: true, opacity: 0.85 }), s * 0.33, 0.815, -0.18, g, 12)
    }
    cyl(0.035, 0.035, 0.07, glass, -0.05, 0.81, -0.3, g, 12, { cast: false })
    sphere(0.012, std({ color: '#fff', emissive: '#ffb347', emissiveIntensity: 8 }), -0.05, 0.83, -0.3, g, 8)
    g.add(P.contactShadow(1.4, 1.4, { round: true, opacity: 0.5 }))
    if (!low) {
      for (const [cx, cz, ry] of [
        [-0.72, 0.1, Math.PI / 2],
        [0.72, 0.1, -Math.PI / 2],
      ]) {
        const c = P.chair()
        c.position.set(cx, 0, cz)
        c.rotation.y = ry
        g.add(c)
      }
    }
    pendantLight(x, z, 1.5, low ? 7 : 6, '#7a2318')
  }
  table(-3.3, -3.6, 'margherita', 4)
  table(2.9, -3.4, 'pepperoni', 5)

  // floor plants near the entrance
  for (const [x, z, seed] of [
    [-5.15, -1.0, 3],
    [5.15, -1.0, 7],
  ]) {
    const p = P.plant({ height: 1.25, spread: 0.42, leaves: 110, seed })
    p.position.set(x, 0, z)
    root.add(p)
  }

  // ── lights ───────────────────────────────────────────────────
  root.add(new THREE.HemisphereLight('#ffe2c4', '#3a2a22', low ? 0.75 : 0.45))

  const dusk = new THREE.DirectionalLight('#ffb98a', 1.3)
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

  const counterSpot = new THREE.SpotLight('#ffd9a8', low ? 30 : 40, 14, 0.85, 0.6, 1.4)
  counterSpot.position.set(0.4, 4.1, -4.4)
  counterSpot.target.position.set(0.2, 1.0, -8.2)
  root.add(counterSpot, counterSpot.target)
  if (shadows) {
    counterSpot.castShadow = true
    counterSpot.shadow.mapSize.set(2048, 2048)
    counterSpot.shadow.bias = -0.0004
    counterSpot.shadow.normalBias = 0.02
    counterSpot.shadow.radius = 4
  }

  // ── public API ───────────────────────────────────────────────
  const hotspots = Object.fromEntries(Object.entries(HOTSPOT_POSITIONS).map(([id, p]) => [id, new THREE.Vector3(...p)]))

  return {
    root,
    doors: { left: doorLeft, right: doorRight },
    hotspots,
    interactive,
    /** Where to capture the interior reflection probe from. */
    probePosition: new THREE.Vector3(0, 1.7, -6.2),
    update(t, dt) {
      for (const fn of animators) fn(t, dt)
    },
    dispose() {
      root.traverse((o) => {
        if (o.geometry) o.geometry.dispose()
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose())
        if (o.isInstancedMesh) o.dispose()
      })
      T.dispose()
      M.dispose()
      extraTextures.forEach((t) => t.dispose())
    },
  }
}
