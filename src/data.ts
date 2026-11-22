// Data statis dunia "Kota Harapan": zona interaksi, collider, batas peta.
export type ZoneId = 'bed' | 'pakbudi' | 'warung' | 'gudang' | 'taman' | 'kelontong' | 'pasar' | 'masak' | 'jobcenter' | 'koran' | 'parkir' | 'pelayan' | 'kurir'

export interface Zone { id: ZoneId; x: number; z: number; r: number; label: string }
export interface Box { x: number; z: number; w: number; d: number } // pusat + ukuran

export const START = { x: -18, z: -13.5, rot: 0 }
export const BOUNDS = { minX: -38, maxX: 38, minZ: -20, maxZ: 24 }

export const ZONES: Zone[] = [
  { id: 'bed', x: -20.4, z: -14.6, r: 2.0, label: 'Tidur' },
  { id: 'pakbudi', x: -14, z: -8.5, r: 2.2, label: 'Bayar kos (Pak Budi)' },
  { id: 'warung', x: 0, z: -9, r: 2.2, label: 'Makan di Warung' },
  { id: 'gudang', x: 22, z: -8, r: 2.6, label: 'Kerja shift di Gudang Logistik' },
  { id: 'taman', x: 4, z: 12, r: 2.3, label: 'Istirahat di bangku taman' },
  { id: 'kelontong', x: 9.6, z: -8.9, r: 2.2, label: 'Belanja di Warung Kelontong' },
  { id: 'pasar', x: 22.5, z: 8.4, r: 2.4, label: 'Belanja di Pasar' },
  { id: 'masak', x: -16.25, z: -16.3, r: 1.6, label: 'Memasak (kompor)' },
  { id: 'jobcenter', x: -8.3, z: -9.0, r: 2.2, label: 'Job Center (lamar pekerjaan)' },
  { id: 'koran', x: -30.2, z: -6.9, r: 2.0, label: 'Jual koran' },
  { id: 'parkir', x: 3.0, z: -5.6, r: 2.0, label: 'Jadi tukang parkir' },
  { id: 'pelayan', x: 3.6, z: -8.7, r: 1.4, label: 'Kerja sebagai pelayan warung' },
  { id: 'kurir', x: -34.5, z: -7.0, r: 2.0, label: 'Antar paket (kurir)' },
]

export const TREES: [number, number][] = [
  [-10, 12.5], [-6, 16.5], [8, 16], [11, 12.5], [0, 18], [-13, 18],
  [-30, -12], [-30, 9], [33, 9], [-34, -4], [35, -6], [-26, 16], [28, 16],
]
export const LAMPS: [number, number][] = [-30, -15, 0, 15, 30].map((x) => [x, -4.6])

// Kos: pusat (-18,-14), 10 x 8, dinding tebal 0.4, pintu 2.4 di tengah sisi depan (z=-10)
export const KOS_WALL_H = 2.6
export const KOS_WALLS: Box[] = [
  { x: -18, z: -18, w: 10, d: 0.4 }, // belakang
  { x: -23, z: -14, w: 0.4, d: 8 }, // kiri
  { x: -13, z: -14, w: 0.4, d: 8 }, // kanan
  { x: -21.1, z: -10, w: 3.8, d: 0.4 }, // depan kiri
  { x: -14.9, z: -10, w: 3.8, d: 0.4 }, // depan kanan
]

