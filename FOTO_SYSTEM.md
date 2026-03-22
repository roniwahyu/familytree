# Sistem Manajemen Foto Anggota Keluarga

## Fitur Utama

### 1. Upload Foto ke ImageKit
- Foto dapat diupload dari perangkat lokal
- Otomatis tersimpan ke ImageKit CDN
- URL foto tersimpan di database Dexie

### 2. Image Cropper & Editor
- **Atur Posisi**: Geser foto untuk mengatur posisi crop
- **Zoom**: Slider zoom 100% - 300% untuk detail yang lebih baik
- **Kualitas**: Slider kualitas 60% - 100% untuk kontrol ukuran file
- **Preview Real-time**: Lihat hasil crop secara langsung
- **Kompresi Otomatis**: Foto otomatis dikompres ke max 1200x1200px
- **Info Ukuran**: Tampilkan ukuran file asli

### 3. Klik untuk Melihat Foto
- Klik foto di kartu family tree untuk melihat ukuran penuh
- Klik foto di sidebar detail untuk melihat ukuran penuh
- Mendukung foto anggota dan foto pasangan

### 4. Edit Foto Langsung dari Viewer
- Tombol upload muncul di image viewer (jika ImageKit terkonfigurasi)
- Klik tombol upload untuk mengganti foto
- Foto baru otomatis diupload ke ImageKit
- Database otomatis terupdate dengan URL baru

## Alur Kerja Upload Foto

### 1. Pilih Foto
```
User klik upload → Pilih file dari perangkat
```

### 2. Crop & Edit
```
Image Cropper muncul dengan fitur:
├── Geser untuk posisi
├── Zoom slider (1x - 3x)
├── Kualitas slider (60% - 100%)
└── Preview real-time
```

### 3. Kompresi Otomatis
```
Setelah crop:
├── Resize ke max 1200x1200px
├── Kompresi sesuai kualitas yang dipilih
└── Convert ke JPEG dengan quality setting
```

### 4. Upload ke ImageKit
```
File terkompresi → Upload ke ImageKit → Return URL
```

### 5. Simpan ke Database
```
URL foto → Simpan ke Dexie → UI auto-refresh
```

## Kontrol Kualitas & Ukuran

### Slider Kualitas
- **90-100%**: Kualitas tinggi (ukuran besar, ~500KB-1MB)
- **75-89%**: Kualitas baik (ukuran sedang, ~200-500KB)
- **60-74%**: Kualitas standar (ukuran kecil, ~100-200KB)

### Kompresi Otomatis
- Max dimensi: 1200x1200 pixels
- Format output: JPEG
- Aspect ratio: 1:1 (bulat)
- Smoothing: High quality

## Validasi File

### Format yang Didukung
- JPEG / JPG
- PNG
- WebP

### Batasan
- Ukuran maksimal: 10MB
- Hanya file gambar yang diterima

## Lokasi Upload Foto

### A. Form Tambah/Edit Anggota (MemberFormModal)
1. Pilih avatar default
2. Upload foto dari perangkat → Cropper
3. Input URL foto manual
4. Upload foto pasangan → Cropper

### B. Image Viewer (saat melihat foto)
1. Klik foto untuk fullscreen
2. Tombol upload di pojok kanan atas
3. Pilih foto baru → Cropper
4. Langsung ganti tanpa buka form edit

## Struktur Database

```typescript
interface FamilyMemberDB {
  id: string;
  photo: string;           // URL foto anggota (dari ImageKit)
  spousePhoto?: string;    // URL foto pasangan (opsional)
  // ... field lainnya
}
```

## Konfigurasi ImageKit

File: `.env`
```env
VITE_IMAGEKIT_PUBLIC_KEY=your_public_key
VITE_IMAGEKIT_PRIVATE_KEY=your_private_key
VITE_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id
```

## Komponen Terkait

1. **ImageCropper.tsx** - Cropper dengan zoom & quality control
2. **ImageViewer.tsx** - Modal untuk melihat dan edit foto
3. **MemberFormModal.tsx** - Form untuk upload foto saat tambah/edit
4. **FamilyTree.tsx** - Kartu tree dengan foto clickable
5. **Sidebar.tsx** - Detail member dengan foto clickable
6. **App.tsx** - Handler untuk update foto ke database
7. **imagekit.ts** - Utility untuk upload ke ImageKit
8. **imageCompression.ts** - Utility untuk kompresi gambar
9. **database.ts** - Dexie database untuk simpan URL foto

## Library yang Digunakan

- **react-easy-crop**: Image cropping dengan touch support
- **Canvas API**: Untuk crop dan kompresi gambar
- **FileReader API**: Untuk membaca file gambar

## Fitur Tambahan

### Touch Support
- Pinch to zoom di mobile
- Drag untuk mengatur posisi
- Responsive di semua ukuran layar

### Error Handling
- File bukan gambar → Error message
- File terlalu besar → Error message
- Upload gagal → Error message dengan detail
- ImageKit tidak terkonfigurasi → Tombol upload tidak muncul

### Performance
- Lazy loading untuk cropper
- Kompresi otomatis untuk mengurangi bandwidth
- Preview real-time tanpa lag
- Smooth animations

## Tips Penggunaan

1. **Untuk Foto Profil Terbaik**:
   - Gunakan foto close-up wajah
   - Pastikan wajah di tengah saat crop
   - Gunakan kualitas 85-90% untuk hasil optimal

2. **Untuk Menghemat Storage**:
   - Gunakan kualitas 70-80%
   - Foto tetap bagus dengan ukuran lebih kecil

3. **Untuk Foto Detail Tinggi**:
   - Gunakan kualitas 95-100%
   - Cocok untuk foto yang akan di-print
