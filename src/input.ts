import { useEffect } from 'react'
import { create } from 'zustand'
import { useSettings } from './settings'

/** Masukan sentuh yang dibaca Player tiap frame (dimutasi langsung, bukan state React). x: kanan +, y: maju +. */
export const touchIn = { x: 0, y: 0, run: false }

interface TouchState { detected: boolean; info: boolean; setInfo: (v: boolean) => void; toggleRun: () => void; runLock: boolean }
export const useTouchState = create<TouchState>((set, get) => ({
  detected: (() => { try { return matchMedia('(hover: none) and (pointer: coarse)').matches || new URLSearchParams(location.search).has('touch') } catch { return false } })(),
  info: false,
  runLock: false,
  setInfo: (info) => set({ info }),
  toggleRun: () => { const v = !get().runLock; touchIn.run = v; set({ runLock: v }) },
}))

/** True bila kontrol sentuh harus tampil: pengaturan "Selalu" atau (Otomatis dan perangkat sentuh terdeteksi). */
export function useIsTouch(): boolean {
  const mode = useSettings((s) => s.touch)
  const det = useTouchState((s) => s.detected)
  return mode === 'on' || (mode === 'auto' && det)
}

/** Deteksi sentuhan pertama (laptop layar sentuh), cegah zoom-cubit halaman, dan tandai <html data-touch>. */
export function useTouchSetup() {
  const touch = useIsTouch()
  useEffect(() => {
    const first = (e: PointerEvent) => { if (e.pointerType === 'touch' && !useTouchState.getState().detected) useTouchState.setState({ detected: true }) }
    const block = (e: Event) => e.preventDefault()
    window.addEventListener('pointerdown', first, { passive: true })
    document.addEventListener('gesturestart', block)   // Safari iOS: cubit halaman
    document.addEventListener('contextmenu', (e) => { if ((e as PointerEvent).pointerType === 'touch') e.preventDefault() })
    return () => { window.removeEventListener('pointerdown', first); document.removeEventListener('gesturestart', block) }
  }, [])
  useEffect(() => { document.documentElement.dataset.touch = touch ? '1' : '0' }, [touch])
}
