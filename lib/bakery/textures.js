// Procedural canvas textures for the 3D bakery — no external image downloads required.
import { PRODUCTS } from '~/data/products'
import { formatLKR } from '~/utils/pricing'
import { mulberry32 } from '~/utils/seeded'

const DISPLAY_FONT = 'Fraunces, Georgia, serif'
const SANS_FONT = '"Plus Jakarta Sans", system-ui, sans-serif'

/** Ensure web fonts are ready before drawing text onto canvases (max ~1.2s wait). */
export async function waitForFonts() {
  if (!document.fonts?.load) return
  try {
    await Promise.race([
      Promise.all([document.fonts.load(`700 64px ${DISPLAY_FONT}`), document.fonts.load(`700 32px ${SANS_FONT}`)]),
      new Promise((r) => setTimeout(r, 1200)),
    ])
  } catch {
    /* fall back to system fonts */
  }
}

function canvas(w, h) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')]
}

function noise(ctx, w, h, amount, alpha, seed = 7, light = false) {
  const rand = mulberry32(seed)
  for (let i = 0; i < amount; i++) {
    ctx.fillStyle = light ? `rgba(255,255,255,${alpha * rand()})` : `rgba(0,0,0,${alpha * rand()})`
    ctx.fillRect(rand() * w, rand() * h, 1 + rand() * 2, 1 + rand() * 2)
  }
}

