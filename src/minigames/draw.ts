export const W = 640, H = 360
export type G = CanvasRenderingContext2D
export const rr = (g: G, x: number, y: number, w: number, h: number, r: number) => { g.beginPath(); g.roundRect(x, y, w, h, r) }
export const text = (g: G, s: string, x: number, y: number, size = 16, color = '#fff', align: CanvasTextAlign = 'left', weight = '600') => {
  g.font = `${weight} ${size}px system-ui, "Segoe UI", sans-serif`; g.fillStyle = color; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(s, x, y)
}
export function timeBar(g: G, left: number, total: number) {
  g.fillStyle = 'rgba(255,255,255,.15)'; rr(g, 16, 14, W - 32, 10, 5); g.fill()
  const f = Math.max(0, left / total)
  g.fillStyle = f > 0.25 ? '#4cd137' : '#e84118'; rr(g, 16, 14, (W - 32) * f, 10, 5); g.fill()
}
