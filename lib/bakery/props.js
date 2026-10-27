// Detailed, reasonably low-poly props for the bakery interior. Repeated parts use InstancedMesh.
import { mulberry32 } from '~/utils/seeded'

export function createProps(THREE, M, { low = false, shadows = true } = {}) {
  const dummy = new THREE.Object3D()
  const seg = (n) => (low ? Math.max(8, Math.round(n * 0.6)) : n)

  const mesh = (geo, mat, { cast = true, receive = true } = {}) => {
    const m = new THREE.Mesh(geo, mat)
    m.castShadow = shadows && cast
    m.receiveShadow = shadows && receive
    return m
  }
  const at = (obj, x, y, z, parent) => {
    obj.position.set(x, y, z)
    parent?.add(obj)
    return obj
  }

  // ── shared materials ───────────────────────────────────────
  const crustSet = M.crust()
  const mats = {
    crust: M.pbr(crustSet, { roughness: 0.75, normalScale: new THREE.Vector2(0.6, 0.6) }),
    sauce: new THREE.MeshStandardMaterial({ color: '#a72b1c', roughness: 0.35 }),
    pepperoni: new THREE.MeshStandardMaterial({ color: '#9e2a1d', roughness: 0.38 }),
    olive: new THREE.MeshStandardMaterial({ color: '#1b1714', roughness: 0.25 }),
    pepper: new THREE.MeshStandardMaterial({ color: '#2f7d2e', roughness: 0.3 }),
    mushroom: new THREE.MeshStandardMaterial({ color: '#d8c3a2', roughness: 0.6 }),
    mozz: new THREE.MeshStandardMaterial({ color: '#fbf3dc', roughness: 0.35 }),
    chrome: new THREE.MeshStandardMaterial({ color: '#d7d9dc', metalness: 1, roughness: 0.18 }),
    blackMetal: new THREE.MeshStandardMaterial({ color: '#1c1a19', metalness: 0.6, roughness: 0.42 }),
    brass: new THREE.MeshStandardMaterial({ color: '#c49a4c', metalness: 1, roughness: 0.28 }),
    ceramic: new THREE.MeshStandardMaterial({ color: '#f7f3ec', roughness: 0.18 }),
    glass: new THREE.MeshStandardMaterial({
      color: '#dfeef0',
      roughness: 0.02,
      metalness: 0,
      transparent: true,
      opacity: 0.12,
      envMapIntensity: 1.5,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    darkWood: M.pbr(M.wood({ base: [72, 42, 26], seed: 61, planks: 3, gloss: 120 }), { normalScale: new THREE.Vector2(0.5, 0.5) }),
    leather: new THREE.MeshStandardMaterial({ color: '#7a2318', roughness: 0.55 }),
  }
  const cheeseMats = [0, 1, 2].map((v) => M.pbr(M.cheese(v), { roughness: 0.42, normalScale: new THREE.Vector2(0.8, 0.8) }))
  const leafMats = [0, 14, -8].map(
    (h) => new THREE.MeshStandardMaterial({ map: M.leaf(h), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.55 }),
  )
  const basilMat = leafMats[0]

  const shadowSquare = M.shadowTex(false)
  const shadowRound = M.shadowTex(true)

  // ── helpers ─────────────────────────────────────────────────
  /** Soft contact shadow decal on the floor (or any horizontal surface). */
  function contactShadow(w, d, { round = false, opacity = 0.55, y = 0.004 } = {}) {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, d),
      new THREE.MeshBasicMaterial({
        map: round ? shadowRound : shadowSquare,
        transparent: true,
        opacity,
        depthWrite: false,
        color: '#000000',
        polygonOffset: true,
        polygonOffsetFactor: -2,
      }),
    )
    m.rotation.x = -Math.PI / 2
    m.position.y = y
    m.renderOrder = 1
    return m
  }

  function instanced(geo, mat, transforms, colors) {
    const im = new THREE.InstancedMesh(geo, mat, transforms.length)
    transforms.forEach((t, i) => {
      dummy.position.set(t.x, t.y, t.z)
      dummy.rotation.set(t.rx || 0, t.ry || 0, t.rz || 0)
      dummy.scale.setScalar(t.s || 1)
      if (t.sx) dummy.scale.set(t.sx, t.sy ?? t.sx, t.sz ?? t.sx)
      dummy.updateMatrix()
      im.setMatrixAt(i, dummy.matrix)
      if (colors) im.setColorAt(i, new THREE.Color(colors[i % colors.length]))
    })
    im.castShadow = shadows
    im.receiveShadow = shadows
    return im
  }

  const scatterDisc = (n, radius, seed) => {
    const r = mulberry32(seed)
    const out = []
    for (let i = 0; i < n; i++) {
      const rr = radius * Math.sqrt((i + 0.5) / n) * (0.9 + r() * 0.15)
      const a = i * 2.39996 + r() * 0.5
      out.push({ x: Math.cos(a) * rr, z: Math.sin(a) * rr, r: r() })
    }
    return out
  }

  // ── pizza ───────────────────────────────────────────────────
  function pizza({ radius = 0.26, kind = 'pepperoni', seed = 1, board = true } = {}) {
    const g = new THREE.Group()
    let y0 = 0
    if (board) {
      const b = mesh(new THREE.CylinderGeometry(radius * 1.14, radius * 1.14, 0.024, seg(40)), mats.darkWood)
      at(b, 0, 0.012, 0, g)
      const handle = mesh(new THREE.BoxGeometry(0.16, 0.024, 0.07), mats.darkWood)
      at(handle, radius * 1.14 + 0.07, 0.012, 0, g)
      y0 = 0.024
    }
    at(mesh(new THREE.CylinderGeometry(radius * 0.96, radius * 0.98, 0.012, seg(48)), mats.crust), 0, y0 + 0.006, 0, g)
    const sauce = mesh(new THREE.CircleGeometry(radius * 0.9, seg(48)), mats.sauce, { cast: false })
    sauce.rotation.x = -Math.PI / 2
    at(sauce, 0, y0 + 0.0125, 0, g)
    const cheeseTop = mesh(new THREE.CircleGeometry(radius * 0.86, seg(48)), cheeseMats[seed % 3], { cast: false })
    cheeseTop.rotation.x = -Math.PI / 2
    at(cheeseTop, 0, y0 + 0.0135, 0, g)
    const rim = mesh(new THREE.TorusGeometry(radius * 0.9, radius * 0.08, seg(10), seg(48)), mats.crust)
    rim.rotation.x = Math.PI / 2
    rim.scale.z = 0.8
    at(rim, 0, y0 + 0.014, 0, g)

    const top = y0 + 0.017
    const r = mulberry32(seed * 97)
    const add = (geo, mat, n, spread, extra = {}) => {
      const pts = scatterDisc(n, radius * spread, seed * 13 + n)
      g.add(
        instanced(
          geo,
          mat,
          pts.map((p) => ({ x: p.x, y: top + (extra.dy || 0), z: p.z, rx: (extra.rx || 0) + (r() - 0.5) * 0.15, ry: r() * Math.PI * 2, s: 0.85 + r() * 0.3 })),
        ),
      )
    }
    if (kind === 'pepperoni') {
      add(new THREE.CylinderGeometry(0.03, 0.033, 0.006, 16), mats.pepperoni, 11, 0.74)
      add(new THREE.TorusGeometry(0.011, 0.0055, 6, 12), mats.olive, 6, 0.7, { rx: Math.PI / 2, dy: 0.002 })
    } else if (kind === 'margherita') {
      add(new THREE.SphereGeometry(0.03, 10, 6).scale(1, 0.25, 1), mats.mozz, 7, 0.7)
      add(new THREE.PlaneGeometry(0.05, 0.07), basilMat, 7, 0.65, { rx: -Math.PI / 2, dy: 0.006 })
    } else {
      add(new THREE.TorusGeometry(0.02, 0.006, 6, 14, Math.PI * 1.3), mats.pepper, 8, 0.72, { rx: Math.PI / 2 })
      add(new THREE.TorusGeometry(0.011, 0.0055, 6, 12), mats.olive, 9, 0.72, { rx: Math.PI / 2, dy: 0.002 })
      add(new THREE.SphereGeometry(0.022, 10, 6).scale(1, 0.3, 0.8), mats.mushroom, 6, 0.6)
    }
    return g
  }

  // ── plants ──────────────────────────────────────────────────
  function plant({ height = 1.0, spread = 0.45, leaves = 80, seed = 3, pot = true, potColor = '#9c4f2c' } = {}) {
    const g = new THREE.Group()
    const r = mulberry32(seed)
    let base = 0
    if (pot) {
      const pts = [
        [0, 0],
        [0.17, 0],
        [0.2, 0.05],
        [0.24, 0.42],
        [0.27, 0.44],
        [0.27, 0.48],
        [0.0, 0.48],
      ].map(([x, y]) => new THREE.Vector2(x, y))
      const potMesh = mesh(new THREE.LatheGeometry(pts, seg(28)), new THREE.MeshStandardMaterial({ color: potColor, roughness: 0.85 }))
      g.add(potMesh)
      const soil = mesh(new THREE.CircleGeometry(0.24, 20), new THREE.MeshStandardMaterial({ color: '#2b1d14', roughness: 1 }), { cast: false })
      soil.rotation.x = -Math.PI / 2
      at(soil, 0, 0.45, 0, g)
      base = 0.45
      g.add(contactShadow(0.8, 0.8, { round: true, opacity: 0.6 }))
    }
    const geo = new THREE.PlaneGeometry(0.13, 0.2)
    geo.translate(0, 0.1, 0)
    const n = low ? Math.round(leaves * 0.5) : leaves
    const byMat = [[], [], []]
    for (let i = 0; i < n; i++) {
      const a = r() * Math.PI * 2
      const tilt = 0.25 + r() * 1.15
      const L = height * (0.35 + r() * 0.65)
      const p = { x: Math.sin(a) * Math.sin(tilt) * L * spread * 1.6, y: base + Math.cos(tilt) * L * 0.85, z: Math.cos(a) * Math.sin(tilt) * L * spread * 1.6 }
      dummy.position.set(p.x, p.y, p.z)
      dummy.rotation.set(0, 0, 0)
      dummy.rotateY(a)
      dummy.rotateX(tilt * 0.9 + 0.2)
      dummy.rotateY((r() - 0.5) * 1.2)
      dummy.scale.setScalar(0.7 + r() * 0.7)
      dummy.updateMatrix()
      byMat[i % 3].push(dummy.matrix.clone())
    }
    byMat.forEach((list, k) => {
      const im = new THREE.InstancedMesh(geo, leafMats[k], list.length)
      list.forEach((m, i) => im.setMatrixAt(i, m))
      im.castShadow = shadows
      g.add(im)
    })
    return g
  }

  /** Pothos-style trailing plant hanging over a shelf edge. */
  function trailingPlant({ strands = 5, length = 0.9, seed = 9 } = {}) {
    const g = new THREE.Group()
    const r = mulberry32(seed)
    const geo = new THREE.PlaneGeometry(0.09, 0.12)
    geo.translate(0, 0.06, 0)
    const list = []
    for (let s = 0; s < strands; s++) {
      const sx = (r() - 0.5) * 0.35
      const sz = (r() - 0.5) * 0.15
      const steps = Math.round((length * (0.6 + r() * 0.6)) / 0.06)
      for (let i = 0; i < steps; i++) {
        dummy.position.set(sx + Math.sin(i * 0.7 + s) * 0.04, -i * 0.06, sz + 0.1 + Math.cos(i * 0.5) * 0.03)
        dummy.rotation.set(Math.PI * 0.85 + (r() - 0.5) * 0.6, r() * Math.PI * 2, (r() - 0.5) * 0.8)
        dummy.scale.setScalar(0.7 + r() * 0.6)
        dummy.updateMatrix()
        list.push(dummy.matrix.clone())
      }
    }
    const im = new THREE.InstancedMesh(geo, leafMats[1], list.length)
    list.forEach((m, i) => im.setMatrixAt(i, m))
    g.add(im)
    return g
  }

  // ── seating ─────────────────────────────────────────────────
  function stool() {
    const g = new THREE.Group()
    at(mesh(new THREE.CylinderGeometry(0.19, 0.18, 0.06, seg(28)), mats.leather), 0, 0.76, 0, g)
    const rim = mesh(new THREE.TorusGeometry(0.185, 0.012, 8, seg(28)), mats.blackMetal)
    rim.rotation.x = Math.PI / 2
    at(rim, 0, 0.73, 0, g)
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4
      const leg = mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.76, 8), mats.blackMetal)
      leg.position.set(Math.cos(a) * 0.15, 0.37, Math.sin(a) * 0.15)
      leg.rotation.set(Math.sin(a) * -0.09, 0, Math.cos(a) * 0.09)
      g.add(leg)
    }
    const ring = mesh(new THREE.TorusGeometry(0.17, 0.01, 6, seg(28)), mats.chrome)
    ring.rotation.x = Math.PI / 2
    at(ring, 0, 0.27, 0, g)
    g.add(contactShadow(0.6, 0.6, { round: true, opacity: 0.45 }))
    return g
  }

  function chair() {
    const g = new THREE.Group()
    at(mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.035, seg(28)), mats.darkWood), 0, 0.46, 0, g)
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4
      const leg = mesh(new THREE.CylinderGeometry(0.013, 0.012, 0.46, 8), mats.darkWood)
      leg.position.set(Math.cos(a) * 0.15, 0.23, Math.sin(a) * 0.15)
      leg.rotation.set(Math.sin(a) * -0.08, 0, Math.cos(a) * 0.08)
      g.add(leg)
    }
    const ring = mesh(new THREE.TorusGeometry(0.15, 0.009, 6, seg(24)), mats.darkWood)
    ring.rotation.x = Math.PI / 2
    at(ring, 0, 0.2, 0, g)
    const hoop = mesh(new THREE.TorusGeometry(0.17, 0.014, 8, seg(24), Math.PI), mats.darkWood)
    at(hoop, 0, 0.72, -0.17, g)
    for (const x of [-0.17, 0.17]) at(mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.27, 8), mats.darkWood), x, 0.6, -0.17, g)
    for (const x of [-0.06, 0.06]) at(mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.25, 6), mats.darkWood), x, 0.6, -0.17, g)
    g.add(contactShadow(0.65, 0.65, { round: true, opacity: 0.45 }))
    return g
  }

  // ── lighting fixtures ───────────────────────────────────────
  const bulbMat = new THREE.MeshStandardMaterial({ color: '#fff3d6', emissive: '#ffcf8a', emissiveIntensity: low ? 3 : 5 })
  function pendant({ drop = 1.0, color = '#1f3a2e' } = {}) {
    const g = new THREE.Group()
    at(mesh(new THREE.CylinderGeometry(0.005, 0.005, drop, 6), mats.blackMetal, { cast: false }), 0, -drop / 2, 0, g)
    const prof = [
      [0.02, 0.02],
      [0.045, 0],
      [0.06, -0.04],
      [0.13, -0.12],
      [0.21, -0.2],
      [0.235, -0.235],
    ].map(([x, y]) => new THREE.Vector2(x, y))
    // The profile runs top→bottom, so the lathe's front faces point inwards: the enamel shell
    // is rendered on the back side and the warm lining on the front side.
    const outer = mesh(new THREE.LatheGeometry(prof, seg(32)), new THREE.MeshStandardMaterial({ color, metalness: 0.35, roughness: 0.32, side: THREE.BackSide }), { cast: false })
    const inner = mesh(
      new THREE.LatheGeometry(prof, seg(32)),
      new THREE.MeshStandardMaterial({ color: '#f4ede0', emissive: '#ffd8a0', emissiveIntensity: 0.15, side: THREE.FrontSide, roughness: 0.5 }),
      { cast: false },
    )
    for (const s of [outer, inner]) at(s, 0, -drop, 0, g)
    const bulb = mesh(new THREE.SphereGeometry(0.045, 16, 12), bulbMat, { cast: false })
    bulb.scale.y = 1.3
    at(bulb, 0, -drop - 0.12, 0, g)
    return { group: g, bulbY: -drop - 0.12 }
  }

  // ── glassware & bottles ─────────────────────────────────────
  const bottleProfile = [
    [0, 0],
    [0.035, 0],
    [0.038, 0.01],
    [0.038, 0.17],
    [0.03, 0.2],
    [0.013, 0.24],
    [0.012, 0.29],
    [0.014, 0.3],
    [0, 0.3],
  ].map(([x, y]) => new THREE.Vector2(x, y))
  const bottleGeo = new THREE.LatheGeometry(bottleProfile, 14)
  const canGeo = new THREE.CylinderGeometry(0.033, 0.033, 0.12, 16)

  function glassTumbler() {
    const pts = [
      [0, 0],
      [0.035, 0],
      [0.04, 0.11],
      [0.037, 0.11],
      [0.032, 0.006],
      [0, 0.006],
    ].map(([x, y]) => new THREE.Vector2(x, y))
    return mesh(new THREE.LatheGeometry(pts, 16), mats.glass, { cast: false })
  }

  return {
    mats,
    mesh,
    at,
    instanced,
    contactShadow,
    pizza,
    plant,
    trailingPlant,
    stool,
    chair,
    pendant,
    glassTumbler,
    bottleGeo,
    canGeo,
  }
}
