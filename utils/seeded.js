// Deterministic pseudo-random helpers so SVG art renders identically on server and client.

export function hashString(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Evenly spread points in a disc (sunflower pattern) with a little seeded jitter. */
export function scatter(count, radius, seedKey, jitter = 0.35) {
  const rand = mulberry32(hashString(seedKey))
  const offset = rand() * Math.PI * 2
  const pts = []
  for (let i = 0; i < count; i++) {
    const r = radius * Math.sqrt((i + 0.5) / count) * (1 - jitter * 0.25 + rand() * jitter * 0.25)
    const theta = i * 2.39996323 + offset + (rand() - 0.5) * jitter
    pts.push({
      x: +(r * Math.cos(theta)).toFixed(2),
      y: +(r * Math.sin(theta)).toFixed(2),
      rot: Math.round(rand() * 360),
      s: +(0.85 + rand() * 0.3).toFixed(2),
    })
  }
  return pts
}
