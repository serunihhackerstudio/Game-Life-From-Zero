import { hourOf, jobLevel, rupiah, useGame } from './store'
import { JOB_ORDER, JOBS } from './jobs'
import { INV_CAP, invCount, ITEMS, RECIPES, SHOPS, type ItemId } from './items'

function Shell({ title, sub, children, side }: { title: string; sub?: string; children: React.ReactNode; side?: boolean }) {
  const close = useGame((s) => s.closeUi)
  return (
    <div className={"overlay light" + (side ? " side" : "")} onMouseDown={(e) => { if (e.target === e.currentTarget) close() }}>
      <div className="sheet">
        <div className="sheet-h">
          <div><h2>{title}</h2>{sub && <small>{sub}</small>}</div>
          <button className="x" onClick={close} aria-label="Tutup">✕</button>
        </div>
        {children}
        <div className="sheet-f">Esc: tutup</div>
      </div>
    </div>
  )
}

function Bag() {
  const inv = useGame((s) => s.inv)
  const n = invCount(inv)
  return <div className="bag">🎒 Tas {n}/{INV_CAP}</div>
}

function Shop({ id }: { id: 'kelontong' | 'pasar' }) {
  const shop = SHOPS[id]
  const money = useGame((s) => s.money)
  const inv = useGame((s) => s.inv)
  const minute = useGame((s) => s.minute)
  const buy = useGame((s) => s.buy)
  const h = hourOf(minute)
  const open = h >= shop.open[0] && h < shop.open[1]
  const full = (pack: number) => invCount(inv) + pack > INV_CAP
  return (
    <Shell side title={shop.name} sub={`Buka ${shop.hours} · ${open ? 'BUKA' : 'TUTUP'}`}>
      <div className="row between"><span className="money-s">{rupiah(money)}</span><Bag /></div>
      <ul className="list">
        {shop.stock.map((st) => {
          const def = ITEMS[st.id]
          const cant = !open || money < st.price || full(st.pack)
          return (
            <li key={st.id}>
              <span className="ic">{def.icon}</span>
              <span className="nm">{def.name}{st.note && <small> · {st.note}</small>}<em>Punya: {inv[st.id] ?? 0}</em></span>
              <span className="pr">{rupiah(st.price)}</span>
              <button disabled={cant} onClick={() => buy(id, st.id)}>Beli</button>
            </li>
          )
        })}
      </ul>
      {id === 'pasar' && <p className="hint">Harga pasar lebih murah, tetapi hanya buka pagi sampai siang.</p>}
    </Shell>
  )
}

function Cook() {
  const inv = useGame((s) => s.inv)
  const hunger = useGame((s) => s.hunger)
  const cook = useGame((s) => s.cook)
  return (
    <Shell title="Memasak" sub="Kompor di kamar kos">
      <div className="row between"><span>Lapar: {Math.round(hunger)}/100</span><Bag /></div>
      <ul className="list">
        {RECIPES.map((r) => {
          const ok = Object.entries(r.needs).every(([id, n]) => (inv[id] ?? 0) >= (n ?? 0))
          return (
            <li key={r.id}>
              <span className="nm">{r.name}
                <em>{Object.entries(r.needs).map(([id, n]) => `${ITEMS[id as ItemId].icon}×${n} (punya ${inv[id] ?? 0})`).join('  ')}</em>
                <em>{r.mins} menit · Lapar +{r.hunger} · Mood +{r.mood}{r.health ? ` · Sehat +${r.health}` : ''}</em>
              </span>
              <button disabled={!ok || hunger >= 95} onClick={() => cook(r.id)}>Masak</button>
            </li>
          )
        })}
      </ul>
      <p className="hint">Masak sendiri lebih murah daripada makan di warung, tetapi butuh bahan dan waktu.</p>
    </Shell>
  )
}

function Inventory() {
  const inv = useGame((s) => s.inv)
  const eat = useGame((s) => s.eat)
  const entries = Object.entries(inv) as [ItemId, number][]
  return (
    <Shell title="Tas" sub="Barang yang kamu bawa">
      <div className="row between"><span /> <Bag /></div>
      {entries.length === 0 ? <p className="hint">Tas kosong. Belanja di warung kelontong atau pasar.</p> : (
        <ul className="list">
          {entries.map(([id, n]) => (
            <li key={id}>
              <span className="ic">{ITEMS[id].icon}</span>
              <span className="nm">{ITEMS[id].name}<em>{ITEMS[id].eat ? 'Bisa langsung dikonsumsi' : 'Bahan masak (pakai di kompor kos)'}</em></span>
              <span className="pr">×{n}</span>
              {ITEMS[id].eat ? <button onClick={() => eat(id)}>{ITEMS[id].eat?.verb ?? 'Makan'}</button> : <span style={{ width: 64 }} />}
            </li>
          ))}
        </ul>
      )}
    </Shell>
  )
}

function Jobs() {
  const hired = useGame((s) => s.hired)
  const shifts = useGame((s) => s.shifts)
  const js = useGame((s) => s.jobShifts)
  const apply = useGame((s) => s.applyJob)
  const hh = (n: number) => String(n).padStart(2, '0') + '.00'
  return (
    <Shell title="Job Center" sub={`Pengalaman kerja: ${shifts} shift`}>
      <ul className="list">
        {JOB_ORDER.map((id) => {
          const j = JOBS[id], ok = hired.includes(id), can = shifts >= j.req
          const lv = jobLevel(js[id] ?? 0)
          return (
            <li key={id}>
              <span className="ic">{j.icon}</span>
              <span className="nm">{j.name}
                <em>{j.desc}</em>
                <em>{rupiah(j.wage)}/shift · mulai {hh(j.start[0])}–{hh(j.start[1])} · {j.hours} jam · {j.where}</em>
                {ok && <em>Level: {lv.name} ({js[id] ?? 0} shift)</em>}
              </span>
              {ok ? <span className="pr">✓ Diterima</span>
                : <button disabled={!can} onClick={() => apply(id)}>{can ? 'Lamar' : `Butuh ${j.req}`}</button>}
            </li>
          )
        })}
      </ul>
      <p className="hint">Setelah diterima, datang ke tempat kerjanya. Tiap pekerjaan bisa diambil sekali sehari. Pengalaman menaikkan upah dan membuka pekerjaan lain.</p>
    </Shell>
  )
}

export function Panels() {
  const ui = useGame((s) => s.ui)
  if (!ui) return null
  if (ui.kind === 'shop') return <Shop id={ui.shop} />
  if (ui.kind === 'cook') return <Cook />
  if (ui.kind === 'jobs') return <Jobs />
  return <Inventory />
}
