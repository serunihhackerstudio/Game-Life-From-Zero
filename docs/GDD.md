# GAME DESIGN DOCUMENT (GDD)
# LIFE FROM ZERO
### A 3D Open-World Life Simulation Game

**Version:** 1.0  
**Project Status:** Pre-Production  
**Platform:** Web Browser (PC/Laptop)  
**Game Engine:** Three.js  
**Framework:** React + React Three Fiber  
**Programming Language:** TypeScript  
**Visual Style:** Stylized Realistic 3D  
**Game Mode:** Single Player  
**Camera:** Third-Person Perspective  

**Tagline:**
*Start with Nothing. Build Everything.*

---

# 1. GAME OVERVIEW

## 1.1 Game Concept

LIFE FROM ZERO adalah game simulasi kehidupan 3D yang menceritakan perjalanan seorang remaja yang hidup sebatang kara dan harus membangun kehidupannya sendiri dari nol.

Pemain memulai kehidupan dengan tinggal di sebuah kamar kos sederhana, memiliki uang terbatas, tidak mempunyai pekerjaan tetap, serta harus memenuhi kebutuhan hidup sehari-hari.

Untuk bertahan hidup, pemain harus mencari pekerjaan, mendapatkan penghasilan, membeli makanan, membayar biaya kos, membayar listrik, menjaga kesehatan, dan mengembangkan kemampuan diri.

Seiring berjalannya waktu, pemain dapat meningkatkan kualitas kehidupannya melalui pendidikan, karier, bisnis, investasi, dan berbagai peluang lainnya.

Pemain bebas menentukan ingin menjadi apa di masa depan.

Beberapa pilihan cita-cita antara lain:
- Pengusaha.
- CEO perusahaan.
- Guru.
- Insinyur.
- Dokter.
- Programmer.
- Investor.
- Petani sukses.
- Pemilik restoran.
- Pemilik perusahaan logistik.
- Profesional.
- Dan berbagai profesi lainnya.

Tidak ada satu jalur kesuksesan yang wajib ditempuh.

Pemain memiliki kebebasan untuk membangun kehidupan sesuai pilihan dan strategi masing-masing.

## 1.2 Game Vision

Menciptakan pengalaman simulasi kehidupan yang memberikan kebebasan kepada pemain untuk menjalani kehidupan virtual secara realistis, mulai dari bertahan hidup hingga mencapai kesuksesan.

Game harus memberikan perasaan bahwa setiap keputusan memiliki konsekuensi dan setiap usaha dapat menghasilkan perkembangan kehidupan.

## 1.3 Game Pillars

Lima pilar utama permainan:

1. **Survival:** Mempertahankan kehidupan dan memenuhi kebutuhan dasar.
2. **Freedom:** Memberikan kebebasan memilih pekerjaan dan tujuan hidup.
3. **Progression:** Mengembangkan karakter, skill, pendidikan, karier, dan aset.
4. **Simulation:** Menghadirkan kehidupan kota yang dinamis.
5. **Achievement:** Memberikan kepuasan ketika pemain berhasil meningkatkan kualitas hidup.

---

# 2. TARGET PLATFORM DAN TEKNOLOGI

## 2.1 Platform

Versi pertama dikembangkan sebagai browser-based 3D game.

Target perangkat:
- Windows PC.
- Laptop.
- Browser berbasis Chromium.
- Browser desktop lainnya yang mendukung WebGL.

Mobile browser menjadi target pengembangan berikutnya.

## 2.2 Technology Stack

| Komponen | Teknologi |
|---|---|
| 3D Engine | Three.js |
| 3D Integration | React Three Fiber |
| UI Framework | React |
| Language | TypeScript |
| Build Tool | Vite |
| 3D Helpers | Drei |
| Physics | Rapier |
| State Management | Zustand |
| Local Storage | IndexedDB |
| Backend Future | Supabase |

## 2.3 Technical Architecture

Arsitektur aplikasi dibagi menjadi beberapa sistem independen.

