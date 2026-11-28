import { create } from 'zustand'

export type Quality = 'low' | 'medium' | 'high'
export type Look = 'classic' | 'warm'
interface Persist { look: Look; quality: Quality; master: number; music: number; sfx: number; ambient: number; muted: boolean; showHelp: boolean }
interface SettingsState extends Persist {
  open: boolean; credits: boolean
  patch: (p: Partial<Persist>) => void
  setOpen: (o: boolean) => void
  setCredits: (o: boolean) => void
}

const KEY = 'lfz-settings'
const DEFAULTS: Persist = { look: 'warm', quality: 'medium', master: 0.8, music: 0.5, sfx: 0.8, ambient: 0.7, muted: false, showHelp: true }

function load(): Persist {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch { /* penyimpanan tidak tersedia: pakai default */ }
  return { ...DEFAULTS }
}

export const useSettings = create<SettingsState>((set, get) => ({
  ...load(),
  open: false,
  credits: false,
  patch: (p) => {
    set(p)
    const { look, quality, master, music, sfx, ambient, muted, showHelp } = get()
    try { localStorage.setItem(KEY, JSON.stringify({ look, quality, master, music, sfx, ambient, muted, showHelp })) } catch { /* abaikan */ }
  },
  setOpen: (open) => set({ open }),
  setCredits: (credits) => set({ credits }),
}))

/** Efek layar (bloom, gradasi warna, tilt-shift) per kualitas — hanya untuk gaya Hangat. */
export const FX = {
  low: { on: false, bloom: 0, tilt: false, msaa: 0 },
  medium: { on: true, bloom: 0.5, tilt: false, msaa: 0 },
  high: { on: true, bloom: 0.62, tilt: true, msaa: 4 },
}

/** Parameter kualitas grafis. */
export const QUALITY = {
  low: { shadows: false, shadowMap: 512, dpr: [1, 1] as [number, number], traffic: false, clouds: false, aa: false },
  medium: { shadows: true, shadowMap: 1024, dpr: [1, 1.5] as [number, number], traffic: true, clouds: true, aa: true },
  high: { shadows: true, shadowMap: 2048, dpr: [1, 2] as [number, number], traffic: true, clouds: true, aa: true },
}
