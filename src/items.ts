// Item, toko, dan resep. Angka = asumsi awal untuk balancing (lihat GDD bagian 22).
export type ItemId = 'mie' | 'telur' | 'beras' | 'sayur' | 'roti' | 'kecap' | 'keripik' | 'kopi' | 'teh' | 'air'
export type ShopId = 'kelontong' | 'pasar'

export interface ItemDef { name: string; icon: string; eat?: { hunger: number; mood: number; energy?: number; thirst?: number; verb?: string } }
export const ITEMS: Record<ItemId, ItemDef> = {
  mie: { name: 'Mie instan', icon: '🍜' },
  telur: { name: 'Telur', icon: '🥚' },
  beras: { name: 'Beras (porsi)', icon: '🍚' },
  sayur: { name: 'Sayuran', icon: '🥬' },
  roti: { name: 'Roti', icon: '🍞', eat: { hunger: 20, mood: 2 } },
  kecap: { name: 'Kecap manis (porsi)', icon: '🍶' },
  keripik: { name: 'Keripik', icon: '🍘', eat: { hunger: 12, mood: 5 } },
  kopi: { name: 'Kopi sachet', icon: '☕', eat: { hunger: 0, mood: 2, energy: 10, thirst: 8, verb: 'Minum' } },
  teh: { name: 'Teh botol', icon: '🥤', eat: { hunger: 4, mood: 3, energy: 6, thirst: 25, verb: 'Minum' } },
  air: { name: 'Air mineral', icon: '💧', eat: { hunger: 0, mood: 1, thirst: 40, verb: 'Minum' } },
}

export const INV_CAP = 20
export const invCount = (inv: Record<string, number>) => Object.values(inv).reduce((a, b) => a + b, 0)

export interface StockDef { id: ItemId; price: number; pack: number; note?: string }
export interface ShopDef { name: string; open: [number, number]; hours: string; stock: StockDef[] }
export const SHOPS: Record<ShopId, ShopDef> = {
  // Warung kelontong: buka lama, serba ada tetapi lebih mahal. Pasar: murah, tetapi hanya pagi-siang.
  kelontong: {
    name: 'Warung Kelontong Bu Rina', open: [6, 22], hours: '06.00–22.00',
    stock: [
      { id: 'mie', price: 3500, pack: 1 },
      { id: 'telur', price: 3000, pack: 1 },
      { id: 'beras', price: 16000, pack: 4, note: '1 kg = 4 porsi' },
      { id: 'kecap', price: 5000, pack: 4, note: '1 botol = 4 porsi' },
      { id: 'roti', price: 6000, pack: 1 },
      { id: 'keripik', price: 2500, pack: 1 },
      { id: 'air', price: 3000, pack: 1 },
      { id: 'kopi', price: 2000, pack: 1 },
      { id: 'teh', price: 4000, pack: 1 },
    ],
  },
  pasar: {
    name: 'Pasar Harapan', open: [5, 14], hours: '05.00–14.00',
    stock: [
      { id: 'telur', price: 2000, pack: 1 },
      { id: 'beras', price: 14000, pack: 4, note: '1 kg = 4 porsi' },
      { id: 'sayur', price: 4000, pack: 1 },
    ],
  },
}

export interface Recipe { id: string; name: string; needs: Partial<Record<ItemId, number>>; mins: number; hunger: number; mood: number; health?: number; thirst?: number }
export const RECIPES: Recipe[] = [
  { id: 'mie_telur', name: 'Mie instan telur', needs: { mie: 1, telur: 1 }, mins: 15, hunger: 45, mood: 4 },
  { id: 'nasi_dadar', name: 'Nasi telur dadar', needs: { beras: 1, telur: 2 }, mins: 25, hunger: 55, mood: 5 },
  { id: 'nasi_goreng', name: 'Nasi goreng kecap', needs: { beras: 1, telur: 1, kecap: 1 }, mins: 25, hunger: 60, mood: 6 },
  { id: 'nasi_sayur', name: 'Nasi sayur bening', needs: { beras: 1, sayur: 1 }, mins: 25, hunger: 45, mood: 3, health: 4, thirst: 12 },
]