- Game Core System.
- World Management System.
- Player Management System.
- Character Animation System.
- Life Simulation System.
- Job and Career System.
- Economy System.
- Inventory System.
- Education System.
- Business System.
- NPC System.
- Interaction System.
- Save and Load System.
- UI Management System.

Setiap sistem harus memiliki tanggung jawab yang jelas dan dapat dikembangkan tanpa merusak sistem lainnya.

---

# 3. GAME WORLD

## 3.1 World Concept

Game mengambil latar kota modern yang terinspirasi dari kehidupan perkotaan Indonesia.

Lingkungan terdiri dari kawasan permukiman, pasar tradisional, pertokoan, kawasan industri, perkantoran, kampus, dan pusat bisnis.

Dunia game dikembangkan secara bertahap.

## 3.2 Initial Map: Kota Harapan

Distrik pertama yang tersedia adalah Kota Harapan.

Lokasi awal:

| Lokasi | Fungsi |
|---|---|
| Kos Pak Budi | Tempat tinggal pemain |
| Warung | Membeli makanan |
| Minimarket | Membeli kebutuhan harian |
| Pasar | Membeli bahan makanan |
| Gudang Logistik | Lokasi pekerjaan |
| Job Center | Mencari pekerjaan |
| Tukang Cukur | Layanan potong rambut |
| Taman Kota | Rekreasi |
| ATM | Transaksi keuangan |
| Bengkel | Perawatan kendaraan |

Setiap bangunan harus memiliki fungsi gameplay.

## 3.3 World Expansion

Pengembangan map berikutnya:

- Residential District.
- Commercial District.
- Industrial District.
- Education District.
- University District.
- Business District.
- Luxury District.
- Agricultural District.

Setiap distrik memiliki aktivitas ekonomi, NPC, pekerjaan, dan peluang yang berbeda.

## 3.4 Day and Night Cycle

Game memiliki siklus waktu:

- Morning.
- Afternoon.
- Evening.
- Night.

Waktu game berjalan secara otomatis.

Waktu dapat memengaruhi:
- Jam kerja.
- Jam operasional toko.
- Rutinitas NPC.
- Ketersediaan pekerjaan.
- Aktivitas sosial.
- Kebutuhan istirahat.

Cuaca meliputi cerah, mendung, hujan, dan kondisi cuaca khusus.

---

# 4. CHARACTER SYSTEM

## 4.1 Character Selection

Pada awal permainan, pemain dapat memilih karakter utama.

Pilihan:
- Male Character.
- Female Character.

## 4.2 Character Customization

Pemain dapat mengatur:

- Nama karakter.
- Jenis kelamin.
- Wajah.
- Warna kulit.
- Gaya rambut.
- Warna rambut.
- Pakaian.
- Celana.
- Sepatu.
- Aksesori.

Customization dikembangkan secara bertahap.

## 4.3 Character Attributes

Karakter memiliki beberapa atribut utama:

| Attribute | Fungsi |
|---|---|
| Health | Kondisi kesehatan |
| Energy | Tenaga untuk beraktivitas |
| Hunger | Tingkat kebutuhan makanan |
| Thirst | Kebutuhan minum |
| Hygiene | Kebersihan tubuh |
| Mood | Kondisi suasana hati |
| Intelligence | Kemampuan akademik |
| Strength | Kekuatan fisik |
| Social | Kemampuan berinteraksi |
| Experience | Perkembangan karakter |

## 4.4 Character Progression

Karakter memperoleh experience melalui aktivitas.

Contoh:
- Bekerja meningkatkan pengalaman kerja.
- Belajar meningkatkan kemampuan akademik.
- Berolahraga meningkatkan kekuatan.
- Berinteraksi meningkatkan kemampuan sosial.
- Menjalankan bisnis meningkatkan pengalaman bisnis.

---

# 5. SURVIVAL SYSTEM

Survival merupakan sistem inti pada tahap awal permainan.

Pemain harus memastikan seluruh kebutuhan karakter terpenuhi.

## 5.1 Hunger System

Tingkat lapar meningkat seiring waktu dan aktivitas.

Jika lapar terlalu tinggi:
- Mood menurun.
- Energi menurun.
- Produktivitas bekerja menurun.
- Kesehatan dapat terganggu.

