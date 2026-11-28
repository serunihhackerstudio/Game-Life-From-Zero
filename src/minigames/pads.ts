import type { GameId } from './games'

export interface PadBtn { label: string; code: string; sub?: string; color?: string; wide?: boolean }
export type Pad = { sig: string; rows: PadBtn[][] }
type S = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any

const num = (n: number) => `Digit${n}`
const SORT = ['#d64541', '#2f86c9', '#2fb36a']

/** Susunan tombol layar sentuh untuk tiap mini-game (kode yang sama dengan tombol keyboard). */
export function padFor(id: GameId, s: S): Pad {
  const mk = (rows: PadBtn[][], extra = ''): Pad => ({ sig: id + extra + rows.map((r) => r.map((b) => b.code + b.label).join(',')).join('|'), rows })
  switch (id) {
    case 'gudang':
      return mk([[{ label: '1', sub: '←', code: num(1), color: SORT[0] }, { label: '2', sub: '↓', code: num(2), color: SORT[1] }, { label: '3', sub: '→', code: num(3), color: SORT[2] }]])
    case 'koran':
      return mk([[{ label: '▲', code: 'ArrowUp' }, { label: 'LEMPAR', sub: 'koran', code: 'Space', wide: true, color: '#e8a21b' }, { label: '▼', code: 'ArrowDown' }]])
    case 'parkir':
      return mk([[{ label: '◀', code: 'ArrowLeft' }, { label: 'PARKIR / AMBIL', sub: 'uang', code: 'Space', wide: true, color: '#e8a21b' }, { label: '▶', code: 'ArrowRight' }]])
    case 'ojek':
      return mk([[{ label: '◀', code: 'ArrowLeft', wide: true }, { label: '▶', code: 'ArrowRight', wide: true }]])
    case 'pelayan':
      return mk([
        [{ label: 'Pecel', sub: '1', code: num(1) }, { label: 'Es teh', sub: '2', code: num(2) }, { label: 'Gorengan', sub: '3', code: num(3) }],
        [{ label: '◀', code: 'ArrowLeft' }, { label: 'ANTAR', code: 'Space', wide: true, color: '#e8a21b' }, { label: '▶', code: 'ArrowRight' }],
      ])
    case 'nasgor': {
      const ph = s.phase as string
      if (ph === 'add') return mk([[['Nasi', 'Telur', 'Bawang', 'Cabai', 'Kecap'].map((l, i) => ({ label: l, sub: String(i + 1), code: num(i + 1) }))][0]], 'add')
      if (ph === 'stir') return mk([[{ label: 'A', code: 'KeyA', wide: true }, { label: 'D', code: 'KeyD', wide: true }]], 'stir')
      if (ph === 'flip') return mk([[{ label: 'BALIK!', code: 'Space', wide: true, color: '#2ecc71' }]], 'flip')
      return mk([[{ label: '…', code: 'None', wide: true }]], 'serve')
    }
    case 'kurir': {
      if (s.phase === 'plan') {
        const n = (s.n as number) ?? 4, chosen = (s.chosen as number[]) ?? []
        return mk([[...Array.from({ length: n }, (_, i) => ({ label: String(i + 1), code: num(i + 1), color: chosen.includes(i) ? '#5d6670' : '#e8573d' })), { label: '↶', sub: 'batal', code: 'Backspace' }]], 'plan' + chosen.join(''))
      }
      return mk([[{ label: 'SERAHKAN', sub: 'paket', code: 'Space', wide: true, color: '#e8a21b' }]], 'drive')
    }
  }
}
