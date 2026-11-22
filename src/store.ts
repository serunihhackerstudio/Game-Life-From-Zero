import { create } from 'zustand'
import { START, type ZoneId } from './data'
import { clearSave, loadSave, writeSave } from './save'

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

/** Posisi pemain: dimutasi tiap frame, tidak masuk React state. */
export const playerPos = { x: START.x, z: START.z, rot: START.rot }

interface Goals { day: number; worked: boolean; ate: boolean; slept: boolean }
interface Toast { id: number; text: string; kind: 'info' | 'good' | 'bad' }
type Note = { text: string; kind: Toast['kind'] }

interface Data {
  name: string; gender: Gender
  money: number; health: number; energy: number; hunger: number; mood: number
  minute: number; rentDueDay: number; shifts: number; goals: Goals
  gameOver: string | null
}

interface GameState extends Data {
  screen: 'menu' | 'playing'
  paused: boolean
  busy: string | null
  nearby: ZoneId | null
  toasts: Toast[]
  hasSave: boolean
  newGame: (name: string, gender: Gender) => void
  continueGame: () => Promise<void>
  toMenu: () => void
  refreshSave: () => Promise<void>
  togglePause: () => void
  tick: (dt: number, running: boolean) => void
  interact: () => void
  saveNow: () => void
}

type Mode = 'awake' | 'sleep' | 'work'

function newDay(d: Data, day: number, notes: Note[]) {
  d.goals = { day, worked: false, ate: false, slept: false }
  const due = d.rentDueDay
  if (day > due + 2) d.gameOver = 'Kamu diusir dari kos karena menunggak terlalu lama.'
  else if (day > due) notes.push({ text: 'Tagihan kos menunggak! Denda berlaku, segera temui Pak Budi.', kind: 'bad' })
  else if (day === due) notes.push({ text: 'Hari ini jatuh tempo kos. Temui Pak Budi.', kind: 'bad' })
  else if (day === due - 1) notes.push({ text: 'Besok jatuh tempo kos (' + rupiah(RENT) + ').', kind: 'info' })
}

/** Simulasi kebutuhan karakter per potongan 10 menit game. */
function simulate(d0: Data, minutes: number, mode: Mode, notes: Note[]): Data {
  const d = { ...d0 }
  let left = minutes
  while (left > 0 && !d.gameOver) {
    const dt = Math.min(10, left)
    left -= dt
    const h = dt / 60
    const prevDay = dayOf(d.minute)
    d.minute += dt
    if (mode === 'sleep') { d.hunger -= 1.5 * h; d.energy += 9 * h }
    else { d.hunger -= 3 * h; d.energy -= (mode === 'work' ? 6 : 2) * h }
    d.hunger = clamp(d.hunger); d.energy = clamp(d.energy)
    if (d.hunger <= 0 || d.energy <= 0) d.health -= 6 * h
    else if (d.hunger > 40 && d.energy > 40) d.health += (mode === 'sleep' ? 3 : 1) * h
    d.health = clamp(d.health)
    const target = 20 + 0.4 * d.hunger + 0.4 * d.energy
    const diff = target - d.mood
    d.mood = clamp(d.mood + Math.sign(diff) * Math.min(Math.abs(diff), 1.5 * h))
    if (d.health <= 0) d.gameOver = 'Kamu jatuh sakit karena kelaparan dan kelelahan.'
    const day = dayOf(d.minute)
    if (day !== prevDay) newDay(d, day, notes)
  }
  return d
}

const DEFAULT: Data = {
  name: 'Andi', gender: 'male',
  money: 100000, health: 100, energy: 100, hunger: 100, mood: 75,
  minute: 7 * 60, rentDueDay: 8, shifts: 0,
  goals: { day: 1, worked: false, ate: false, slept: false },
  gameOver: null,
}

type Save = Data & { v: 1; px: number; pz: number; prot: number }