Solusi:
- Membeli makanan.
- Memasak.
- Makan di warung.
- Menyimpan bahan makanan.

## 5.2 Energy System

Energi berkurang ketika karakter:
- Berjalan.
- Berlari.
- Bekerja.
- Berolahraga.
- Melakukan aktivitas fisik.

Energi dipulihkan dengan:
- Tidur.
- Istirahat.
- Aktivitas rekreasi tertentu.

## 5.3 Health System

Kesehatan dipengaruhi oleh:
- Pola makan.
- Kualitas istirahat.
- Tingkat kelelahan.
- Kondisi lingkungan.
- Event tertentu.

## 5.4 Hygiene System

Karakter perlu:
- Mandi.
- Menggosok gigi.
- Mengganti pakaian.
- Menjaga kebersihan kamar.

## 5.5 Mood System

Mood dipengaruhi oleh:
- Kondisi keuangan.
- Kebutuhan dasar.
- Lingkungan.
- Interaksi sosial.
- Rekreasi.
- Keberhasilan pekerjaan.

Sistem survival harus memberikan tantangan, tetapi tidak boleh terlalu menghukum pemain.

---

# 6. HOUSING SYSTEM

## 6.1 Initial Housing

Pemain memulai kehidupan di kamar kos sederhana.

Fasilitas awal:
- Kasur.
- Lemari.
- Meja kecil.
- Kursi.
- Lampu.
- Kipas angin.
- Kamar mandi bersama.

## 6.2 Housing Expenses

Pengeluaran tempat tinggal:
- Biaya sewa kos.
- Biaya listrik.
- Air.
- Internet.
- Biaya tambahan.

Pemain harus membayar tagihan sesuai periode yang ditentukan.

Jika tidak membayar:
- Mendapatkan peringatan.
- Mendapatkan denda sesuai aturan.
- Berisiko kehilangan tempat tinggal.

## 6.3 Housing Upgrade

Pemain dapat meningkatkan tempat tinggal:

1. Kamar kos sederhana.
2. Kamar kos nyaman.
3. Kamar kos premium.
4. Kontrakan.
5. Apartemen.
6. Rumah sederhana.
7. Rumah modern.
8. Rumah mewah.

## 6.4 Furniture System

Pemain dapat membeli dan menempatkan furnitur.

Kategori:
- Bedroom.
- Kitchen.
- Bathroom.
- Living Room.
- Electronics.
- Decoration.

---

# 7. JOB SYSTEM

## 7.1 Job Concept

Pekerjaan merupakan sumber pendapatan utama pada tahap awal permainan.

Pemain bebas memilih pekerjaan berdasarkan:
- Kemampuan.
- Pengalaman.
- Modal.
- Ketersediaan pekerjaan.
- Waktu.
- Kondisi fisik.

## 7.2 Initial Job List: 20 Professions

| No | Pekerjaan | Kategori |
|---|---|---|
| 1 | Penjual koran | Trading |
| 2 | Tukang parkir | Service |
| 3 | Kurir | Delivery |
| 4 | Petani | Agriculture |
| 5 | Tukang cukur | Service |
| 6 | Penjual sayur keliling | Trading |
| 7 | Pekerja gudang | Logistics |
| 8 | Pelayan restoran | Hospitality |
| 9 | Pencuci kendaraan | Service |
| 10 | Penjual makanan | Trading |
| 11 | Penjahit | Crafting |
| 12 | Tukang bangunan | Construction |
| 13 | Cleaning service | Service |
| 14 | Pengajar les | Education |
| 15 | Penjaga toko | Retail |
| 16 | Driver | Transportation |
| 17 | Teknisi komputer | Technology |
| 18 | Programmer freelance | Digital |
| 19 | Desainer grafis | Digital |
| 20 | Content creator | Digital |

## 7.3 Job Mechanics

Setiap pekerjaan harus memiliki gameplay yang sesuai.

Contoh:

**Kurir**
- Mengambil paket.
- Membaca alamat.
- Menentukan rute.
- Mengantar paket.
- Menerima pembayaran.

