// Item, toko, dan resep. Angka = asumsi awal untuk balancing (lihat GDD bagian 22).
export type ItemId = 'mie' | 'telur' | 'beras' | 'sayur' | 'roti'
export type ShopId = 'minimarket' | 'pasar'

export interface ItemDef { name: string; icon: string; eat?: { hunger: number; mood: number } }
export const ITEMS: Record<ItemId, ItemDef> = {
  mie: { name: 'Mie instan', icon: '🍜' },
  telur: { name: 'Telur', icon: '🥚' },
  beras: { name: 'Beras (porsi)', icon: '🍚' },
  sayur: { name: 'Sayuran', icon: '🥬' },
  roti: { name: 'Roti', icon: '🍞', eat: { hunger: 20, mood: 2 } },
}

export const INV_CAP = 20
export const invCount = (inv: Record<string, number>) => Object.values(inv).reduce((a, b) => a + b, 0)

export interface StockDef { id: ItemId; price: number; pack: number; note?: string }
export interface ShopDef { name: string; open: [number, number]; hours: string; stock: StockDef[] }
export const SHOPS: Record<ShopId, ShopDef> = {
  // Minimarket: buka lama tapi lebih mahal. Pasar: murah tapi hanya pagi-siang.
  minimarket: {
    name: 'Mini Mart Harapan', open: [6, 22], hours: '06.00–22.00',
    stock: [
      { id: 'mie', price: 3500, pack: 1 },
      { id: 'telur', price: 3000, pack: 1 },
      { id: 'roti', price: 6000, pack: 1 },
      { id: 'beras', price: 16000, pack: 4, note: '1 kg = 4 porsi' },
      { id: 'sayur', price: 6000, pack: 1 },
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

export interface Recipe { id: string; name: string; needs: Partial<Record<ItemId, number>>; mins: number; hunger: number; mood: number; health?: number }
export const RECIPES: Recipe[] = [
  { id: 'mie_telur', name: 'Mie instan telur', needs: { mie: 1, telur: 1 }, mins: 15, hunger: 45, mood: 4 },
  { id: 'nasi_dadar', name: 'Nasi telur dadar', needs: { beras: 1, telur: 2 }, mins: 25, hunger: 55, mood: 5 },
  { id: 'nasi_sayur', name: 'Nasi sayur bening', needs: { beras: 1, sayur: 1 }, mins: 25, hunger: 45, mood: 3, health: 4 },
]
