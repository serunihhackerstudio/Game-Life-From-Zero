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

/** Petunjuk versi layar sentuh (menggantikan istilah keyboard). */
export const TOUCH_HOWTO: Record<GameId, { keys: string; howto: string[] }> = {
  gudang: { keys: 'Ketuk tombol 1 / 2 / 3', howto: ['Peti berwarna lewat di ban berjalan.', 'Ketuk tombol sewarna dengan peti terdepan (yang bergaris putih): merah 1, biru 2, hijau 3.', 'Peti berat (level lanjut) perlu diketuk dua kali.'] },
  koran: { keys: 'Ketuk ▲ ▼ lalu LEMPAR', howto: ['Saat lampu merah, mobil berhenti di tiap lajur.', 'Ketuk ▲ atau ▼ untuk pindah ke lajur mobil yang jendelanya menyala kuning.', 'Ketuk LEMPAR saat jendela terbuka. Jendela tertutup = sia-sia.', 'Lampu hijau: mobil jalan dan peluang hilang.'] },
  nasgor: { keys: 'Ketuk bahan · A D · BALIK', howto: ['Ketuk bahan sesuai urutan pesanan (yang menyala kuning).', 'Aduk dengan mengetuk A dan D bergantian secepatnya.', 'Ketuk BALIK saat penanda berada di zona hijau.', 'Selesaikan 4 piring sebelum waktu habis.'] },
  parkir: { keys: 'Ketuk ◀ ▶ lalu PARKIR', howto: ['Motor mengantre di bawah dan sabarnya terus berkurang.', 'Ketuk ◀ ▶ untuk memilih slot kosong, lalu ketuk PARKIR / AMBIL untuk memarkirkan motor terdepan.', 'Saat motor menyala 💰, ketuk PARKIR / AMBIL di slotnya sebelum ia pergi.'] },
  pelayan: { keys: 'Ketuk lauk · ◀ ▶ · ANTAR', howto: ['Pelanggan memesan lewat gelembung di atas meja.', 'Ketuk lauk yang dipesan, pilih meja dengan ◀ ▶, lalu ketuk ANTAR.', 'Lauk yang salah dihitung kesalahan. Pelanggan yang menunggu terlalu lama pergi dengan marah.'] },
  kurir: { keys: 'Ketuk nomor alamat · SERAHKAN', howto: ['Peta menampilkan gudang dan beberapa alamat bernomor.', 'Ketuk nomor alamat sesuai urutan kunjungan. Rute lebih pendek = skor lebih tinggi. ↶ untuk membatalkan.', 'Saat tiba di alamat, ketuk SERAHKAN sebelum waktu habis. Ada 3 ronde.'] },
  ojek: { keys: 'Ketuk ◀ ▶', howto: ['Jalan raya tiga lajur bergulir ke arahmu.', 'Ketuk ◀ atau ▶ untuk pindah lajur menghindari lubang, motor, dan mobil.', 'Setiap guncangan mengurangi kenyamanan penumpang, dan tip mengikuti kenyamanannya.'] },
}