**Petani**
- Membeli bibit.
- Mengolah tanah.
- Menanam.
- Menyiram.
- Menunggu panen.
- Menjual hasil pertanian.

**Tukang cukur**
- Membuka tempat usaha.
- Menerima pelanggan.
- Memilih model rambut.
- Menjalankan aktivitas mencukur.
- Mendapatkan pembayaran.

**Pengajar les**
- Mencari murid.
- Mengatur jadwal.
- Mengajar.
- Mendapatkan penghasilan.
- Meningkatkan reputasi.

**Programmer freelance**
- Mencari proyek.
- Menerima pesanan.
- Mengerjakan proyek melalui mini-game.
- Menyelesaikan deadline.
- Mendapatkan pembayaran dan reputasi.

## 7.4 Job Progression

Pekerjaan memiliki tingkat pengalaman:

- Beginner.
- Intermediate.
- Advanced.
- Expert.

Peningkatan pengalaman dapat membuka:
- Upah lebih tinggi.
- Pekerjaan lebih sulit.
- Peluang pekerjaan profesional.
- Kesempatan menjadi supervisor.
- Kesempatan membuka usaha sendiri.

---

# 8. ECONOMY SYSTEM

## 8.1 Currency

Mata uang menggunakan Rupiah (IDR).

Pemain memiliki uang tunai dan saldo rekening.

## 8.2 Income Sources

Sumber pendapatan:
- Pekerjaan harian.
- Pekerjaan tetap.
- Freelance.
- Jual beli.
- Pertanian.
- Bisnis.
- Investasi.
- Properti.
- Passive income.

## 8.3 Expense Categories

Pengeluaran meliputi:

- Makanan.
- Minuman.
- Kos.
- Listrik.
- Air.
- Internet.
- Transportasi.
- Pendidikan.
- Kesehatan.
- Peralatan.
- Kendaraan.
- Hiburan.

## 8.4 Banking System

Fitur:
- Membuka rekening.
- Menabung.
- Transfer.
- Membayar tagihan.
- Melihat riwayat transaksi.
- Deposito.
- Pinjaman pada pengembangan berikutnya.

## 8.5 Economic Balance

Ekonomi harus dirancang agar pemain memiliki pilihan antara:
- Menghabiskan uang untuk kebutuhan.
- Menabung.
- Membeli peralatan.
- Mengembangkan skill.
- Membuka usaha.
- Menginvestasikan uang.

Tidak boleh ada satu strategi yang selalu menjadi pilihan paling menguntungkan.

---

# 9. INVENTORY AND ITEM SYSTEM

Pemain memiliki inventory untuk menyimpan barang.

Kategori:

**Food**
- Beras.
- Mie instan.
- Telur.
- Sayuran.
- Daging.
- Roti.
- Air mineral.

**Tools**
- Cangkul.
- Gunting rambut.
- Peralatan kebersihan.
- Laptop.
- Obeng.
- Peralatan kerja.

**Clothing**
- Baju.
- Celana.
- Sepatu.
- Jaket.

**Electronics**
- Smartphone.
- Laptop.
- Kipas angin.
- Televisi.

**Resources**
- Bibit.
- Pupuk.
- Bahan produksi.
- Barang dagangan.

Inventory memiliki batas kapasitas dan dapat ditingkatkan.

---

# 10. EDUCATION AND SKILL SYSTEM

Pendidikan merupakan salah satu cara meningkatkan kesempatan hidup.

## 10.1 Education Path

- Tidak sekolah.
- Pendidikan dasar.
- SMP.
- SMA/SMK.
- Diploma.
- Sarjana.
- Pascasarjana.

Pemain dapat memilih jalur pendidikan sesuai kemampuan finansial dan persyaratan.

## 10.2 Education Mechanics

- Mendaftar sekolah.
- Membayar biaya pendidikan.
- Mengikuti kelas.
- Mengerjakan tugas.
- Mengikuti ujian.
- Mendapatkan nilai.
- Lulus.
- Memperoleh sertifikat atau gelar.

