import type { Look } from './Humanoid'

export type NpcId = 'budi' | 'rina' | 'sari' | 'dimas'
export type DialogAct = 'end' | 'rent' | 'shop' | 'jobs' | 'eat' | 'chat'

/** Konteks yang dibaca teks dialog (murni data, tanpa efek samping). */
export interface Ctx {
  name: string; day: number; hour: number; money: number
  hunger: number; energy: number; health: number; mood: number; thirst: number; hygiene: number
  aff: number; rentDue: number; shifts: number; hired: number
  talked: boolean // sudah mengobrol hari ini
}
export interface Choice { label: string | ((c: Ctx) => string); to?: string; act?: DialogAct; show?: (c: Ctx) => boolean }
export interface Node { say: string | ((c: Ctx) => string); choices: Choice[] }
export interface NpcDef {
  id: NpcId; name: string; role: string; pos: [number, number]; rot: number
  look: Look; npcOpts?: { female?: boolean }
  nodes: Record<string, Node>
}

export const AFF_MAX = 10
export const affLabel = (a: number) => (a >= 6 ? 'Sahabat' : a >= 3 ? 'Akrab' : a >= 1 ? 'Kenal' : 'Baru kenal')
/** Keuntungan hubungan baik. */
export const rentDiscount = (aff: number) => (aff >= 6 ? 0.1 : 0)
export const lateFeeWaived = (aff: number) => aff >= 3
export const shopDiscount = (aff: number) => (aff >= 3 ? 0.1 : 0)
export const mealDiscount = (aff: number) => (aff >= 3 ? 2000 : 0)

const pick = <T,>(a: T[], c: Ctx) => a[(c.day * 3 + c.aff) % a.length]
const care = (c: Ctx, who: string) =>
  c.hygiene < 25 ? `${who}: "Maaf ya, ${c.name}, tapi kamu bau sekali. Mandi dulu sana, baru ngobrol lagi."`
  : c.thirst < 20 ? `${who}: "Bibirmu kering begitu. Kamu haus, kan? Minum dulu, jangan ditahan."`
  : c.hunger < 25 ? `${who}: "Muka kamu pucat sekali, ${c.name}. Itu perutnya sampai bunyi. Makan dulu sana."`
  : c.energy < 25 ? `${who}: "Matamu merah begitu. Jangan dipaksa kerja terus, ${c.name}. Tidur dulu."`
  : c.health < 50 ? `${who}: "Kamu kelihatan kurang sehat. Jaga badan ya, nanti malah tidak bisa kerja."`
  : ''

const greetTime = (h: number) => (h < 11 ? 'Selamat pagi' : h < 15 ? 'Selamat siang' : h < 18 ? 'Selamat sore' : 'Selamat malam')

