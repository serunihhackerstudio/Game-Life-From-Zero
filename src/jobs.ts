import type { SceneKind } from './store'

// Lima pekerjaan awal (GDD bagian 7.2). Upah dasar mengacu pada tabel di GDD bagian 22.
export type JobId = 'koran' | 'parkir' | 'pelayan' | 'kurir' | 'gudang'

export interface JobDef {
  id: JobId; name: string; icon: string; where: string; desc: string
  wage: number                 // upah dasar per shift (dikali level pengalaman)
  start: [number, number]      // shift boleh dimulai pada jam [dari, sampai)
  hours: number                // lama shift (jam game)
  energyPerHour: number        // beban energi per jam kerja
  req: number                  // total shift pengalaman yang dibutuhkan untuk melamar
  scene: SceneKind
  label: string                // teks adegan
  sceneMs: number
}

export const JOBS: Record<JobId, JobDef> = {
  koran: {
    id: 'koran', name: 'Penjual koran', icon: '📰', where: 'Pojok barat jalan', desc: 'Menjajakan koran pagi ke pengendara di pinggir jalan.',
    wage: 30000, start: [5, 9], hours: 4, energyPerHour: 4, req: 0, scene: 'koran', label: 'Menjual koran… (4 jam)', sceneMs: 7000,
  },
  parkir: {
    id: 'parkir', name: 'Tukang parkir', icon: '🛵', where: 'Depan warung', desc: 'Mengatur motor pelanggan warung dan toko, menerima uang parkir.',
    wage: 35000, start: [8, 14], hours: 5, energyPerHour: 3, req: 0, scene: 'parkir', label: 'Menjaga parkir… (5 jam)', sceneMs: 7000,
  },
  pelayan: {
    id: 'pelayan', name: 'Pelayan warung', icon: '🍽️', where: 'Warung Pecel Bu Sari', desc: 'Mengantar pesanan ke pelanggan saat jam makan.',
    wage: 50000, start: [9, 13], hours: 5, energyPerHour: 5, req: 2, scene: 'pelayan', label: 'Melayani pelanggan… (5 jam)', sceneMs: 7500,
  },
  kurir: {
    id: 'kurir', name: 'Kurir paket', icon: '📦', where: 'Kilat Ekspres (pojok barat)', desc: 'Mengambil paket, naik motor kantor, dan mengantarnya ke alamat.',
    wage: 55000, start: [8, 13], hours: 5, energyPerHour: 6, req: 4, scene: 'kurir', label: 'Mengantar paket… (5 jam)', sceneMs: 8500,
  },
  gudang: {
    id: 'gudang', name: 'Pekerja gudang', icon: '🏭', where: 'Gudang Logistik', desc: 'Mengangkut dan menata barang. Upah terbesar, tetapi melelahkan.',
    wage: 60000, start: [8, 12], hours: 6, energyPerHour: 6, req: 6, scene: 'work', label: 'Bekerja di gudang… (6 jam)', sceneMs: 8000,
  },
}
export const JOB_ORDER: JobId[] = ['koran', 'parkir', 'pelayan', 'kurir', 'gudang']