## 10.3 Skill Tree

Skill dibagi menjadi:

**Business**
- Entrepreneurship.
- Management.
- Marketing.
- Accounting.

**Technology**
- Programming.
- Computer.
- Engineering.
- Digital Design.

**Agriculture**
- Farming.
- Animal Husbandry.
- Crop Management.

**Social**
- Communication.
- Negotiation.
- Teaching.
- Networking.

**Physical**
- Strength.
- Endurance.
- Dexterity.

Skill membuka peluang pekerjaan dan meningkatkan kualitas hasil aktivitas.

---

# 11. CAREER AND LIFE GOALS

Pemain dapat memilih tujuan jangka panjang.

Pilihan karier:

- Entrepreneur.
- CEO.
- Teacher.
- Engineer.
- Doctor.
- Programmer.
- Investor.
- Farmer.
- Business Owner.
- Professional Manager.

Setiap pilihan memiliki jalur perkembangan sendiri.

Contoh jalur CEO:

Karyawan → Staff → Supervisor → Manager → Director → CEO.

Contoh jalur pengusaha:

Pekerja → Pedagang kecil → Pemilik toko → Pemilik beberapa cabang → Pengusaha besar.

Contoh jalur insinyur:

Pendidikan → Junior Engineer → Engineer → Senior Engineer → Engineering Manager.

Tujuan ini tidak mengunci pemain. Pemain tetap bebas berganti jalur karier.

---

# 12. BUSINESS SYSTEM

Pada tahap perkembangan, pemain dapat membuka bisnis sendiri.

Jenis bisnis:

1. Warung makan.
2. Toko kelontong.
3. Toko pakaian.
4. Barbershop.
5. Pertanian.
6. Peternakan.
7. Bengkel.
8. Laundry.
9. Restoran.
10. Perusahaan logistik.
11. Digital agency.
12. Perusahaan teknologi.

Fitur bisnis:

- Membeli atau menyewa tempat.
- Membeli perlengkapan.
- Menentukan harga.
- Mengelola stok.
- Melayani pelanggan.
- Merekrut pegawai.
- Membayar gaji.
- Menghitung keuntungan.
- Mengembangkan cabang.

Bisnis dapat menghasilkan pendapatan ketika pemain sedang melakukan aktivitas lain.

---

# 13. INVESTMENT SYSTEM

Pemain dapat mengembangkan kekayaan melalui investasi.

Jenis investasi:

- Tabungan.
- Deposito.
- Saham.
- Properti.
- Tanah.
- Bisnis.
- Aset produktif.

Setiap investasi memiliki risiko, modal, dan potensi keuntungan.

Harga investasi dapat berubah berdasarkan simulasi ekonomi.

---

# 14. NPC AND SOCIAL SYSTEM

NPC merupakan bagian penting dari kehidupan kota.

Jenis NPC:
- Pemilik kos.
- Pedagang.
- Pelanggan.
- Pemilik bisnis.
- Pekerja.
- Mahasiswa.
- Guru.
- Tetangga.
- Recruiter.
- Investor.

NPC memiliki:
- Nama.
- Profesi.
- Rutinitas.
- Lokasi aktivitas.
- Kebutuhan dasar.
- Interaksi.
- Reputasi.

Social System memungkinkan pemain:
- Berteman.
- Berkenalan.
- Membangun relasi profesional.
- Mencari mentor.
- Membuat koneksi bisnis.
- Mendapatkan peluang kerja.

---

# 15. SMARTPHONE SYSTEM

Smartphone menjadi pusat informasi dan aktivitas pemain.

Aplikasi:

| Aplikasi | Fungsi |
|---|---|
| JobFinder | Mencari pekerjaan |
| Banking | Mengelola uang |
| Marketplace | Membeli dan menjual barang |
| EduApp | Pendidikan |
| Social | Interaksi sosial |
| Maps | Navigasi |
| Business Manager | Mengelola bisnis |
| Calendar | Mengatur aktivitas |

Aplikasi dapat dikembangkan bertahap sesuai progres pemain.

---

# 16. INTERACTION SYSTEM

