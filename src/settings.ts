import { create } from 'zustand'

export type Quality = 'low' | 'medium' | 'high'
interface Persist { quality: Quality; master: number; music: number; sfx: number; ambient: number; muted: boolean; showHelp: boolean }
interface SettingsState extends Persist {
  open: boolean; credits: boolean
  patch: (p: Partial<Persist>) => void
  setOpen: (o: boolean) => void
  setCredits: (o: boolean) => void
}

const KEY = 'lfz-settings'
const DEFAULTS: Persist = { quality: 'medium', master: 0.8, music: 0.5, sfx: 0.8, ambient: 0.7, muted: false, showHelp: true }

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
    const { quality, master, music, sfx, ambient, muted, showHelp } = get()
    try { localStorage.setItem(KEY, JSON.stringify({ quality, master, music, sfx, ambient, muted, showHelp })) } catch { /* abaikan */ }
  },
  setOpen: (open) => set({ open }),
  setCredits: (credits) => set({ credits }),
}))

/** Parameter kualitas grafis. */
export const QUALITY = {
  low: { shadows: false, shadowMap: 512, dpr: [1, 1] as [number, number], traffic: false, clouds: false, aa: false },
  medium: { shadows: true, shadowMap: 1024, dpr: [1, 1.5] as [number, number], traffic: true, clouds: true, aa: true },
  high: { shadows: true, shadowMap: 2048, dpr: [1, 2] as [number, number], traffic: true, clouds: true, aa: true },
}
