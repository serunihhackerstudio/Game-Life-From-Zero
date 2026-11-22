# Credits & aset pihak ketiga

Model 3D di `public/models/` diambil dari repositori contoh three.js (`examples/models/gltf`) sebagai **aset sementara (placeholder)**:

| File | Asal | Catatan |
|---|---|---|
| `male.glb` | `readyplayer.me.glb` — avatar contoh Ready Player Me | rig Mixamo-kompatibel |
| `female.glb` | `Michelle.glb` — karakter Mixamo | |
| `anims.glb` | `Soldier.glb` — dipakai hanya untuk klip Idle/Walk/Run (Mixamo) | |

Periksa lisensi masing-masing sebelum dirilis komersial. Ganti `male.glb` / `female.glb` dengan avatar buatan sendiri
(mis. dari readyplayer.me atau model Mixamo) dengan nama tulang Mixamo (`Hips`, `Spine`, ... atau `mixamorigHips`, ...);
animasi akan di-retarget otomatis (`src/Character.tsx`).