Pemain dapat berinteraksi dengan objek di dunia 3D.

Contoh:

| Objek | Aksi |
|---|---|
| Kasur | Tidur |
| Kompor | Memasak |
| Kulkas | Menyimpan makanan |
| Pintu | Masuk/keluar |
| ATM | Transaksi |
| NPC | Berbicara |
| Job Board | Mencari kerja |
| Kendaraan | Mengemudi |
| Meja | Belajar |
| Shower | Mandi |
| Toko | Belanja |

Interaksi menggunakan tombol E pada keyboard.

---

# 17. MISSION AND ACHIEVEMENT SYSTEM

Game menggunakan dua kategori tujuan.

**Daily Goals**
- Mendapatkan uang.
- Membeli makanan.
- Bekerja.
- Belajar.
- Menjaga kebersihan.
- Mengembangkan skill.

**Life Goals**
- Mendapat pekerjaan tetap.
- Menyelesaikan pendidikan.
- Membeli kendaraan.
- Memiliki rumah.
- Membuka bisnis.
- Memiliki perusahaan.
- Menjadi investor.

Achievement memberikan reward berupa XP, reputasi, atau hadiah tertentu.

---

# 18. PROGRESSION SYSTEM

Game memiliki lima fase perkembangan kehidupan.

**Phase 1 — Survival**

Pemain belajar bertahan hidup, mencari pekerjaan, memenuhi kebutuhan dasar, dan membayar kos.

**Phase 2 — Independence**

Pemain memiliki penghasilan lebih stabil, tabungan, kendaraan sederhana, dan mulai mengembangkan skill.

**Phase 3 — Growth**

Pemain meningkatkan pendidikan, mendapatkan pekerjaan lebih baik, membangun relasi, dan membuka usaha kecil.

**Phase 4 — Opportunity**

Pemain mulai membangun bisnis, membeli properti, berinvestasi, dan meningkatkan kekayaan.

**Phase 5 — Legacy**

Pemain membangun perusahaan besar, membuka lapangan pekerjaan, mengembangkan kota, dan membantu NPC lainnya.

Kelima fase tidak wajib diselesaikan secara linear.

---

# 19. USER INTERFACE AND USER EXPERIENCE

UI dirancang minimalis, modern, dan tidak mengganggu tampilan dunia 3D.

## 19.1 Main HUD

Informasi:
- Waktu.
- Tanggal.
- Uang.
- Hunger.
- Energy.
- Health.
- Mood.

## 19.2 Main Menu

Menu:
- New Game.
- Continue.
- Load Game.
- Settings.
- Credits.

## 19.3 In-Game Menu

- Inventory.
- Smartphone.
- Map.
- Career.
- Skills.
- Business.
- Finance.
- Journal.
- Character.

## 19.4 Visual Direction

Gunakan desain UI modern dengan:
- Typography yang bersih.
- Icon sederhana.
- Panel semi-transparan.
- Animasi transisi halus.
- Warna yang konsisten.
- Responsive layout.

---

# 20. ART DIRECTION

## 20.1 Visual Style

Stylized Realistic 3D.

Karakter dan lingkungan memiliki proporsi realistis dengan penyederhanaan visual agar menarik dan ringan untuk browser.

## 20.2 Environment

Lingkungan terinspirasi dari kota Indonesia:
- Rumah kos.
- Gang perkotaan.
- Warung.
- Pasar.
- Jalan raya.
- Kampus.
- Perkantoran.
- Kawasan industri.

## 20.3 Character Animation

Animasi:
- Idle.
- Walking.
- Running.
- Jumping.
- Eating.
- Sleeping.
- Cooking.
- Working.
- Sitting.
- Interacting.

## 20.4 Audio

Audio meliputi:
- Background music.
- Ambient city.
- Suara kendaraan.
- Suara hujan.
- Suara NPC.
- Efek interaksi.
- Efek pekerjaan.

---

# 21. CORE GAMEPLAY LOOP

Loop utama permainan:

