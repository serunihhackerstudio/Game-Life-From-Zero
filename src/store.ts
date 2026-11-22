import { create } from 'zustand'
import { START, type ZoneId } from './data'
import { clearSave, loadSave, writeSave } from './save'
import { audio } from './audio'
import { JOBS, type JobDef, type JobId } from './jobs'
import { AFF_MAX, lateFeeWaived, mealDiscount, NPCS, rentDiscount, shopDiscount, type Ctx, type NpcId } from './npcs'
import { INV_CAP, invCount, ITEMS, RECIPES, SHOPS, type ItemId, type ShopId } from './items'

export type Gender = 'male' | 'female'
export const TIME_SCALE = 2 // 1 detik nyata = 2 menit game
export const MEAL_PRICE = 12000
export const WAGE = 60000
export const RENT = 140000
export const LATE_FEE = 14000

export const clamp = (v: number, a = 0, b = 100) => Math.min(b, Math.max(a, v))
export const dayOf = (m: number) => Math.floor(m / 1440) + 1
export const hourOf = (m: number) => (m % 1440) / 60
export const rupiah = (n: number) => 'Rp' + Math.round(n).toLocaleString('id-ID')
export const clock = (m: number) => {
  const t = Math.floor(m % 1440)
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
}
export const periodOf = (h: number) => (h >= 5 && h < 11 ? 'Pagi' : h >= 11 && h < 15 ? 'Siang' : h >= 15 && h < 18 ? 'Sore' : 'Malam')
export const jobLevel = (shifts: number) =>
  shifts < 5 ? { name: 'Beginner', mult: 1, next: 5 }
  : shifts < 15 ? { name: 'Intermediate', mult: 1.15, next: 15 }
  : shifts < 30 ? { name: 'Advanced', mult: 1.3, next: 30 }
  : { name: 'Expert', mult: 1.5, next: null as number | null }

export const shopPrice = (aff: number, price: number) => Math.round((price * (1 - shopDiscount(aff))) / 100) * 100
export const mealPrice = (aff: number) => MEAL_PRICE - mealDiscount(aff)
export const rentAmount = (aff: number, late: boolean) => Math.round((RENT * (1 - rentDiscount(aff))) / 1000) * 1000 + (late && !lateFeeWaived(aff) ? LATE_FEE : 0)

/** Menit game yang ditampilkan: selama adegan, jam berjalan cepat dari awal ke akhir. */
export function visMinute(): number {
  const { scene: sc, minute } = useGame.getState()
  if (!sc || !isFinite(sc.dur)) return minute
  const f = Math.min(1, (performance.now() - sc.t0) / sc.dur)
  return sc.fromMin + (sc.toMin - sc.fromMin) * f
}

/** Posisi pemain: dimutasi tiap frame, tidak masuk React state. */
export const playerPos = { x: START.x, z: START.z, rot: START.rot }

export type SceneKind = 'talk' | 'work' | 'koran' | 'parkir' | 'pelayan' | 'kurir' | 'nasgor' | 'ojek' | 'drink' | 'mandi' | 'eat' | 'shop' | 'cook' | 'sleep' | 'rest'
export interface SceneInfo { kind: SceneKind; label: string; t0: number; dur: number; fromMin: number; toMin: number; shop?: ShopId; npc?: NpcId; pulseAt: number }
export type Ui = null | { kind: 'shop'; shop: ShopId } | { kind: 'cook' } | { kind: 'inv' } | { kind: 'jobs' } | { kind: 'talk'; npc: NpcId; node: string }
interface Goals { day: number; worked: boolean; ate: boolean; slept: boolean; bathed?: boolean }
interface Toast { id: number; text: string; kind: 'info' | 'good' | 'bad' }
type Note = { text: string; kind: Toast['kind'] }

interface Data {
  name: string; gender: Gender
  money: number; health: number; energy: number; hunger: number; mood: number; thirst: number; hygiene: number
  minute: number; rentDueDay: number; shifts: number; goals: Goals; inv: Record<string, number>
  hired: string[]; jobShifts: Record<string, number>; jobDay: Record<string, number>
  affinity: Record<string, number>; talkDay: Record<string, number>
  gameOver: string | null
}