export const NPCS: Record<NpcId, NpcDef> = {
  budi: {
    id: 'budi', name: 'Pak Budi', role: 'Pemilik Kos', pos: [-14, -8.5], rot: -Math.PI / 2,
    look: { shirt: '#cdbf9a', pants: '#2d2d2d', skin: '#b98660', hair: '#c9c9c9', elder: true, sandals: true },
    nodes: {
      root: {
        say: (c) => care(c, 'Pak Budi') || (c.aff === 0
          ? `"${greetTime(c.hour)}, Nak. Kamu yang baru di kamar nomor satu itu, ya? Bapak Budi, yang punya kos ini."`
          : c.day >= c.rentDue - 1 ? `"Eh, ${c.name}. Ingat ya, jatuh tempo kos hari ke-${c.rentDue}."` : `"${greetTime(c.hour)}, ${c.name}. Ada yang bisa Bapak bantu?"`),
        choices: [
          { label: 'Bayar kos & listrik', act: 'rent' },
          { label: 'Ngobrol santai', act: 'chat' },
          { label: 'Pak, ada kerjaan?', to: 'job' },
          { label: 'Tentang aturan kos', to: 'rules' },
          { label: 'Sudah dulu, Pak.', act: 'end' },
        ],
      },
      job: {
        say: (c) => c.hired === 0
          ? '"Kalau mau cari uang, ke Job Center di sebelah warung. Pak Dimas yang jaga. Mulai dari jual koran pagi-pagi, tidak perlu pengalaman. Lumayan buat bayar kos."'
          : `"Bagus, kamu sudah punya ${c.hired} pekerjaan. Rajin-rajinlah, ${c.name}. Uang kos itu tidak menunggu."`,
        choices: [{ label: 'Terima kasih, Pak.', to: 'root' }],
      },
      rules: {
        say: '"Kos dan listrik Rp140.000 tiap tujuh hari. Telat, kena denda Rp14.000. Telat tiga hari, ya Bapak terpaksa minta kamar dikosongkan. Bapak tidak tega, tapi aturan tetap aturan."',
        choices: [{ label: 'Saya mengerti, Pak.', to: 'root' }],
      },
      chat: {
        say: (c) => pick([
          '"Dulu kamar ini Bapak sewakan ke mahasiswa. Sekarang banyak pekerja. Kota ini memang cepat berubah."',
          '"Bapak ini pensiunan guru. Makanya cerewet soal disiplin. Maaf ya kalau Bapak bawel."',
          '"Kalau pagi, jangan lupa sarapan. Orang tua ini dulu sering pingsan karena telat makan."',
          '"Istri Bapak dulu yang masak buat anak kos. Sekarang tinggal Bapak sendiri. Sepi juga."',
          '"Tetangga kita Bu Rina itu baik. Kalau mau belanja murah, ke pasar pagi-pagi."',
        ], c),
        choices: [{ label: 'Lanjut ngobrol', act: 'chat', show: () => false }, { label: 'Baik, Pak.', to: 'root' }],
      },
      rent_ok: { say: (c) => `"Terima kasih, ${c.name}. Uang kos sudah Bapak terima. Jatuh tempo berikutnya hari ke-${c.rentDue}."${c.aff >= 6 ? ' (Potongan 10% karena kamu sudah seperti keluarga.)' : ''}`, choices: [{ label: 'Sama-sama, Pak.', to: 'root' }] },
      rent_early: { say: (c) => `"Belum waktunya, Nak. Kamu boleh bayar mulai tiga hari sebelum jatuh tempo, yaitu hari ke-${c.rentDue}."`, choices: [{ label: 'Oh, baik, Pak.', to: 'root' }] },
      rent_poor: { say: '"Uangnya masih kurang, Nak. Jangan dipaksa. Cari uang dulu, tapi jangan lewat batas ya."', choices: [{ label: 'Saya usahakan, Pak.', to: 'root' }] },
    },
  },

  rina: {
    id: 'rina', name: 'Bu Rina', role: 'Warung Kelontong', pos: [9.6, -9.9], rot: 0,
    look: { shirt: '#e07a9a', pants: '#5b4a8a', skin: '#d4a07a', hair: '#241510', female: true },
    nodes: {
      root: {
        say: (c) => care(c, 'Bu Rina') || (c.aff === 0
          ? `"${greetTime(c.hour)}! Warung kelontong Bu Rina, serba ada. Cari apa, Dik?"`
          : c.aff >= 3 ? `"Ah, ${c.name}! Langganan Ibu yang paling rajin. Mau belanja apa hari ini?"` : `"${greetTime(c.hour)}, ${c.name}. Mau belanja apa?"`),
        choices: [
          { label: 'Mau belanja', act: 'shop' },
          { label: 'Ngobrol dulu, Bu', act: 'chat' },
          { label: 'Ada yang murah, Bu?', to: 'tips' },
          { label: 'Cuma lewat, Bu.', act: 'end' },
        ],
      },
      tips: {
        say: (c) => c.aff >= 3
          ? '"Buat langganan, Ibu kasih potongan 10% semua barang. Tapi kalau mau yang paling murah, telur dan sayur beli di pasar pagi-pagi, buka sampai jam dua siang."'
          : '"Telur dan sayur lebih murah di pasar, tapi pasar tutup jam dua siang. Kalau sering belanja di sini, nanti Ibu kasih harga langganan."',
        choices: [{ label: 'Wah, makasih, Bu.', to: 'root' }],
      },
      chat: {
        say: (c) => pick([
          '"Mie instan paling laku di sini. Anak kos semua beli itu. Tapi jangan tiap hari, nanti sakit perut."',
          '"Dulu Ibu jualan keliling pakai sepeda. Sekarang alhamdulillah sudah punya kios."',
          '"Hati-hati kalau jalan malam, ya. Lampu jalan di ujung sana kadang mati."',
          '"Kopi sachet itu bisa bikin melek kalau lagi lembur. Tapi lambungnya jangan dilupakan."',
          '"Tukang parkir di depan itu masih muda, rajin. Kamu juga kerja apa sekarang?"',
        ], c),
        choices: [{ label: 'Baik, Bu.', to: 'root' }],
      },
    },
  },

  sari: {
    id: 'sari', name: 'Bu Sari', role: 'Warung Pecel', pos: [-4.5, -9.5], rot: Math.PI / 2,
    look: { shirt: '#3a8f6b', pants: '#6a4a3a', skin: '#c68e64', hair: '#1c1410', female: true },
    nodes: {
      root: {
        say: (c) => care(c, 'Bu Sari') || (c.aff === 0
          ? `"${greetTime(c.hour)}, Nak! Pecel Bu Sari paling enak se-Kota Harapan. Mau pesan?"`
          : c.aff >= 3 ? `"Langganan datang! Harga spesial buat kamu, ${c.name}, Rp10.000 saja."` : `"${greetTime(c.hour)}, ${c.name}. Pecelnya masih hangat."`),
        choices: [
          { label: 'Pesan nasi pecel', act: 'eat' },
          { label: 'Ngobrol dulu, Bu', act: 'chat' },
          { label: 'Ada lowongan, Bu?', to: 'work' },
          { label: 'Nanti saja, Bu.', act: 'end' },
        ],
      },
      work: {
        say: (c) => c.shifts >= 2
          ? '"Kebetulan Ibu butuh pelayan jam makan siang. Kamu sudah cukup pengalaman. Lamar ke Pak Dimas di Job Center, bilang dari Bu Sari."'
          : '"Ibu cari pelayan yang sudah pernah kerja minimal dua shift. Coba dulu jual koran atau jaga parkir, nanti balik lagi ya."',
        choices: [{ label: 'Siap, Bu.', to: 'root' }],
      },
      chat: {
        say: (c) => pick([
          '"Resep pecel ini warisan ibu Ibu. Bumbu kacangnya diulek sendiri, tidak pakai blender."',
          '"Jam sebelas sampai satu siang itu warung paling ramai. Kalau mau makan tenang, datang agak pagi."',
          '"Es teh manis di gerobak depan itu punya Mas Tono. Enak, tapi punya Ibu lebih enak, ya!"',
          '"Anak muda sekarang suka lupa makan. Nanti sakit. Ibu juga dulu begitu waktu muda."',
          '"Kalau kamu kerja gudang, ambil shift pagi saja. Siang terlalu panas."',
        ], c),
        choices: [{ label: 'Baik, Bu.', to: 'root' }],
      },
    },
  },

  dimas: {
    id: 'dimas', name: 'Pak Dimas', role: 'Petugas Job Center', pos: [-9.7, -9.4], rot: Math.PI / 2 + 0.3,
    look: { shirt: '#f2f2f2', pants: '#1f3a5f', skin: '#c7956c', hair: '#15110e', hoodie: false },
    nodes: {
      root: {
        say: (c) => c.hired === 0
          ? `"${greetTime(c.hour)}, selamat datang di Job Center. Belum ada pekerjaan, ya? Tenang, banyak lowongan yang tidak butuh pengalaman."`
          : `"${greetTime(c.hour)}, ${c.name}. Pengalamanmu sekarang ${c.shifts} shift. Mau lihat lowongan?"`,
        choices: [
          { label: 'Lihat lowongan', act: 'jobs' },
          { label: 'Bagaimana cara naik gaji?', to: 'levels' },
          { label: 'Tips kerja', to: 'tips' },
          { label: 'Ngobrol', act: 'chat' },
          { label: 'Terima kasih, Pak.', act: 'end' },
        ],
      },
      levels: {
        say: '"Tiap pekerjaan punya level: Beginner, Intermediate di 5 shift, Advanced di 15, Expert di 30. Setiap level gajinya naik 15 sampai 50 persen. Kerja yang sama berulang-ulang itu justru cepat naik."',
        choices: [{ label: 'Oh begitu.', to: 'root' }],
      },
      tips: {
        say: '"Jangan kerja saat lapar atau lelah. Produktivitas turun dan upahmu dipotong. Tiap pekerjaan cuma bisa diambil sekali sehari, jadi gabungkan: pagi jual koran, siang jadi pelayan. Kalau mau kerja malam, ada nasi goreng, ojek, dan satpam. Upahnya besar, tapi jangan lupa tidur."',
        choices: [{ label: 'Terima kasih, Pak.', to: 'root' }],
      },
      chat: {
        say: (c) => pick([
          '"Banyak yang datang ke sini cuma lihat-lihat. Yang rajin pasti dapat tempat. Kamu kelihatan rajin."',
          '"Gudang Logistik bayarnya paling besar, tapi fisiknya berat. Kurir juga lumayan kalau kamu sudah punya pengalaman."',
          '"Dulu Bapak kerja di pabrik. Sekarang bantu orang cari kerja. Rasanya lebih puas."',
          '"Kalau lowongannya belum bisa kamu ambil, kumpulkan dulu pengalaman. Tidak ada yang instan."',
        ], c),
        choices: [{ label: 'Baik, Pak.', to: 'root' }],
      },
    },
  },
}