1. Memeriksa kebutuhan karakter.
2. Menentukan aktivitas.
3. Melakukan pekerjaan atau kegiatan produktif.
4. Mendapatkan penghasilan.
5. Membayar kebutuhan hidup.
6. Mengelola uang.
7. Mengembangkan kemampuan.
8. Membuka peluang baru.
9. Meningkatkan kualitas kehidupan.
10. Menentukan target selanjutnya.

Prinsip utama: setiap aktivitas harus memberikan kontribusi terhadap kehidupan pemain.

---

# 22. GAME BALANCING

Nilai awal berikut merupakan parameter prototipe dan dapat disesuaikan setelah playtesting.

## Starting Condition

| Parameter | Nilai Awal |
|---|---:|
| Starting Money | Rp100.000 |
| Initial Health | 100 |
| Initial Energy | 100 |
| Initial Hunger | 100 |
| Initial Thirst | 100 |
| Initial Mood | 75 |
| Initial Housing | Kos sederhana |
| Initial Vehicle | Tidak ada |
| Initial Job | Tidak ada |

## Contoh Pengeluaran

| Item | Harga Awal |
|---|---:|
| Mie instan | Rp3.500 |
| Telur | Rp2.500 |
| Air mineral | Rp3.000 |
| Beras 1 kg | Rp15.000 |
| Sayuran | Rp5.000 |
| Biaya kos harian ekuivalen | Rp20.000 |

## Contoh Penghasilan

| Pekerjaan | Penghasilan Awal |
|---|---:|
| Penjual koran | Rp30.000/hari |
| Tukang parkir | Rp35.000/hari |
| Kurir | Rp50.000/hari |
| Pekerja gudang | Rp60.000/hari |
| Pelayan restoran | Rp50.000/hari |

Seluruh nominal merupakan asumsi awal untuk balancing, bukan harga ekonomi yang harus permanen.

---

# 23. SAVE AND LOAD SYSTEM

Game harus dapat menyimpan progres pemain.

Data yang disimpan:

- Karakter.
- Posisi terakhir.
- Uang.
- Inventory.
- Kebutuhan.
- Skill.
- Pengalaman kerja.
- Pendidikan.
- Bisnis.
- Properti.
- Kendaraan.
- Relasi.
- Waktu game.
- Progress misi.

Versi pertama menggunakan IndexedDB.

Cloud Save dan akun pemain dapat ditambahkan melalui Supabase pada fase pengembangan berikutnya.

---

# 24. DEVELOPMENT ROADMAP

Pengembangan dilakukan dalam enam fase.

## Phase 1 — Foundation

Target: Playable 3D Prototype.

Fitur:
- Setup React dan Three.js.
- Third-person camera.
- Character selection.
- Player movement.
- Collision.
- Kamar kos 3D.
- Lingkungan kota sederhana.
- Interaksi dasar.

## Phase 2 — Survival System

Fitur:
- Game time.
- Hunger.
- Energy.
- Health.
- Mood.
- Food system.
- Cooking.
- Sleeping.
- Inventory.
- Housing expenses.

## Phase 3 — Job and Economy

Fitur:
- Job Center.
- Lima pekerjaan pertama.
- Job mechanics.
- Income.
- Expense.
- Shopping.
- Banking.
- Transaction history.

## Phase 4 — Life Progression

Fitur:
- Education.
- Skill Tree.
- Career.
- Smartphone.
- Character customization.
- Housing upgrade.
- Vehicles.

## Phase 5 — Living City

Fitur:
- NPC.
- Social System.
- Dynamic Weather.
- Additional District.
- More jobs.
- More interactive buildings.
- Daily events.

## Phase 6 — Business and Legacy

Fitur:
- Business Management.
- Employees.
- Investment.
- Properties.
- Companies.
- Passive Income.
- City Development.
- Legacy System.

---

# 25. MVP SCOPE

Versi pertama tidak perlu memiliki seluruh fitur GDD.

Target MVP adalah menghasilkan game yang sudah bisa dimainkan dari awal sampai akhir satu siklus kehidupan sederhana.

## MVP Features

