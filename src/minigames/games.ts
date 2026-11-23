import type { Opts, Sim } from './core'
import { SortSim, type Box } from './sort'
import { LightSim } from './light'
import { WokSim } from './wok'

import { H, W } from './draw'
import { drawLight, drawPark, drawRide, drawRoute, drawServe, drawSort, drawWok } from './render'
import { ParkSim } from './park'
import { RideSim } from './ride'
import { RouteSim } from './route'
import { ServeSim } from './serve'
export { H, W }
export type GameId = 'gudang' | 'koran' | 'nasgor' | 'parkir' | 'pelayan' | 'kurir' | 'ojek'
export interface GameDef {
  id: GameId; title: string; icon: string; blurb: string
  howto: string[]; keys: string
  create: (o: Opts) => Sim
  draw: (g: CanvasRenderingContext2D, sim: never, t: number) => void
}

const BASE: Partial<Record<GameId, GameDef>> = {
  gudang: {
    id: 'gudang', title: 'Sortir Peti', icon: '📦', blurb: 'Kirim tiap peti ke palet warna yang benar sebelum lolos dari ban berjalan.',
    howto: ['Peti berwarna lewat di ban berjalan.', 'Tekan angka atau panah sesuai warnanya: 1/← merah, 2/↓ biru, 3/→ hijau.', 'Selalu peti terdepan (bergaris putih) yang terkirim.', 'Peti berat (level lanjut) perlu ditekan dua kali.'],
    keys: '1 2 3  atau  ← ↓ →',
    create: (o) => new SortSim(o), draw: drawSort as GameDef['draw'],
  },
  koran: {
    id: 'koran', title: 'Lampu Merah', icon: '📰', blurb: 'Jual koran ke pengendara yang berhenti selama lampu merah.',
    howto: ['Saat lampu merah, mobil berhenti di tiap lajur.', 'Geser kursor dengan ↑ ↓ ke lajur mobil yang jendelanya menyala kuning.', 'Tekan Spasi saat jendela terbuka untuk menjual. Jendela tertutup = sia-sia.', 'Lampu hijau: mobil jalan dan peluang hilang.'],
    keys: '↑ ↓  lalu  Spasi',
    create: (o) => new LightSim(o), draw: drawLight as GameDef['draw'],
  },
  nasgor: {
    id: 'nasgor', title: 'Wajan Panas', icon: '🍳', blurb: 'Masak nasi goreng sesuai pesanan: bahan, aduk, lalu balik wajan.',
    howto: ['Masukkan bahan sesuai urutan pesanan dengan tombol 1–5.', 'Aduk dengan menekan A dan D bergantian secepatnya.', 'Balik wajan dengan Spasi saat penanda berada di zona hijau.', 'Selesaikan 4 piring sebelum waktu habis.'],
    keys: '1–5 · A D · Spasi',
    create: (o) => new WokSim(o), draw: drawWok as GameDef['draw'],
  },
}
BASE.parkir = {
  id: 'parkir', title: 'Atur Parkir', icon: '🛵', blurb: 'Atur motor pelanggan ke slot kosong dan tagih uang parkir saat mereka mau pergi.',
  howto: ['Motor datang dan mengantre di bawah. Kesabaran mereka terus berkurang.', 'Pilih slot kosong dengan ← →, lalu Spasi untuk memarkirkan motor terdepan.', 'Saat motor menyala 💰 dan lingkarannya berjalan, tekan Spasi di slotnya untuk mengambil uang sebelum ia pergi.', 'Spasi di slot yang belum siap atau tanpa antrean dihitung salah.'],
  keys: '← →  lalu  Spasi',
  create: (o) => new ParkSim(o), draw: drawPark as GameDef['draw'],
}
BASE.pelayan = {
  id: 'pelayan', title: 'Antar Pesanan', icon: '🍽️', blurb: 'Antar lauk yang tepat ke meja pelanggan sebelum mereka kesal.',
  howto: ['Pelanggan memesan lewat gelembung di atas meja.', 'Tekan 1–3 untuk mengambil lauk: pecel, es teh, gorengan.', 'Pilih meja dengan ← →, lalu Spasi untuk mengantar.', 'Lauk yang salah dihitung kesalahan. Pelanggan yang menunggu terlalu lama pergi dengan marah.'],
  keys: '1 2 3  ·  ← →  ·  Spasi',
  create: (o) => new ServeSim(o), draw: drawServe as GameDef['draw'],
}
BASE.kurir = {
  id: 'kurir', title: 'Rute Kilat', icon: '📦', blurb: 'Susun rute antar tersingkat, lalu serahkan setiap paket tepat waktu.',
  howto: ['Peta menampilkan gudang 🏠 dan beberapa alamat bernomor.', 'Tekan nomor alamat sesuai urutan kunjungan. Rute yang lebih pendek berarti skor lebih tinggi.', 'Kurir berjalan menyusuri jalan. Saat tiba di alamat, tekan Spasi sebelum waktu habis untuk menyerahkan paket.', 'Ada 3 ronde. Spasi sebelum tiba dihitung salah.'],
  keys: '1–9  ·  Spasi  ·  Backspace',
  create: (o) => new RouteSim(o), draw: drawRoute as GameDef['draw'],
}
BASE.ojek = {
  id: 'ojek', title: 'Antar Penumpang', icon: '🏍️', blurb: 'Antar penumpang dengan nyaman: hindari lubang dan motor lain di jalan.',
  howto: ['Jalan raya tiga lajur bergulir ke arahmu.', 'Pindah lajur dengan ← → agar tidak menabrak lubang atau motor lain.', 'Setiap guncangan mengurangi kenyamanan penumpang, dan tip mengikuti kenyamanannya.', 'Makin lama jalan makin ramai dan cepat.'],
  keys: '← →',
  create: (o) => new RideSim(o), draw: drawRide as GameDef['draw'],
}
export const GAMES = BASE as Record<GameId, GameDef>
export const MINI_JOBS = new Set<string>(Object.keys(GAMES))