export const useGame = create<GameState>((set, get) => {
  let toastId = 0, acc = 0, runAcc = 0

  const toast = (text: string, kind: Toast['kind'] = 'info') => {
    const id = ++toastId
    set((s) => ({ toasts: [...s.toasts.slice(-3), { id, text, kind }] }))
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 4200)
  }
  const dataOf = (s: GameState): Data => ({
    name: s.name, gender: s.gender, money: s.money, health: s.health, energy: s.energy,
    hunger: s.hunger, mood: s.mood, minute: s.minute, rentDueDay: s.rentDueDay,
    shifts: s.shifts, goals: s.goals, gameOver: s.gameOver,
  })
  const commit = (d: Data, notes: Note[], busy?: string) => {
    set({ ...d, ...(busy ? { busy } : {}) })
    notes.forEach((n) => toast(n.text, n.kind))
    if (busy) setTimeout(() => set({ busy: null }), 1400)
    if (d.gameOver) void clearSave()
    else get().saveNow()
  }

  return {
    ...DEFAULT,
    screen: 'menu', paused: false, busy: null, nearby: null, toasts: [], hasSave: false,

    refreshSave: async () => set({ hasSave: !!(await loadSave()) }),

    newGame: (name, gender) => {
      Object.assign(playerPos, START)
      acc = 0; runAcc = 0
      set({ ...DEFAULT, name: name.trim().slice(0, 16) || 'Andi', gender, screen: 'playing', paused: false, busy: null, nearby: null, toasts: [] })
      toast('Selamat datang di Kota Harapan! Kamu punya Rp100.000. Cari kerja dan bayar kos tiap 7 hari.', 'info')
      get().saveNow()
    },

    continueGame: async () => {
      const sv = await loadSave<Save>()
      if (!sv) return
      playerPos.x = sv.px; playerPos.z = sv.pz; playerPos.rot = sv.prot
      acc = 0; runAcc = 0
      const { v: _v, px: _px, pz: _pz, prot: _prot, ...data } = sv
      set({ ...data, screen: 'playing', paused: false, busy: null, nearby: null, toasts: [] })
      toast('Permainan dilanjutkan.', 'info')
    },

    toMenu: () => {
      get().saveNow()
      set({ screen: 'menu', paused: false })
      void get().refreshSave()
    },

    togglePause: () => { if (get().screen === 'playing' && !get().gameOver) set((s) => ({ paused: !s.paused })) },

    saveNow: () => {
      const s = get()
      if (s.screen !== 'playing' || s.gameOver) return
      void writeSave({ ...dataOf(s), v: 1, px: playerPos.x, pz: playerPos.z, prot: playerPos.rot } satisfies Save)
    },

    tick: (dt, running) => {
      const s = get()
      if (s.screen !== 'playing' || s.paused || s.busy || s.gameOver) return
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
      if (s.screen !== 'playing' || s.paused || s.busy || s.gameOver || !s.nearby) return
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
          return commit(d, notes, 'Tidur… (8 jam)')
        }
        case 'warung': {
          if (hour < 6 || hour >= 21) return toast('Warung tutup (buka 06.00–21.00).', 'bad')
          if (s.hunger >= 95) return toast('Kamu masih kenyang.', 'info')
          if (s.money < MEAL_PRICE) return toast(`Uang tidak cukup (${rupiah(MEAL_PRICE)}).`, 'bad')
          const d = simulate(base, 20, 'awake', notes)
          d.money -= MEAL_PRICE; d.hunger = clamp(d.hunger + 40); d.mood = clamp(d.mood + 4)
          d.goals = { ...d.goals, ate: true }
          notes.push({ text: `Makan nasi pecel. -${rupiah(MEAL_PRICE)}`, kind: 'info' })
          return commit(d, notes, 'Makan…')
        }
        case 'gudang': {
          if (hour < 8 || hour >= 12) return toast('Shift gudang dimulai antara 08.00–12.00.', 'bad')
          if (s.energy < 25) return toast('Terlalu lelah untuk bekerja. Istirahat dulu.', 'bad')
          const lvl = jobLevel(s.shifts)
          const prod = (s.hunger < 25 ? 0.7 : 1) * (s.mood < 30 ? 0.9 : 1)
          const wage = Math.round((WAGE * lvl.mult * prod) / 1000) * 1000
          const d = simulate(base, 360, 'work', notes)
          d.money += wage; d.shifts += 1; d.mood = clamp(d.mood + 2)
          d.goals = { ...d.goals, worked: true }
          notes.push({ text: `Shift selesai. Upah ${rupiah(wage)}${prod < 1 ? ' (produktivitas turun)' : ''}.`, kind: 'good' })
          const nl = jobLevel(d.shifts)
          if (nl.name !== lvl.name) notes.push({ text: `Naik level pekerjaan: ${nl.name}!`, kind: 'good' })
          return commit(d, notes, 'Bekerja di gudang… (6 jam)')
        }
        case 'taman': {
          const d = simulate(base, 60, 'awake', notes)
          d.energy = clamp(d.energy + 10); d.mood = clamp(d.mood + 8)
          notes.push({ text: 'Duduk santai di taman. Mood naik.', kind: 'good' })
          return commit(d, notes, 'Istirahat…')
        }
        case 'pakbudi': {
          const due = s.rentDueDay
          if (due - day > 3) return toast(`Pak Budi: "Belum waktunya, Nak. Jatuh tempo hari ke-${due}."`, 'info')
          const amount = RENT + (day > due ? LATE_FEE : 0)
          if (s.money < amount) return toast(`Pak Budi: "Uangnya kurang, Nak." Butuh ${rupiah(amount)}.`, 'bad')
          const d = { ...base, money: base.money - amount, rentDueDay: due + 7 }
          notes.push({ text: `Kos & listrik dibayar ${rupiah(amount)}. Jatuh tempo berikutnya hari ke-${due + 7}.`, kind: 'good' })
          return commit(d, notes)
        }
      }
    },
  }
})
