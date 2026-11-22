import { useEffect, useState } from 'react'
import { useGame, type Gender } from './store'

export function Menu() {
  const { newGame, continueGame, hasSave, refreshSave } = useGame()
  const [name, setName] = useState('Andi')
  const [gender, setGender] = useState<Gender>('male')
  useEffect(() => { void refreshSave() }, [refreshSave])

  return (
    <div className="menu">
      <div className="card">
        <h1>LIFE FROM ZERO</h1>
        <p className="tag">Start with Nothing. Build Everything.</p>
        <label>Nama karakter
          <input value={name} maxLength={16} onChange={(e) => setName(e.target.value)} />
        </label>
        <div className="genders">
          <button className={gender === 'male' ? 'sel' : ''} onClick={() => setGender('male')}>
            <i style={{ background: '#3a6ea5' }} /> Laki-laki
          </button>
          <button className={gender === 'female' ? 'sel' : ''} onClick={() => setGender('female')}>
            <i style={{ background: '#b5496b' }} /> Perempuan
          </button>
        </div>
        <button className="primary" onClick={() => newGame(name, gender)}>Game Baru</button>
        <button disabled={!hasSave} onClick={() => void continueGame()}>Lanjutkan</button>
        <p className="small">Kamu remaja sebatang kara di Kota Harapan dengan Rp100.000. Bekerja, makan, tidur, dan bayar kos tepat waktu.</p>
      </div>
    </div>
  )
}
