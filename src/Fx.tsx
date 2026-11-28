import { BlendFunction, ToneMappingMode } from 'postprocessing'
import { Bloom, BrightnessContrast, EffectComposer, HueSaturation, TiltShift2, ToneMapping, Vignette } from '@react-three/postprocessing'
import { FX, useSettings } from './settings'

/** Gradasi warna sinematik untuk gaya "Hangat": bloom lembut, saturasi, kontras, vinyet, dan (kualitas Tinggi) tilt-shift. */
export function Grading() {
  const look = useSettings((s) => s.look)
  const quality = useSettings((s) => s.quality)
  const fx = FX[quality]
  if (look !== 'warm' || !fx.on) return null
  return (
    <EffectComposer multisampling={fx.msaa} enableNormalPass={false}>
      <Bloom intensity={fx.bloom} luminanceThreshold={0.78} luminanceSmoothing={0.25} mipmapBlur radius={0.7} />
      <HueSaturation saturation={0.2} hue={0} />
      <BrightnessContrast brightness={0.02} contrast={0.1} />
      {fx.tilt ? <TiltShift2 blur={0.2} /> : <></>}
      <Vignette offset={0.3} darkness={0.5} blendFunction={BlendFunction.NORMAL} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  )
}