1. Main Menu.
2. Male/Female Character Selection.
3. Third-Person Movement.
4. Third-Person Camera.
5. One Small City Map.
6. One Boarding House.
7. One Market.
8. One Warung.
9. One Minimarket.
10. Job Center.
11. Five Jobs.
12. Hunger System.
13. Energy System.
14. Health System.
15. Money System.
16. Inventory.
17. Shopping.
18. Cooking.
19. Sleeping.
20. Day and Night Cycle.
21. Basic NPC Interaction.
22. Save and Load.

## MVP Acceptance Criteria

MVP dinyatakan berhasil apabila:

- Game dapat dibuka melalui browser.
- Pemain dapat memilih karakter.
- Karakter dapat bergerak dan berinteraksi.
- Dunia 3D dapat dieksplorasi.
- Pemain dapat mencari dan menjalankan pekerjaan.
- Pemain dapat memperoleh uang.
- Pemain dapat membeli kebutuhan.
- Pemain dapat memenuhi kebutuhan karakter.
- Waktu game berjalan.
- Pemain dapat menyimpan dan melanjutkan permainan.
- Tidak terdapat bug kritis yang menghalangi gameplay.

---

# 26. PERFORMANCE REQUIREMENTS

Karena game berjalan di browser, performa merupakan prioritas.

Target awal:
- 60 FPS pada perangkat desktop yang memadai.
- Fallback 30 FPS pada perangkat yang lebih terbatas.
- Optimasi draw calls.
- Optimasi texture.
- LOD.
- Instanced rendering.
- Object pooling.
- Map chunking.
- Pengelolaan NPC aktif.
- Penggunaan baked lighting jika sesuai.

Game harus memiliki pengaturan kualitas grafis.

Pilihan:
- Low.
- Medium.
- High.

---

# 27. DESIGN PRINCIPLES

Seluruh pengembangan harus mengikuti prinsip berikut:

1. Gameplay lebih penting daripada banyaknya fitur.
2. Setiap aktivitas harus memiliki tujuan.
3. Pemain memiliki kebebasan menentukan jalan hidup.
4. Ekonomi harus masuk akal dan seimbang.
5. Survival harus menantang tetapi tidak membuat frustrasi.
6. Progression harus terasa dan terlihat.
7. Dunia game harus memberikan pengalaman kehidupan yang menarik.
8. Sistem harus modular dan mudah dikembangkan.
9. Performa browser harus menjadi pertimbangan utama.
10. Fitur baru tidak boleh merusak fitur yang sudah berjalan.

---

# 28. LONG-TERM VISION

LIFE FROM ZERO tidak berhenti ketika pemain sudah kaya.

Justru setelah mencapai kesuksesan, pemain mendapatkan kesempatan baru.

Pemain dapat:
- Mendirikan perusahaan.
- Membeli berbagai properti.
- Mengembangkan bisnis.
- Mempekerjakan NPC.
- Menjadi investor.
- Membantu orang lain.
- Membangun fasilitas umum.
- Mengembangkan kota.

Game tidak memiliki satu ending wajib.

Kesuksesan ditentukan oleh pemain sendiri.

---

# 29. FINAL PROJECT DEFINITION

**LIFE FROM ZERO** adalah browser-based 3D open-world life simulation game yang dibangun menggunakan React, TypeScript, Three.js, dan React Three Fiber.

Pemain memulai kehidupan dari nol sebagai seorang remaja yang hidup mandiri di kamar kos sederhana.

Melalui pekerjaan, pendidikan, pengembangan kemampuan, bisnis, investasi, dan interaksi sosial, pemain membangun kehidupannya sendiri.

Game menggabungkan elemen:

- Life Simulation.
- Survival.
- Open World.
- Career RPG.
- Business Simulation.
- Economic Simulation.
- Character Progression.

**Core Philosophy:**

"Your life, your choices, your future."

Tidak ada jalan sukses yang sama untuk setiap pemain.

Setiap pemain memiliki cerita kehidupannya sendiri.

---

**END OF GAME DESIGN DOCUMENT**

Project: LIFE FROM ZERO  
Document Version: 1.0  
Status: Ready for Technical Pre-Production
