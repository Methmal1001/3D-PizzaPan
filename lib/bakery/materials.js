// Procedural PBR texture sets (colour + normal + roughness) and realism helpers
// (contact shadows, ambient-occlusion strips, food & foliage textures). All generated on canvases.
import { mulberry32 } from '~/utils/seeded'

function canvas(w, h) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')]
}

/** Convert a greyscale height canvas into a tangent-space normal map canvas. */
function normalFromHeight(hc, strength = 2.5) {
  const w = hc.width
  const h = hc.height
  const src = hc.getContext('2d').getImageData(0, 0, w, h).data
  const [c, ctx] = canvas(w, h)
  const out = ctx.createImageData(w, h)
  const d = out.data
  const H = (x, y) => src[(((y + h) % h) * w + ((x + w) % w)) * 4] / 255
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const nx = -(H(x + 1, y) - H(x - 1, y)) * strength
      const ny = (H(x, y + 1) - H(x, y - 1)) * strength
      const len = Math.hypot(nx, ny, 1)
      const i = (y * w + x) * 4
      d[i] = (nx / len) * 127.5 + 127.5
      d[i + 1] = (ny / len) * 127.5 + 127.5
      d[i + 2] = (1 / len) * 127.5 + 127.5
      d[i + 3] = 255
    }
  }
  ctx.putImageData(out, 0, 0)
  return c
}

function speckle(ctx, w, h, n, colorFn, seed, size = 2) {
  const r = mulberry32(seed)
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = colorFn(r())
    ctx.fillRect(r() * w, r() * h, 1 + r() * size, 1 + r() * size)
  }
}