export const COLLIDERS: Box[] = [
  ...KOS_WALLS,
  { x: -21.2, z: -16.6, w: 1.8, d: 2.2 }, // kasur
  { x: -14.5, z: -16.8, w: 1.6, d: 0.8 }, // meja
  { x: -18, z: -17.6, w: 1.6, d: 0.6 }, // lemari
  { x: -14, z: -8.5, w: 0.6, d: 0.6 }, // Pak Budi
  { x: 0, z: -13, w: 7, d: 5 }, // warung
  { x: 0, z: -10.2, w: 5, d: 0.8 }, // meja warung
  { x: 22, z: -14, w: 14, d: 9 }, // gudang
  { x: 28, z: -8.2, w: 1.2, d: 1.2 }, // peti
  { x: 29.3, z: -8.2, w: 1.2, d: 1.2 },
  { x: 4, z: 13.2, w: 2, d: 0.6 }, // bangku
  { x: -7.2, z: -7.4, w: 1.9, d: 1.1 }, // gerobak es teh
  { x: -10.5, z: -6.2, w: 1.8, d: 0.6 }, // motor parkir
  { x: 7.5, z: -6.3, w: 1.8, d: 0.6 },
  { x: -20.4, z: -9.3, w: 0.5, d: 0.5 }, // tanaman pot teras kos
  { x: -15.6, z: -9.3, w: 0.5, d: 0.5 },
  { x: -1.2, z: -9.25, w: 0.5, d: 0.5 }, // bangku bar warung
  { x: 1.2, z: -9.25, w: 0.5, d: 0.5 },
  { x: 5.4, z: -8.8, w: 0.5, d: 0.5 }, // tong sampah
  { x: -25, z: -8.8, w: 0.5, d: 0.5 },
  { x: -26, z: -4.9, w: 0.4, d: 0.4 }, // tiang listrik
  { x: 9, z: -4.9, w: 0.4, d: 0.4 },
  { x: 33, z: -4.9, w: 0.4, d: 0.4 },
  { x: 16.8, z: -8.2, w: 1.3, d: 1.3 }, // palet gudang
  { x: 26.4, z: -8.4, w: 0.6, d: 0.6 }, // drum
  { x: 33.5, z: -7.8, w: 5.2, d: 2.3 }, // truk
  { x: 9.6, z: -13, w: 6.8, d: 5 }, // kios kelontong
  { x: 9.6, z: -9.3, w: 4.6, d: 0.6 }, // meja kasir
  { x: 12.55, z: -10.05, w: 0.9, d: 0.8 }, // kulkas minuman
  { x: 14.0, z: -10.2, w: 0.9, d: 0.8 }, // ATM
  { x: -16.25, z: -17.75, w: 1.1, d: 0.5 }, // kompor kos
  { x: -8.3, z: -13, w: 6, d: 5 }, // Job Center
  { x: -30.2, z: -9.2, w: 2.4, d: 1.2 }, // lapak koran
  { x: -34.5, z: -9.9, w: 4, d: 2.2 }, // kios ekspedisi
  { x: 1.8, z: -5.6, w: 0.3, d: 0.3 }, // tiang rambu parkir
  { x: 18, z: 11.2, w: 3, d: 1.1 }, // lapak pasar
  { x: 22.5, z: 11.2, w: 3, d: 1.1 },
  { x: 27, z: 11.2, w: 3, d: 1.1 },
  { x: -5, z: 11, w: 0.4, d: 0.4 }, // lampu taman
  { x: 12, z: 11, w: 0.4, d: 0.4 },
  ...TREES.map(([x, z]) => ({ x, z, w: 0.8, d: 0.8 })),
  ...LAMPS.map(([x, z]) => ({ x, z, w: 0.4, d: 0.4 })),
]

const clampN = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

/** Dorong lingkaran (x,z,r) keluar dari semua collider kotak + batas peta. */
export function resolve(x: number, z: number, r: number): [number, number] {
  for (let it = 0; it < 3; it++) {
    for (const b of COLLIDERS) {
      const hx = b.w / 2, hz = b.d / 2
      const cx = clampN(x, b.x - hx, b.x + hx)
      const cz = clampN(z, b.z - hz, b.z + hz)
      const dx = x - cx, dz = z - cz
      const d2 = dx * dx + dz * dz
      if (d2 >= r * r) continue
      if (d2 > 1e-8) {
        const d = Math.sqrt(d2)
        x = cx + (dx / d) * r
        z = cz + (dz / d) * r
      } else {
        // pusat berada di dalam kotak: keluar lewat sumbu penetrasi terkecil
        const px = hx - Math.abs(x - b.x), pz = hz - Math.abs(z - b.z)
        if (px < pz) x = b.x + Math.sign(x - b.x || 1) * (hx + r)
        else z = b.z + Math.sign(z - b.z || 1) * (hz + r)
      }
    }
  }
  return [clampN(x, BOUNDS.minX, BOUNDS.maxX), clampN(z, BOUNDS.minZ, BOUNDS.maxZ)]
}