export function createTextureFactory(THREE, renderer) {
  const made = []
  const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy())

  const toTexture = (c, { repeat = [1, 1], color = true } = {}) => {
    const t = new THREE.CanvasTexture(c)
    if (color) t.colorSpace = THREE.SRGBColorSpace
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(repeat[0], repeat[1])
    t.anisotropy = maxAniso
    made.push(t)
    return t
  }

  /** Clone a texture with a different repeat (shares the same image source). */
  const repeat = (tex, rx, ry) => {
    const t = tex.clone()
    t.repeat.set(rx, ry)
    t.needsUpdate = true
    made.push(t)
    return t
  }

  const brick = (base = [138, 59, 42], mortar = '#b8a28c', seed = 3) => {
    const [c, ctx] = canvas(512, 512)
    ctx.fillStyle = mortar
    ctx.fillRect(0, 0, 512, 512)
    const rand = mulberry32(seed)
    const rows = 10
    const bh = 512 / rows
    for (let r = 0; r < rows; r++) {
      const bw = 128
      const off = r % 2 ? bw / 2 : 0
      for (let x = -bw; x < 512 + bw; x += bw) {
        const v = 0.78 + rand() * 0.35
        ctx.fillStyle = `rgb(${base[0] * v | 0},${base[1] * v | 0},${base[2] * v | 0})`
        ctx.fillRect(x + off + 3, r * bh + 3, bw - 6, bh - 6)
        ctx.fillStyle = 'rgba(255,255,255,0.05)'
        ctx.fillRect(x + off + 3, r * bh + 3, bw - 6, 4)
      }
    }
    noise(ctx, 512, 512, 6000, 0.25, seed)
    return toTexture(c)
  }

  const wood = (base = '#7a4b2e', seed = 11, planks = 6) => {
    const [c, ctx] = canvas(512, 512)
    ctx.fillStyle = base
    ctx.fillRect(0, 0, 512, 512)
    const rand = mulberry32(seed)
    const pw = 512 / planks
    for (let p = 0; p < planks; p++) {
      ctx.fillStyle = `rgba(${rand() > 0.5 ? '255,255,255' : '0,0,0'},${0.04 + rand() * 0.08})`
      ctx.fillRect(p * pw, 0, pw, 512)
      for (let g = 0; g < 14; g++) {
        ctx.strokeStyle = `rgba(40,20,10,${0.1 + rand() * 0.18})`
        ctx.lineWidth = 1 + rand() * 1.5
        ctx.beginPath()
        const x = p * pw + rand() * pw
        ctx.moveTo(x, 0)
        for (let y = 0; y <= 512; y += 32) ctx.lineTo(x + Math.sin(y / 60 + g) * 3 * rand(), y)
        ctx.stroke()
      }
      ctx.fillStyle = 'rgba(20,10,5,0.55)'
      ctx.fillRect(p * pw, 0, 2, 512)
    }
    return toTexture(c)
  }

  const checker = (a = '#ece0c8', b = '#3b2c25', n = 8) => {
    const [c, ctx] = canvas(512, 512)
    const s = 512 / n
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        ctx.fillStyle = (x + y) % 2 ? b : a
        ctx.fillRect(x * s, y * s, s, s)
      }
    }
    noise(ctx, 512, 512, 5000, 0.12, 5)
    noise(ctx, 512, 512, 2000, 0.08, 9, true)
    return toTexture(c)
  }

  const plaster = (base = '#efe2cc', seed = 21) => {
    const [c, ctx] = canvas(256, 256)
    ctx.fillStyle = base
    ctx.fillRect(0, 0, 256, 256)
    noise(ctx, 256, 256, 4000, 0.07, seed)
    noise(ctx, 256, 256, 2000, 0.1, seed + 1, true)
    return toTexture(c)
  }

  const concrete = () => {
    const [c, ctx] = canvas(256, 256)
    ctx.fillStyle = '#6d6560'
    ctx.fillRect(0, 0, 256, 256)
    noise(ctx, 256, 256, 6000, 0.2, 31)
    ctx.strokeStyle = 'rgba(30,25,22,0.6)'
    ctx.lineWidth = 2
    ctx.strokeRect(1, 1, 254, 254)
    return toTexture(c)
  }

  const awning = () => {
    const [c, ctx] = canvas(512, 64)
    const stripes = 16
    for (let i = 0; i < stripes; i++) {
      ctx.fillStyle = i % 2 ? '#F6EEDD' : '#C8232B'
      ctx.fillRect((i * 512) / stripes, 0, 512 / stripes, 64)
    }
    noise(ctx, 512, 64, 1500, 0.1, 41)
    return toTexture(c)
  }

  const valance = () => {
    const [c, ctx] = canvas(1024, 64)
    const stripes = 32
    const sw = 1024 / stripes
    for (let i = 0; i < stripes; i++) {
      ctx.save()
      ctx.beginPath()
      ctx.moveTo(i * sw, 0)
      ctx.lineTo((i + 1) * sw, 0)
      ctx.lineTo((i + 1) * sw, 34)
      ctx.arc(i * sw + sw / 2, 34, sw / 2, 0, Math.PI)
      ctx.closePath()
      ctx.fillStyle = i % 2 ? '#F6EEDD' : '#C8232B'
      ctx.fill()
      ctx.restore()
    }
    const t = toTexture(c)
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping
    return t
  }

  const sign = () => {
    const [c, ctx] = canvas(1024, 220)
    ctx.fillStyle = '#1b1411'
    ctx.fillRect(0, 0, 1024, 220)
    ctx.strokeStyle = '#FCBF49'
    ctx.lineWidth = 6
    ctx.strokeRect(14, 14, 996, 192)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.shadowColor = 'rgba(252,191,73,0.9)'
    ctx.shadowBlur = 18
    ctx.font = `700 104px ${DISPLAY_FONT}`
    const left = 'Pizza'
    const right = 'Pan'
    const wl = ctx.measureText(left).width
    const wr = ctx.measureText(right).width
    const start = 512 - (wl + wr) / 2
    ctx.textAlign = 'left'
    ctx.fillStyle = '#FFF4DE'
    ctx.fillText(left, start, 92)
    ctx.fillStyle = '#FF5A4A'
    ctx.fillText(right, start + wl, 92)
    ctx.shadowBlur = 8
    ctx.fillStyle = '#FCBF49'
    ctx.font = `700 30px ${SANS_FONT}`
    ctx.textAlign = 'center'
    ctx.fillText('B  A  K  E  R  Y   ·   W O O D - F I R E D', 512, 172)
    const t = toTexture(c)
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping
    return t
  }

  const windowDecal = (line1, line2) => {
    const [c, ctx] = canvas(1024, 256)
    ctx.textAlign = 'center'
    ctx.fillStyle = 'rgba(252,191,73,0.95)'
    ctx.font = `700 76px ${DISPLAY_FONT}`
    ctx.fillText(line1, 512, 110)
    ctx.font = `700 34px ${SANS_FONT}`
    ctx.fillStyle = 'rgba(255,244,222,0.9)'
    ctx.fillText(line2, 512, 180)
    const t = toTexture(c)
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping
    return t
  }

  const openSign = () => {
    const [c, ctx] = canvas(256, 128)
    ctx.fillStyle = '#D62828'
    ctx.beginPath()
    ctx.roundRect?.(4, 4, 248, 120, 22) ?? ctx.rect(4, 4, 248, 120)
    ctx.fill()
    ctx.strokeStyle = '#FFF4DE'
    ctx.lineWidth = 5
    ctx.stroke()
    ctx.fillStyle = '#FFF4DE'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `800 62px ${SANS_FONT}`
    ctx.fillText('OPEN', 128, 68)
    const t = toTexture(c)
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping
    return t
  }

  const chalk = (title, lines, w = 1024, h = 560) => {
    const [c, ctx] = canvas(w, h)
    ctx.fillStyle = '#23302a'
    ctx.fillRect(0, 0, w, h)
    noise(ctx, w, h, 9000, 0.06, 51, true)
    ctx.fillStyle = 'rgba(255,255,255,0.92)'
    ctx.textAlign = 'center'
    ctx.font = `700 ${Math.round(h * 0.12)}px ${DISPLAY_FONT}`
    ctx.fillText(title, w / 2, h * 0.16)
    ctx.strokeStyle = 'rgba(252,191,73,0.8)'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(w * 0.3, h * 0.21)
    ctx.lineTo(w * 0.7, h * 0.21)
    ctx.stroke()
    return [c, ctx]
  }

  const menuBoard = () => {
    const [c, ctx] = chalk('Today’s Menu', [])
    const items = PRODUCTS.filter((p) => p.type === 'pizza').slice(0, 10)
    const cols = 2
    const perCol = Math.ceil(items.length / cols)
    ctx.font = `600 30px ${SANS_FONT}`
    items.forEach((p, i) => {
      const col = Math.floor(i / perCol)
      const row = i % perCol
      const x0 = 70 + col * 480
      const y = 180 + row * 70
      ctx.textAlign = 'left'
      ctx.fillStyle = 'rgba(255,255,255,0.88)'
      ctx.fillText(p.name, x0, y, 315)
      ctx.textAlign = 'right'
      ctx.fillStyle = 'rgba(252,191,73,0.95)'
      ctx.fillText(formatLKR(p.price).replace('LKR ', ''), x0 + 420, y)
      ctx.fillStyle = 'rgba(255,255,255,0.18)'
      ctx.fillRect(x0, y + 14, 420, 2)
    })
    ctx.textAlign = 'center'
    ctx.font = `600 24px ${SANS_FONT}`
    ctx.fillStyle = 'rgba(247,127,0,0.95)'
    ctx.fillText('Prices in LKR · Regular size · Ask about Build Your Own!', 512, 530)
    const t = toTexture(c)
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping
    return t
  }

  const specialsBoard = (title, lines) => {
    const [c, ctx] = chalk(title, lines, 512, 640)
    ctx.textAlign = 'center'
    lines.forEach((l, i) => {
      ctx.font = i % 2 ? `700 40px ${DISPLAY_FONT}` : `600 30px ${SANS_FONT}`
      ctx.fillStyle = i % 2 ? 'rgba(252,191,73,0.95)' : 'rgba(255,255,255,0.9)'
      ctx.fillText(l, 256, 220 + i * 78)
    })
    const t = toTexture(c)
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping
    return t
  }

  const neon = (text) => {
    const [c, ctx] = canvas(1024, 160)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `700 78px ${DISPLAY_FONT}`
    ctx.shadowColor = '#FF8A3D'
    ctx.shadowBlur = 30
    ctx.fillStyle = '#FFD8A8'
    for (let i = 0; i < 3; i++) ctx.fillText(text, 512, 84)
    const t = toTexture(c)
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping
    return t
  }

  const pizzaTop = (variant = 0) => {
    const [c, ctx] = canvas(256, 256)
    const rand = mulberry32(100 + variant)
    ctx.fillStyle = '#C9823C'
    ctx.beginPath()
    ctx.arc(128, 128, 126, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#E9B46A'
    ctx.beginPath()
    ctx.arc(128, 128, 116, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = ['#B8312A', '#6E2B17', '#C0302A'][variant % 3]
    ctx.beginPath()
    ctx.arc(128, 128, 104, 0, Math.PI * 2)
    ctx.fill()
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(251,227,162,${0.7 + rand() * 0.3})`
      const a = rand() * Math.PI * 2
      const r = rand() * 92
      ctx.beginPath()
      ctx.ellipse(128 + Math.cos(a) * r, 128 + Math.sin(a) * r, 10 + rand() * 10, 7 + rand() * 6, rand() * 3, 0, Math.PI * 2)
      ctx.fill()
    }
    const topping = [
      ['#B5262A', 11],
      ['#2F8A3A', 6],
      ['#ECCB9B', 9],
    ][variant % 3]
    for (let i = 0; i < 12; i++) {
      const a = rand() * Math.PI * 2
      const r = 15 + rand() * 78
      ctx.fillStyle = topping[0]
      ctx.beginPath()
      ctx.arc(128 + Math.cos(a) * r, 128 + Math.sin(a) * r, topping[1], 0, Math.PI * 2)
      ctx.fill()
    }
    for (let i = 0; i < 10; i++) {
      ctx.fillStyle = '#2A2320'
      const a = rand() * Math.PI * 2
      const r = 15 + rand() * 80
      ctx.beginPath()
      ctx.arc(128 + Math.cos(a) * r, 128 + Math.sin(a) * r, 4, 0, Math.PI * 2)
      ctx.fill()
    }
    const t = toTexture(c)
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping
    return t
  }

  const fire = () => {
    const [c, ctx] = canvas(256, 256)
    const g = ctx.createRadialGradient(128, 200, 10, 128, 170, 170)
    g.addColorStop(0, '#FFF4C2')
    g.addColorStop(0.25, '#FFC24A')
    g.addColorStop(0.55, '#F77F00')
    g.addColorStop(0.85, '#8E1B12')
    g.addColorStop(1, '#2a0904')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 256, 256)
    const rand = mulberry32(77)
    for (let i = 0; i < 9; i++) {
      ctx.fillStyle = `rgba(255,${200 + rand() * 55 | 0},120,0.5)`
      ctx.beginPath()
      const x = 40 + rand() * 176
      ctx.moveTo(x - 18, 256)
      ctx.quadraticCurveTo(x - 10, 160, x, 90 + rand() * 50)
      ctx.quadraticCurveTo(x + 12, 170, x + 18, 256)
      ctx.fill()
    }
    const t = toTexture(c)
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping
    return t
  }

  const pizzaBox = () => {
    const [c, ctx] = canvas(256, 256)
    ctx.fillStyle = '#C99B64'
    ctx.fillRect(0, 0, 256, 256)
    noise(ctx, 256, 256, 3000, 0.12, 61)
    ctx.fillStyle = '#D62828'
    ctx.beginPath()
    ctx.arc(128, 128, 62, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#FFF4DE'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `700 34px ${DISPLAY_FONT}`
    ctx.fillText('PizzaPan', 128, 128)
    const t = toTexture(c)
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping
    return t
  }

  const sky = () => {
    const [c, ctx] = canvas(16, 512)
    const g = ctx.createLinearGradient(0, 0, 0, 512)
    g.addColorStop(0, '#0f1226')
    g.addColorStop(0.42, '#2a2440')
    g.addColorStop(0.5, '#6a3b4a')
    g.addColorStop(0.56, '#c7684a')
    g.addColorStop(0.62, '#2a1d1d')
    g.addColorStop(1, '#120d0c')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 16, 512)
    const t = toTexture(c)
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping
    return t
  }

  const dispose = () => made.forEach((t) => t.dispose())

  return {
    brick,
    wood,
    checker,
    plaster,
    concrete,
    awning,
    valance,
    sign,
    windowDecal,
    openSign,
    menuBoard,
    specialsBoard,
    neon,
    pizzaTop,
    fire,
    pizzaBox,
    sky,
    repeat,
    dispose,
  }
}