interface GameState extends Data {
  screen: 'menu' | 'playing'
  paused: boolean
  ui: Ui
  scene: SceneInfo | null
  cutKey: number
  busy: string | null
  nearby: ZoneId | null
  toasts: Toast[]
  hasSave: boolean
  newGame: (name: string, gender: Gender) => void
  continueGame: () => Promise<void>
  toMenu: () => void
  refreshSave: () => Promise<void>
  togglePause: () => void
  openUi: (u: Ui) => void
  closeUi: () => void
  buy: (shop: ShopId, item: ItemId) => void
  cook: (recipeId: string) => void
  eat: (item: ItemId) => void
  applyJob: (id: JobId) => void
  openTalk: (npc: NpcId) => void
  pick: (i: number) => void
  tick: (dt: number, running: boolean) => void
  interact: () => void
  saveNow: () => void
}

type Mode = 'awake' | 'sleep' | 'work'

function newDay(d: Data, day: number, notes: Note[]) {
  d.goals = { day, worked: false, ate: false, slept: false, bathed: false }
  const due = d.rentDueDay
  if (day > due + 2) d.gameOver = 'Kamu diusir dari kos karena menunggak terlalu lama.'
  else if (day > due) notes.push({ text: 'Tagihan kos menunggak! Denda berlaku, segera temui Pak Budi.', kind: 'bad' })
  else if (day === due) notes.push({ text: 'Hari ini jatuh tempo kos. Temui Pak Budi.', kind: 'bad' })
  else if (day === due - 1) notes.push({ text: 'Besok jatuh tempo kos (' + rupiah(RENT) + ').', kind: 'info' })
}

/** Simulasi kebutuhan karakter per potongan 10 menit game. */
function simulate(d0: Data, minutes: number, mode: Mode, notes: Note[], drain = 6): Data {
  const d = { ...d0 }
  let left = minutes
  while (left > 0 && !d.gameOver) {
    const dt = Math.min(10, left)
    left -= dt
    const h = dt / 60
    const prevDay = dayOf(d.minute)
    d.minute += dt
    if (mode === 'sleep') { d.hunger -= 1.5 * h; d.energy += 9 * h; d.thirst -= 1.8 * h; d.hygiene -= 0.5 * h }
    else { d.hunger -= 3 * h; d.energy -= (mode === 'work' ? drain : 2) * h; d.thirst -= (mode === 'work' ? 5 : 3.5) * h; d.hygiene -= (mode === 'work' ? 3 : 1.6) * h }
    d.hunger = clamp(d.hunger); d.energy = clamp(d.energy); d.thirst = clamp(d.thirst); d.hygiene = clamp(d.hygiene)
    if (d.hunger <= 0 || d.energy <= 0 || d.thirst <= 0) d.health -= 6 * h
    else if (d.hunger > 40 && d.energy > 40 && d.thirst > 30) d.health += (mode === 'sleep' ? 3 : 1) * h
    if (d.hygiene < 10) d.health -= 1 * h // tubuh kotor: rentan sakit
    d.health = clamp(d.health)
    const target = 15 + 0.3 * d.hunger + 0.3 * d.energy + 0.1 * d.thirst + 0.15 * d.hygiene
    const diff = target - d.mood
    d.mood = clamp(d.mood + Math.sign(diff) * Math.min(Math.abs(diff), 1.5 * h))
    if (d.health <= 0) d.gameOver = 'Kamu jatuh sakit karena kelaparan, kehausan, atau kelelahan.'
    const day = dayOf(d.minute)
    if (day !== prevDay) newDay(d, day, notes)
  }
  return d
}