export function createMaterialFactory(THREE, renderer) {
  const made = []
  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy())

  const tex = (c, srgb = true) => {
    const t = new THREE.CanvasTexture(c)
    if (srgb) t.colorSpace = THREE.SRGBColorSpace
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.anisotropy = aniso
    made.push(t)
    return t
  }
  const set = (color, height, rough, strength) => ({
    map: tex(color),
    normalMap: height ? tex(normalFromHeight(height, strength), false) : null,
    roughnessMap: rough ? tex(rough, false) : null,
  })

  /** Same images, different tiling. */
  const repeat = (s, rx, ry) => {
    const out = {}
    for (const k of Object.keys(s)) {
      if (!s[k]) continue
      const t = s[k].clone()
      t.repeat.set(rx, ry)
      t.needsUpdate = true
      made.push(t)
      out[k] = t
    }
    return out
  }

  /** MeshStandardMaterial from a texture set. */
  const pbr = (s, opts = {}) =>
    new THREE.MeshStandardMaterial({
      ...s,
      roughness: s.roughnessMap ? 1 : 0.8,
      normalScale: new THREE.Vector2(1, 1),
      ...opts,
    })

  // ── surfaces ───────────────────────────────────────────────
  const brick = ({ base = [150, 62, 44], mortar = [182, 162, 140], seed = 3, rows = 10, cols = 4, whitewash = 0 } = {}) => {
    const S = 512
    const [c, ctx] = canvas(S, S)
    const [hc, hctx] = canvas(S, S)
    const [rc, rctx] = canvas(S, S)
    const r = mulberry32(seed)
    ctx.fillStyle = `rgb(${mortar})`
    ctx.fillRect(0, 0, S, S)
    hctx.fillStyle = '#2a2a2a'
    hctx.fillRect(0, 0, S, S)
    rctx.fillStyle = '#ffffff'
    rctx.fillRect(0, 0, S, S)
    const bh = S / rows
    const bw = S / cols
    const g = 4
    for (let row = 0; row < rows; row++) {
      const off = row % 2 ? bw / 2 : 0
      for (let x = -bw; x < S + bw; x += bw) {
        const v = 0.72 + r() * 0.38
        const hue = r() * 18 - 9
        const col = base.map((ch, i) => Math.max(0, Math.min(255, ch * v + (i === 0 ? hue : 0))))
        const bx = x + off + g / 2
        const by = row * bh + g / 2
        ctx.fillStyle = `rgb(${col.join(',')})`
        ctx.fillRect(bx, by, bw - g, bh - g)
        // darker burnt edges & lighter faces
        ctx.fillStyle = 'rgba(0,0,0,0.12)'
        ctx.fillRect(bx, by + bh - g - 5, bw - g, 5)
        ctx.fillStyle = 'rgba(255,255,255,0.06)'
        ctx.fillRect(bx, by, bw - g, 4)
        const hv = 175 + r() * 50
        hctx.fillStyle = `rgb(${hv},${hv},${hv})`
        hctx.fillRect(bx + 1, by + 1, bw - g - 2, bh - g - 2)
        const rv = 200 + r() * 40
        rctx.fillStyle = `rgb(${rv},${rv},${rv})`
        rctx.fillRect(bx, by, bw - g, bh - g)
      }
    }
    speckle(ctx, S, S, 9000, (t) => `rgba(0,0,0,${t * 0.22})`, seed + 1)
    speckle(ctx, S, S, 3000, (t) => `rgba(255,255,255,${t * 0.12})`, seed + 2)
    speckle(hctx, S, S, 14000, (t) => `rgba(${t > 0.5 ? '255,255,255' : '0,0,0'},${t * 0.25})`, seed + 3, 3)
    if (whitewash) {
      ctx.fillStyle = `rgba(245,236,222,${whitewash})`
      ctx.fillRect(0, 0, S, S)
      speckle(ctx, S, S, 4000, (t) => `rgba(150,110,90,${t * 0.25})`, seed + 4, 4)
    }
    return set(c, hc, rc, 4)
  }

  const wood = ({ base = [122, 75, 46], seed = 11, planks = 6, gloss = 150 } = {}) => {
    const S = 512
    const [c, ctx] = canvas(S, S)
    const [hc, hctx] = canvas(S, S)
    const [rc, rctx] = canvas(S, S)
    const r = mulberry32(seed)
    const pw = S / planks
    hctx.fillStyle = '#909090'
    hctx.fillRect(0, 0, S, S)
    rctx.fillStyle = `rgb(${gloss},${gloss},${gloss})`
    rctx.fillRect(0, 0, S, S)
    for (let p = 0; p < planks; p++) {
      const v = 0.8 + r() * 0.35
      ctx.fillStyle = `rgb(${base.map((ch) => Math.min(255, ch * v) | 0).join(',')})`
      ctx.fillRect(p * pw, 0, pw, S)
      for (let gI = 0; gI < 22; gI++) {
        const x0 = p * pw + r() * pw
        const amp = 2 + r() * 4
        const dark = r() > 0.35
        ctx.strokeStyle = dark ? `rgba(45,22,10,${0.1 + r() * 0.2})` : `rgba(255,220,180,${0.05 + r() * 0.08})`
        ctx.lineWidth = 0.6 + r() * 1.8
        hctx.strokeStyle = dark ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.15)'
        hctx.lineWidth = ctx.lineWidth
        for (const k of [ctx, hctx]) {
          k.beginPath()
          k.moveTo(x0, 0)
          for (let y = 0; y <= S; y += 16) k.lineTo(x0 + Math.sin(y / (40 + gI * 3) + p) * amp, y)
          k.stroke()
        }
      }
      // knots
      if (r() > 0.55) {
        const kx = p * pw + pw * (0.3 + r() * 0.4)
        const ky = r() * S
        for (let i = 6; i > 0; i--) {
          ctx.strokeStyle = `rgba(50,25,12,${0.12 + i * 0.02})`
          ctx.beginPath()
          ctx.ellipse(kx, ky, i * 2.2, i * 4.5, 0, 0, Math.PI * 2)
          ctx.stroke()
        }
      }
      ctx.fillStyle = 'rgba(20,10,5,0.6)'
      ctx.fillRect(p * pw, 0, 2, S)
      hctx.fillStyle = '#000'
      hctx.fillRect(p * pw, 0, 3, S)
      rctx.fillStyle = '#ffffff'
      rctx.fillRect(p * pw, 0, 3, S)
    }
    speckle(rctx, S, S, 5000, (t) => `rgba(255,255,255,${t * 0.2})`, seed + 5, 4)
    return set(c, hc, rc, 1.5)
  }

  const floorTiles = ({ a = [236, 226, 206], b = [38, 30, 27], n = 8, seed = 5 } = {}) => {
    const S = 1024
    const [c, ctx] = canvas(S, S)
    const [hc, hctx] = canvas(S, S)
    const [rc, rctx] = canvas(S, S)
    const r = mulberry32(seed)
    const s = S / n
    const g = 5
    ctx.fillStyle = '#7d7468'
    ctx.fillRect(0, 0, S, S)
    hctx.fillStyle = '#000'
    hctx.fillRect(0, 0, S, S)
    rctx.fillStyle = '#ececec'
    rctx.fillRect(0, 0, S, S)
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const base = (x + y) % 2 ? b : a
        const v = 0.93 + r() * 0.12
        ctx.fillStyle = `rgb(${base.map((ch) => Math.min(255, ch * v) | 0).join(',')})`
        ctx.fillRect(x * s + g / 2, y * s + g / 2, s - g, s - g)
        hctx.fillStyle = '#e0e0e0'
        hctx.fillRect(x * s + g / 2 + 1, y * s + g / 2 + 1, s - g - 2, s - g - 2)
        const rv = 40 + r() * 35
        rctx.fillStyle = `rgb(${rv},${rv},${rv})`
        rctx.fillRect(x * s + g / 2, y * s + g / 2, s - g, s - g)
      }
    }
    // wear, scuffs and smudges
    speckle(ctx, S, S, 14000, (t) => `rgba(90,70,55,${t * 0.12})`, seed + 1, 3)
    speckle(rctx, S, S, 2500, (t) => `rgba(255,255,255,${t * 0.35})`, seed + 2, 10)
    for (let i = 0; i < 40; i++) {
      rctx.strokeStyle = `rgba(255,255,255,${0.05 + r() * 0.1})`
      rctx.lineWidth = 8 + r() * 30
      rctx.beginPath()
      rctx.arc(r() * S, r() * S, 40 + r() * 140, r() * 6, r() * 6 + 1.5)
      rctx.stroke()
    }
    return set(c, hc, rc, 3)
  }

  const subwayTiles = ({ seed = 8 } = {}) => {
    const S = 512
    const [c, ctx] = canvas(S, S)
    const [hc, hctx] = canvas(S, S)
    const [rc, rctx] = canvas(S, S)
    const r = mulberry32(seed)
    const rows = 16
    const th = S / rows
    const tw = th * 2
    ctx.fillStyle = '#b9b2a6'
    ctx.fillRect(0, 0, S, S)
    hctx.fillStyle = '#000'
    hctx.fillRect(0, 0, S, S)
    rctx.fillStyle = '#e6e6e6'
    rctx.fillRect(0, 0, S, S)
    for (let row = 0; row < rows; row++) {
      const off = row % 2 ? tw / 2 : 0
      for (let x = -tw; x < S + tw; x += tw) {
        const bx = x + off + 1.5
        const by = row * th + 1.5
        const v = 238 + r() * 12
        ctx.fillStyle = `rgb(${v},${v - 4},${v - 12})`
        ctx.fillRect(bx, by, tw - 3, th - 3)
        // bevelled edges in the height map
        const grad = hctx.createLinearGradient(0, by, 0, by + th - 3)
        grad.addColorStop(0, '#606060')
        grad.addColorStop(0.18, '#ffffff')
        grad.addColorStop(0.82, '#ffffff')
        grad.addColorStop(1, '#606060')
        hctx.fillStyle = grad
        hctx.fillRect(bx, by, tw - 3, th - 3)
        rctx.fillStyle = `rgb(${30 + r() * 20},${30 + r() * 20},${30 + r() * 20})`
        rctx.fillRect(bx, by, tw - 3, th - 3)
      }
    }
    return set(c, hc, rc, 3)
  }

  const plaster = ({ base = [234, 216, 187], seed = 21 } = {}) => {
    const S = 512
    const [c, ctx] = canvas(S, S)
    const [hc, hctx] = canvas(S, S)
    ctx.fillStyle = `rgb(${base})`
    ctx.fillRect(0, 0, S, S)
    hctx.fillStyle = '#808080'
    hctx.fillRect(0, 0, S, S)
    const r = mulberry32(seed)
    for (let i = 0; i < 260; i++) {
      const x = r() * S
      const y = r() * S
      const rad = 10 + r() * 50
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad)
      const tone = r() > 0.5 ? '255,250,240' : '150,120,90'
      g.addColorStop(0, `rgba(${tone},${0.04 + r() * 0.05})`)
      g.addColorStop(1, `rgba(${tone},0)`)
      ctx.fillStyle = g
      ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2)
      const hg = hctx.createRadialGradient(x, y, 0, x, y, rad)
      hg.addColorStop(0, `rgba(${r() > 0.5 ? '255,255,255' : '0,0,0'},0.12)`)
      hg.addColorStop(1, 'rgba(128,128,128,0)')
      hctx.fillStyle = hg
      hctx.fillRect(x - rad, y - rad, rad * 2, rad * 2)
    }
    speckle(hctx, S, S, 20000, (t) => `rgba(${t > 0.5 ? '255,255,255' : '0,0,0'},${t * 0.2})`, seed + 2, 2)
    return set(c, hc, null, 1.2)
  }

  const marble = ({ seed = 31 } = {}) => {
    const S = 512
    const [c, ctx] = canvas(S, S)
    const [rc, rctx] = canvas(S, S)
    const r = mulberry32(seed)
    ctx.fillStyle = '#f1ece4'
    ctx.fillRect(0, 0, S, S)
    rctx.fillStyle = '#383838'
    rctx.fillRect(0, 0, S, S)
    for (let i = 0; i < 26; i++) {
      ctx.strokeStyle = `rgba(${110 + r() * 40},${100 + r() * 40},${95 + r() * 30},${0.08 + r() * 0.25})`
      ctx.lineWidth = 0.6 + r() * 2.4
      ctx.shadowColor = 'rgba(120,110,100,0.4)'
      ctx.shadowBlur = 4
      ctx.beginPath()
      let x = r() * S
      let y = r() * S
      ctx.moveTo(x, y)
      for (let k = 0; k < 8; k++) {
        x += (r() - 0.3) * 120
        y += (r() - 0.5) * 90
        ctx.lineTo(x, y)
      }
      ctx.stroke()
    }
    ctx.shadowBlur = 0
    return set(c, null, rc)
  }

  const brushedMetal = ({ base = [190, 192, 196], seed = 41 } = {}) => {
    const S = 256
    const [c, ctx] = canvas(S, S)
    const [rc, rctx] = canvas(S, S)
    const r = mulberry32(seed)
    ctx.fillStyle = `rgb(${base})`
    ctx.fillRect(0, 0, S, S)
    rctx.fillStyle = '#5a5a5a'
    rctx.fillRect(0, 0, S, S)
    for (let i = 0; i < 900; i++) {
      const y = r() * S
      const v = r() > 0.5 ? 255 : 0
      ctx.fillStyle = `rgba(${v},${v},${v},${r() * 0.06})`
      ctx.fillRect(0, y, S, 1)
      rctx.fillStyle = `rgba(${v},${v},${v},${r() * 0.12})`
      rctx.fillRect(0, y, S, 1)
    }
    return set(c, null, rc)
  }

  const concrete = ({ seed = 51 } = {}) => {
    const S = 256
    const [c, ctx] = canvas(S, S)
    const [hc, hctx] = canvas(S, S)
    ctx.fillStyle = '#6d6560'
    ctx.fillRect(0, 0, S, S)
    hctx.fillStyle = '#909090'
    hctx.fillRect(0, 0, S, S)
    speckle(ctx, S, S, 7000, (t) => `rgba(0,0,0,${t * 0.2})`, seed)
    speckle(ctx, S, S, 2000, (t) => `rgba(255,255,255,${t * 0.08})`, seed + 1)
    speckle(hctx, S, S, 8000, (t) => `rgba(${t > 0.5 ? '255,255,255' : '0,0,0'},${t * 0.3})`, seed + 2)
    ctx.strokeStyle = 'rgba(25,20,18,0.7)'
    ctx.lineWidth = 3
    ctx.strokeRect(1, 1, S - 2, S - 2)
    hctx.strokeStyle = '#000'
    hctx.lineWidth = 3
    hctx.strokeRect(1, 1, S - 2, S - 2)
    return set(c, hc, null, 2)
  }

  // ── food & foliage ─────────────────────────────────────────
  const cheese = (variant = 0) => {
    const S = 512
    const [c, ctx] = canvas(S, S)
    const [hc, hctx] = canvas(S, S)
    const r = mulberry32(300 + variant)
    ctx.fillStyle = variant === 2 ? '#f6d98f' : '#f2c96d'
    ctx.fillRect(0, 0, S, S)
    hctx.fillStyle = '#808080'
    hctx.fillRect(0, 0, S, S)
    // sauce peeking through
    for (let i = 0; i < 70; i++) {
      ctx.fillStyle = `rgba(${170 + r() * 40},${40 + r() * 20},${25},${0.5 + r() * 0.4})`
      ctx.beginPath()
      ctx.ellipse(r() * S, r() * S, 4 + r() * 14, 3 + r() * 9, r() * 3, 0, Math.PI * 2)
      ctx.fill()
    }
    // melted cheese pools + bubbles
    for (let i = 0; i < 140; i++) {
      const x = r() * S
      const y = r() * S
      const rad = 8 + r() * 30
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad)
      g.addColorStop(0, 'rgba(255,240,190,0.9)')
      g.addColorStop(1, 'rgba(250,215,130,0)')
      ctx.fillStyle = g
      ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2)
      const hg = hctx.createRadialGradient(x, y, 0, x, y, rad)
      hg.addColorStop(0, 'rgba(255,255,255,0.5)')
      hg.addColorStop(1, 'rgba(128,128,128,0)')
      hctx.fillStyle = hg
      hctx.fillRect(x - rad, y - rad, rad * 2, rad * 2)
    }
    // browned blisters
    for (let i = 0; i < 90; i++) {
      const x = r() * S
      const y = r() * S
      const rad = 2 + r() * 7
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad)
      g.addColorStop(0, 'rgba(150,80,25,0.85)')
      g.addColorStop(1, 'rgba(200,130,50,0)')
      ctx.fillStyle = g
      ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2)
    }
    const s = set(c, hc, null, 3)
    s.map.wrapS = s.map.wrapT = THREE.ClampToEdgeWrapping
    return s
  }

  const crust = () => {
    const S = 256
    const [c, ctx] = canvas(S, S)
    const [hc, hctx] = canvas(S, S)
    ctx.fillStyle = '#d99a52'
    ctx.fillRect(0, 0, S, S)
    hctx.fillStyle = '#808080'
    hctx.fillRect(0, 0, S, S)
    const r = mulberry32(77)
    for (let i = 0; i < 160; i++) {
      const x = r() * S
      const y = r() * S
      const rad = 3 + r() * 16
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad)
      const charred = r() > 0.8
      g.addColorStop(0, charred ? 'rgba(60,30,12,0.8)' : `rgba(${160 + r() * 60},${90 + r() * 40},35,0.6)`)
      g.addColorStop(1, 'rgba(217,154,82,0)')
      ctx.fillStyle = g
      ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2)
    }
    speckle(hctx, S, S, 6000, (t) => `rgba(${t > 0.5 ? '255,255,255' : '0,0,0'},${t * 0.4})`, 78, 3)
    speckle(ctx, S, S, 1500, () => 'rgba(250,245,230,0.5)', 79, 1) // flour dusting
    return set(c, hc, null, 3)
  }

  const leaf = (hueShift = 0) => {
    const [c, ctx] = canvas(128, 192)
    const g = ctx.createLinearGradient(0, 0, 128, 192)
    g.addColorStop(0, `hsl(${100 + hueShift}, 45%, 38%)`)
    g.addColorStop(1, `hsl(${115 + hueShift}, 55%, 22%)`)
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.moveTo(64, 4)
    ctx.bezierCurveTo(128, 50, 118, 140, 64, 188)
    ctx.bezierCurveTo(10, 140, 0, 50, 64, 4)
    ctx.fill()
    ctx.strokeStyle = 'rgba(200,230,170,0.5)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(64, 10)
    ctx.lineTo(64, 184)
    ctx.stroke()
    ctx.lineWidth = 1
    for (let i = 0; i < 7; i++) {
      const y = 30 + i * 22
      ctx.beginPath()
      ctx.moveTo(64, y)
      ctx.quadraticCurveTo(84, y - 6, 100 - i * 3, y - 14)
      ctx.moveTo(64, y)
      ctx.quadraticCurveTo(44, y - 6, 28 + i * 3, y - 14)
      ctx.stroke()
    }
    const t = tex(c)
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping
    return t
  }

  const canLabel = (main = '#c8231f', text = 'POMODORO') => {
    const [c, ctx] = canvas(512, 128)
    ctx.fillStyle = main
    ctx.fillRect(0, 0, 512, 128)
    ctx.fillStyle = '#f5ecd8'
    ctx.fillRect(0, 22, 512, 84)
    ctx.fillStyle = main
    ctx.font = '700 40px Fraunces, Georgia, serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    for (const x of [128, 384]) ctx.fillText(text, x, 66)
    ctx.fillStyle = '#3e7b2b'
    ctx.fillRect(0, 106, 512, 8)
    return tex(c)
  }

  const photo = (variant = 0) => {
    const [c, ctx] = canvas(256, 320)
    const sky = ctx.createLinearGradient(0, 0, 0, 320)
    sky.addColorStop(0, '#d9c7a8')
    sky.addColorStop(1, '#8a7356')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, 256, 320)
    ctx.fillStyle = 'rgba(60,45,30,0.85)'
    if (variant === 0) {
      ctx.beginPath()
      ctx.moveTo(0, 220)
      ctx.lineTo(90, 130)
      ctx.lineTo(120, 150)
      ctx.lineTo(150, 120)
      ctx.lineTo(256, 230)
      ctx.lineTo(256, 320)
      ctx.lineTo(0, 320)
      ctx.fill()
      ctx.fillStyle = 'rgba(40,30,20,0.5)'
      ctx.fillRect(0, 250, 256, 70)
    } else {
      ctx.beginPath()
      ctx.arc(128, 170, 80, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'rgba(230,210,180,0.7)'
      for (let i = 0; i < 8; i++) {
        ctx.beginPath()
        ctx.arc(128 + Math.cos(i) * 45, 170 + Math.sin(i * 1.7) * 45, 10, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    speckle(ctx, 256, 320, 4000, (t) => `rgba(40,25,10,${t * 0.25})`, 90 + variant, 2)
    ctx.fillStyle = '#3a2a1c'
    ctx.font = 'italic 600 22px Fraunces, Georgia, serif'
    ctx.textAlign = 'center'
    ctx.fillText(variant === 0 ? 'Napoli · 1962' : 'Nonna’s kitchen', 128, 300)
    const t = tex(c)
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping
    return t
  }

  // ── fake global illumination helpers ───────────────────────
  /** Soft rectangular (or round) contact-shadow decal for under furniture. */
  const shadowTex = (round = false) => {
    const S = 128
    const [c, ctx] = canvas(S, S)
    ctx.fillStyle = '#000'
    ctx.shadowColor = 'rgba(0,0,0,1)'
    ctx.shadowBlur = 22
    ctx.shadowOffsetX = 1000
    if (round) {
      ctx.beginPath()
      ctx.arc(S / 2 - 1000, S / 2, S * 0.3, 0, Math.PI * 2)
      ctx.fill()
    } else {
      ctx.fillRect(S * 0.2 - 1000, S * 0.2, S * 0.6, S * 0.6)
    }
    const t = tex(c)
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping
    return t
  }
  const gradientTex = () => {
    const [c, ctx] = canvas(4, 128)
    const g = ctx.createLinearGradient(0, 0, 0, 128)
    g.addColorStop(0, 'rgba(0,0,0,1)')
    g.addColorStop(0.35, 'rgba(0,0,0,0.35)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 4, 128)
    const t = tex(c)
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping
    return t
  }

  return {
    pbr,
    repeat,
    brick,
    wood,
    floorTiles,
    subwayTiles,
    plaster,
    marble,
    brushedMetal,
    concrete,
    cheese,
    crust,
    leaf,
    canLabel,
    photo,
    shadowTex,
    gradientTex,
    dispose: () => made.forEach((t) => t.dispose()),
  }
}