const DEFAULT: Data = {
  name: 'Andi', gender: 'male',
  money: 100000, health: 100, energy: 100, hunger: 100, mood: 75, thirst: 100, hygiene: 100,
  minute: 7 * 60, rentDueDay: 8, shifts: 0,
  goals: { day: 1, worked: false, ate: false, slept: false, bathed: false },
  inv: {},
  hired: [],
  jobShifts: {},
  jobDay: {},
  affinity: {},
  talkDay: {},
  gameOver: null,
}

type Save = Data & { v: 1; px: number; pz: number; prot: number }

export const useGame = create<GameState>((set, get) => {
  let toastId = 0, acc = 0, runAcc = 0

  const toast = (text: string, kind: Toast['kind'] = 'info') => {
    const id = ++toastId
    audio.sfx(kind === 'good' ? 'good' : kind === 'bad' ? 'bad' : 'info')
    set((s) => ({ toasts: [...s.toasts.slice(-3), { id, text, kind }] }))
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 4200)
  }
  const dataOf = (s: GameState): Data => ({
    name: s.name, gender: s.gender, money: s.money, health: s.health, energy: s.energy,
    hunger: s.hunger, mood: s.mood, thirst: s.thirst, hygiene: s.hygiene, minute: s.minute, rentDueDay: s.rentDueDay,
    shifts: s.shifts, goals: s.goals, inv: s.inv, hired: s.hired, jobShifts: s.jobShifts, jobDay: s.jobDay, affinity: s.affinity, talkDay: s.talkDay, gameOver: s.gameOver,
  })
  const commit = (d: Data, notes: Note[]) => {
    set({ ...d })
    notes.forEach((n) => toast(n.text, n.kind))
    if (d.gameOver) void clearSave()
    else get().saveNow()
  }
  /** Putar adegan sinematik sepanjang dur ms; hasil aksi (d) baru diterapkan di akhir adegan. */
  const playScene = (kind: SceneKind, label: string, dur: number, from: number, d: Data, notes: Note[]) => {
    set((s) => ({ scene: { kind, label, t0: performance.now(), dur, fromMin: from, toMin: d.minute, pulseAt: 0 }, busy: label, cutKey: s.cutKey + 1 }))
    setTimeout(() => {
      commit(d, notes)
      set((s) => ({ scene: null, busy: null, cutKey: s.cutKey + 1 }))
    }, dur)
  }

  const ctxOf = (s: GameState, id: NpcId): Ctx => ({
    name: s.name, day: dayOf(s.minute), hour: hourOf(s.minute), money: s.money,
    hunger: s.hunger, energy: s.energy, health: s.health, mood: s.mood, thirst: s.thirst, hygiene: s.hygiene,
    aff: s.affinity[id] ?? 0, rentDue: s.rentDueDay, shifts: s.shifts, hired: s.hired.length,
    talked: s.talkDay[id] === dayOf(s.minute),
  })
  const openShop = (shopId: ShopId) => {
    const s = get(), shop = SHOPS[shopId], hour = hourOf(s.minute)
    if (hour < shop.open[0] || hour >= shop.open[1]) { toast(`${shop.name} tutup (buka ${shop.hours}).`, 'bad'); return false }
    set((st) => ({ ui: { kind: 'shop', shop: shopId }, scene: { kind: 'shop', label: shop.name, t0: performance.now(), dur: Infinity, fromMin: s.minute, toMin: s.minute, shop: shopId, pulseAt: 0 }, cutKey: st.cutKey + 1 }))
    return true
  }
  const eatAtWarung = () => {
    const s = get(), hour = hourOf(s.minute), price = mealPrice(s.affinity.sari ?? 0)
    if (hour < 6 || hour >= 21) return toast('Warung tutup (buka 06.00–21.00).', 'bad')
    if (s.hunger >= 95) return toast('Kamu masih kenyang.', 'info')
    if (s.money < price) return toast(`Uang tidak cukup (${rupiah(price)}).`, 'bad')
    const notes: Note[] = []
    const d = simulate(dataOf(s), 20, 'awake', notes)
    d.money -= price; d.hunger = clamp(d.hunger + 40); d.thirst = clamp(d.thirst + 18); d.mood = clamp(d.mood + 4)
    d.goals = { ...d.goals, ate: true }
    notes.push({ text: `Makan nasi pecel + es teh. -${rupiah(price)}`, kind: 'info' })
    playScene('eat', 'Makan di warung…', 5500, s.minute, d, notes)
  }

  /** Mulai shift kerja: syarat dicek, hasil diterapkan di akhir adegan. */
  const workJob = (job: JobDef) => {
    const s = get()
    const hour = hourOf(s.minute), day = dayOf(s.minute)
    if (!s.hired.includes(job.id)) return toast(`Kamu belum diterima sebagai ${job.name.toLowerCase()}. Lamar dulu di Job Center.`, 'bad')
    if (s.jobDay[job.id] === day) return toast(`Kamu sudah bekerja sebagai ${job.name.toLowerCase()} hari ini.`, 'info')
    if (hour < job.start[0] || hour >= job.start[1]) return toast(`Shift ${job.name.toLowerCase()} dimulai antara ${String(job.start[0]).padStart(2, '0')}.00–${String(job.start[1]).padStart(2, '0')}.00.`, 'bad')
    if (s.energy < 25) return toast('Terlalu lelah untuk bekerja. Istirahat dulu.', 'bad')
    const before = s.jobShifts[job.id] ?? 0
    const lvl = jobLevel(before)
    const prod = (s.hunger < 25 ? 0.7 : 1) * (s.mood < 30 ? 0.9 : 1) * (s.thirst < 25 ? 0.85 : 1) * (s.hygiene < 25 ? 0.9 : 1)
    const wage = Math.round((job.wage * lvl.mult * prod) / 500) * 500
    const notes: Note[] = []
    const d = simulate(dataOf(s), job.hours * 60, 'work', notes, job.energyPerHour)
    d.money += wage; d.shifts += 1; d.mood = clamp(d.mood + 2)
    d.jobShifts = { ...d.jobShifts, [job.id]: before + 1 }
    d.jobDay = { ...d.jobDay, [job.id]: day }
    d.goals = { ...d.goals, worked: true }
    notes.push({ text: `Shift ${job.name.toLowerCase()} selesai. Upah ${rupiah(wage)}${prod < 1 ? ' (produktivitas turun)' : ''}.`, kind: 'good' })
    const nl = jobLevel(before + 1)
    if (nl.name !== lvl.name) notes.push({ text: `Naik level ${job.name.toLowerCase()}: ${nl.name}!`, kind: 'good' })
    playScene(job.scene, job.label, job.sceneMs, s.minute, d, notes)
  }

  return {
    ...DEFAULT,
    screen: 'menu', paused: false, ui: null, scene: null, cutKey: 0, busy: null, nearby: null, toasts: [], hasSave: false,

    refreshSave: async () => set({ hasSave: !!(await loadSave()) }),

    newGame: (name, gender) => {
      Object.assign(playerPos, START)
      acc = 0; runAcc = 0
      set({ ...DEFAULT, name: name.trim().slice(0, 16) || 'Andi', gender, screen: 'playing', paused: false, ui: null, scene: null, busy: null, nearby: null, toasts: [] })
      toast('Selamat datang di Kota Harapan! Kamu punya Rp100.000. Cari kerja dan bayar kos tiap 7 hari.', 'info')
      get().saveNow()
    },

    continueGame: async () => {
      const sv = await loadSave<Save>()
      if (!sv) return
      playerPos.x = sv.px; playerPos.z = sv.pz; playerPos.rot = sv.prot
      acc = 0; runAcc = 0
      const { v: _v, px: _px, pz: _pz, prot: _prot, ...data } = sv
      set({ ...data, thirst: data.thirst ?? 100, hygiene: data.hygiene ?? 100, inv: data.inv ?? {}, hired: (data.hired ?? ['gudang']).filter((h: string) => h !== 'satpam'), jobShifts: data.jobShifts ?? { gudang: data.shifts ?? 0 }, jobDay: data.jobDay ?? {}, affinity: data.affinity ?? {}, talkDay: data.talkDay ?? {}, screen: 'playing', paused: false, ui: null, scene: null, busy: null, nearby: null, toasts: [] })
      toast('Permainan dilanjutkan.', 'info')
    },

    toMenu: () => {
      get().saveNow()
      set({ screen: 'menu', paused: false, ui: null, scene: null, busy: null })
      void get().refreshSave()
    },

    togglePause: () => { if (get().screen === 'playing' && !get().gameOver && !get().ui && !get().busy) set((s) => ({ paused: !s.paused })) },

    openUi: (u) => { const s = get(); if (s.screen === 'playing' && !s.paused && !s.busy && !s.gameOver) set({ ui: u }) },
    closeUi: () => {
      const sc = get().scene
      set((s) => ({ ui: null, ...(sc && !isFinite(sc.dur) ? { scene: null, cutKey: s.cutKey + 1 } : {}) }))
    },

    buy: (shopId, itemId) => {
      const s = get(), shop = SHOPS[shopId], stock = shop.stock.find((x) => x.id === itemId)
      if (!stock || s.gameOver) return
      const h = hourOf(s.minute)
      if (h < shop.open[0] || h >= shop.open[1]) return toast(`${shop.name} sudah tutup (buka ${shop.hours}).`, 'bad')
      const price = shopId === 'kelontong' ? shopPrice(s.affinity.rina ?? 0, stock.price) : stock.price
      if (s.money < price) return toast(`Uang tidak cukup (${rupiah(price)}).`, 'bad')
      if (invCount(s.inv) + stock.pack > INV_CAP) return toast(`Tas penuh (maks ${INV_CAP} barang).`, 'bad')
      set({ money: s.money - price, inv: { ...s.inv, [itemId]: (s.inv[itemId] ?? 0) + stock.pack }, scene: s.scene ? { ...s.scene, pulseAt: performance.now() } : s.scene })
      audio.sfx('coin')
      toast(`Beli ${ITEMS[itemId].name}${stock.pack > 1 ? ' ×' + stock.pack : ''} · -${rupiah(price)}`, 'info')
      get().saveNow()
    },

    cook: (recipeId) => {
      const s = get(), r = RECIPES.find((x) => x.id === recipeId)
      if (!r || s.busy || s.gameOver) return
      for (const [id, n] of Object.entries(r.needs)) if ((s.inv[id] ?? 0) < (n ?? 0)) return toast('Bahan belum lengkap.', 'bad')
      if (s.hunger >= 95) return toast('Kamu masih kenyang.', 'info')
      const notes: Note[] = []
      const d = simulate(dataOf(s), r.mins, 'awake', notes)
      const inv = { ...d.inv }
      for (const [id, n] of Object.entries(r.needs)) { inv[id] = (inv[id] ?? 0) - (n ?? 0); if (inv[id] <= 0) delete inv[id] }
      d.inv = inv
      d.hunger = clamp(d.hunger + r.hunger); d.mood = clamp(d.mood + r.mood); d.health = clamp(d.health + (r.health ?? 0)); d.thirst = clamp(d.thirst + (r.thirst ?? 0))
      d.goals = { ...d.goals, ate: true }
      notes.push({ text: `Kamu memasak ${r.name}. Lapar +${r.hunger}.`, kind: 'good' })
      set({ ui: null })
      playScene('cook', 'Memasak ' + r.name + '…', 5500, s.minute, d, notes)
    },

    eat: (itemId) => {
      const s = get(), def = ITEMS[itemId]
      if (!def.eat || (s.inv[itemId] ?? 0) < 1 || s.busy || s.gameOver) return
      const e = def.eat, verb = e.verb ?? 'Makan'
      if (e.hunger > 0 && s.hunger >= 95 && !e.energy && !e.thirst) return toast('Kamu masih kenyang.', 'info')
      if (!e.hunger && !e.energy && e.thirst && s.thirst >= 95) return toast('Kamu tidak haus.', 'info')
      const notes: Note[] = []
      const d = simulate(dataOf(s), 5, 'awake', notes)
      const inv = { ...d.inv }; inv[itemId] -= 1; if (inv[itemId] <= 0) delete inv[itemId]
      d.inv = inv
      d.hunger = clamp(d.hunger + e.hunger); d.energy = clamp(d.energy + (e.energy ?? 0)); d.thirst = clamp(d.thirst + (e.thirst ?? 0)); d.mood = clamp(d.mood + e.mood)
      if (e.hunger >= 10) d.goals = { ...d.goals, ate: true }
      const gains = [e.hunger ? `Lapar +${e.hunger}` : '', e.thirst ? `Haus -${e.thirst}` : '', e.energy ? `Energi +${e.energy}` : '', `Mood +${e.mood}`].filter(Boolean).join(', ')
      notes.push({ text: `${verb} ${def.name}. ${gains}.`, kind: 'info' })
      commit(d, notes)
    },

    openTalk: (npc) => {
      const s = get()
      if (s.screen !== 'playing' || s.paused || s.ui || s.busy || s.scene || s.gameOver) return
      set((st) => ({ ui: { kind: 'talk', npc, node: 'root' }, scene: { kind: 'talk', label: '', t0: performance.now(), dur: Infinity, fromMin: s.minute, toMin: s.minute, npc, pulseAt: 0 }, cutKey: st.cutKey + 1 }))
    },

    pick: (i) => {
      const s = get(), ui = s.ui
      if (!ui || ui.kind !== 'talk') return
      const ctx = ctxOf(s, ui.npc), node = NPCS[ui.npc].nodes[ui.node]
      const ch = node.choices.filter((c) => !c.show || c.show(ctx))[i]
      if (!ch) return
      if (ch.to) return set({ ui: { ...ui, node: ch.to } })
      const day = dayOf(s.minute), id = ui.npc
      switch (ch.act) {
        case 'chat': {
          if (s.hygiene < 25 && s.talkDay[id] !== day) toast('Kamu bau. Orang-orang menjauh, hubungan tidak bertambah. Mandi dulu!', 'bad')
          else if (s.talkDay[id] !== day) {
            const a = Math.min(AFF_MAX, (s.affinity[id] ?? 0) + 1)
            set({ affinity: { ...s.affinity, [id]: a }, talkDay: { ...s.talkDay, [id]: day }, mood: clamp(s.mood + 3) })
            toast(`Hubungan dengan ${NPCS[id].name} membaik. Mood +3.`, 'good')
            if (a === 3) toast(id === 'budi' ? 'Pak Budi kini memaafkan denda telat bayar kos.' : id === 'rina' ? 'Bu Rina memberi diskon langganan 10%.' : id === 'sari' ? 'Bu Sari memberi harga langganan Rp10.000.' : 'Pak Dimas senang membantumu.', 'good')
            if (a === 6 && id === 'budi') toast('Pak Budi memberi potongan sewa kos 10%.', 'good')
            get().saveNow()
          }
          return set({ ui: { ...ui, node: 'chat' } })
        }
        case 'rent': {
          const due = s.rentDueDay
          if (due - day > 3) return set({ ui: { ...ui, node: 'rent_early' } })
          const amount = rentAmount(s.affinity.budi ?? 0, day > due)
          if (s.money < amount) return set({ ui: { ...ui, node: 'rent_poor' } })
          set({ money: s.money - amount, rentDueDay: due + 7, ui: { ...ui, node: 'rent_ok' } })
          toast(`Kos & listrik dibayar ${rupiah(amount)}.`, 'good')
          return get().saveNow()
        }
        case 'shop':
          return void openShop('kelontong')
        case 'jobs':
          return set((st) => ({ ui: { kind: 'jobs' }, scene: null, cutKey: st.cutKey + 1 }))
        case 'eat':
          set({ ui: null, scene: null })
          return eatAtWarung()
        default:
          return get().closeUi()
      }
    },

    applyJob: (id) => {
      const s = get(), job = JOBS[id]
      if (s.hired.includes(id)) return
      if (s.shifts < job.req) return toast(`Butuh pengalaman ${job.req} shift (kamu ${s.shifts}).`, 'bad')
      set({ hired: [...s.hired, id] })
      toast(`Diterima sebagai ${job.name.toLowerCase()}! Datang ke ${job.where}.`, 'good')
      get().saveNow()
    },

    saveNow: () => {
      const s = get()
      if (s.screen !== 'playing' || s.gameOver) return
      void writeSave({ ...dataOf(s), v: 1, px: playerPos.x, pz: playerPos.z, prot: playerPos.rot } satisfies Save)
    },

    tick: (dt, running) => {
      const s = get()
      if (s.screen !== 'playing' || s.paused || s.ui || s.busy || s.scene || s.gameOver) return
      acc += dt
      if (running) runAcc += dt
      if (acc < 0.25) return
      const notes: Note[] = []
      const d = simulate(dataOf(s), acc * TIME_SCALE, 'awake', notes)
      d.energy = clamp(d.energy - 0.08 * runAcc)
      acc = 0; runAcc = 0
      commit(d, notes)
    },

    interact: () => {
      const s = get()
      if (s.screen !== 'playing' || s.paused || s.ui || s.busy || s.scene || s.gameOver || !s.nearby) return
      const base = dataOf(s)
      const hour = hourOf(s.minute)
      const day = dayOf(s.minute)
      const notes: Note[] = []

      switch (s.nearby) {
        case 'bed': {
          if (s.energy >= 75 && hour >= 5 && hour < 20) return toast('Belum mengantuk. Tidur saat energi < 75 atau malam hari.', 'info')
          const d = simulate(base, 480, 'sleep', notes)
          d.mood = clamp(d.mood + 3); d.goals = { ...d.goals, slept: true }
          notes.push({ text: `Kamu bangun pukul ${clock(d.minute)}. Energi pulih.`, kind: 'good' })
          return playScene('sleep', 'Tidur… (8 jam)', 6500, s.minute, d, notes)
        }
        case 'warung':
          return eatAtWarung()
        case 'gudang':
        case 'koran':
        case 'parkir':
        case 'pelayan':
        case 'kurir':
        case 'nasgor':
        case 'ojek':
          return workJob(JOBS[s.nearby as JobId])
        case 'jobcenter':
          return get().openTalk('dimas')
        case 'taman': {
          const d = simulate(base, 60, 'awake', notes)
          d.energy = clamp(d.energy + 10); d.mood = clamp(d.mood + 8)
          notes.push({ text: 'Duduk santai di taman. Mood naik.', kind: 'good' })
          return playScene('rest', 'Istirahat di taman…', 4500, s.minute, d, notes)
        }
        case 'kelontong':
          return get().openTalk('rina')
        case 'pasar':
          return void openShop('pasar')
        case 'sari':
          return get().openTalk('sari')
        case 'masak':
          return set({ ui: { kind: 'cook' } })
        case 'minum': {
          if (s.thirst >= 95) return toast('Kamu tidak haus.', 'info')
          const d = simulate(base, 3, 'awake', notes)
          d.thirst = clamp(d.thirst + 45); d.mood = clamp(d.mood + 1)
          notes.push({ text: 'Minum air galon. Haus -45.', kind: 'info' })
          return playScene('drink', 'Minum air…', 3800, s.minute, d, notes)
        }
        case 'mandi': {
          if (s.hygiene >= 90) return toast('Badanmu masih bersih.', 'info')
          const d = simulate(base, 20, 'awake', notes)
          d.hygiene = 100; d.mood = clamp(d.mood + 6)
          d.goals = { ...d.goals, bathed: true }
          notes.push({ text: 'Segar setelah mandi! Kebersihan penuh, Mood +6.', kind: 'good' })
          return playScene('mandi', 'Mandi di kamar mandi bersama…', 7000, s.minute, d, notes)
        }
        case 'pakbudi':
          return get().openTalk('budi')
      }
    },
  }
})
