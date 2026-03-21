import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { FamilyMemberDB } from '../db/database';

type ExportFormat = 'json' | 'csv' | 'xlsx';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: any) => Promise<void>;
  onImportFlat: (rows: Partial<FamilyMemberDB>[]) => Promise<void>;
  onExport: () => Promise<any>;
  onExportFlat: () => Promise<FamilyMemberDB[]>;
  onClearAll: () => Promise<void>;
  onLoadSampleData: () => Promise<void>;
}

const FLAT_COLUMNS: (keyof FamilyMemberDB)[] = [
  'id', 'parentId', 'name', 'gender', 'dob', 'job', 'address', 'phone',
  'photo', 'generation', 'spouseName', 'spousePhoto', 'orderIndex'
];

const COLUMN_LABELS: Record<string, string> = {
  id: 'ID',
  parentId: 'Parent ID',
  name: 'Nama',
  gender: 'Jenis Kelamin (L/P)',
  dob: 'Tempat/Tgl Lahir',
  job: 'Pekerjaan',
  address: 'Alamat',
  phone: 'Telepon',
  photo: 'Foto URL',
  generation: 'Generasi',
  spouseName: 'Nama Pasangan',
  spousePhoto: 'Foto Pasangan URL',
  orderIndex: 'Urutan'
};

function parseSheetToRows(sheet: XLSX.WorkSheet): Partial<FamilyMemberDB>[] {
  const raw = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);
  return raw.map(row => {
    // Map column labels back to keys
    const labelToKey: Record<string, string> = {};
    for (const [key, label] of Object.entries(COLUMN_LABELS)) {
      labelToKey[label] = key;
      labelToKey[key] = key; // also accept raw key names
    }

    const mapped: Record<string, any> = {};
    for (const [col, val] of Object.entries(row)) {
      const key = labelToKey[col] || col;
      mapped[key] = val;
    }

    return {
      id: mapped.id ? String(mapped.id) : undefined,
      parentId: mapped.parentId ? String(mapped.parentId) : null,
      name: mapped.name ? String(mapped.name) : '',
      gender: mapped.gender === 'P' ? 'P' : 'L',
      dob: mapped.dob ? String(mapped.dob) : '',
      job: mapped.job ? String(mapped.job) : '',
      address: mapped.address ? String(mapped.address) : '',
      phone: mapped.phone ? String(mapped.phone) : '',
      photo: mapped.photo ? String(mapped.photo) : '',
      generation: mapped.generation ? Number(mapped.generation) : 1,
      spouseName: mapped.spouseName ? String(mapped.spouseName) : undefined,
      spousePhoto: mapped.spousePhoto ? String(mapped.spousePhoto) : undefined,
      orderIndex: mapped.orderIndex != null ? Number(mapped.orderIndex) : undefined,
    } as Partial<FamilyMemberDB>;
  });
}

function flatToSheetData(members: FamilyMemberDB[]) {
  return members.map(m => {
    const row: Record<string, any> = {};
    for (const col of FLAT_COLUMNS) {
      row[COLUMN_LABELS[col] || col] = m[col] ?? '';
    }
    return row;
  });
}

export default function ImportExportModal({
  isOpen,
  onClose,
  onImport,
  onImportFlat,
  onExport,
  onExportFlat,
  onClearAll,
  onLoadSampleData
}: ImportExportModalProps) {
  const [activeTab, setActiveTab] = useState<'import' | 'export' | 'manage'>('import');
  const [importText, setImportText] = useState('');
  const [importFileName, setImportFileName] = useState('');
  const [importFileType, setImportFileType] = useState<'json' | 'csv' | 'xlsx' | ''>('');
  const [importBinaryData, setImportBinaryData] = useState<ArrayBuffer | null>(null);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json');
  const [exportText, setExportText] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    setImportFileName(file.name);
    setStatus({ type: null, message: '' });

    if (ext === 'json' || ext === 'csv') {
      setImportFileType(ext);
      setImportBinaryData(null);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImportText(event.target?.result as string);
      };
      reader.readAsText(file);
    } else if (ext === 'xlsx' || ext === 'xls') {
      setImportFileType('xlsx');
      setImportText('');
      const reader = new FileReader();
      reader.onload = (event) => {
        setImportBinaryData(event.target?.result as ArrayBuffer);
        setImportText(`[File XLSX: ${file.name}]`);
      };
      reader.readAsArrayBuffer(file);
    } else {
      setStatus({ type: 'error', message: 'Format file tidak didukung. Gunakan .json, .csv, atau .xlsx' });
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImport = async () => {
    if (!importText.trim()) {
      setStatus({ type: 'error', message: 'Tidak ada data untuk diimpor' });
      return;
    }

    setIsLoading(true);
    try {
      if (importFileType === 'xlsx' && importBinaryData) {
        // Parse XLSX
        const workbook = XLSX.read(importBinaryData, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = parseSheetToRows(firstSheet);
        if (rows.length === 0) throw new Error('File kosong');
        await onImportFlat(rows);
        setStatus({ type: 'success', message: `${rows.length} anggota berhasil diimpor dari XLSX!` });
      } else if (importFileType === 'csv') {
        // Parse CSV using SheetJS
        const workbook = XLSX.read(importText, { type: 'string' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = parseSheetToRows(firstSheet);
        if (rows.length === 0) throw new Error('File kosong');
        await onImportFlat(rows);
        setStatus({ type: 'success', message: `${rows.length} anggota berhasil diimpor dari CSV!` });
      } else {
        // Parse JSON (tree format)
        const data = JSON.parse(importText);
        await onImport(data);
        setStatus({ type: 'success', message: 'Data berhasil diimpor dari JSON!' });
      }

      setImportText('');
      setImportFileName('');
      setImportFileType('');
      setImportBinaryData(null);
      setTimeout(() => { onClose(); }, 1500);
    } catch (error: any) {
      const msg = importFileType === 'json' || !importFileType
        ? 'Format JSON tidak valid. Pastikan data sesuai format.'
        : `Gagal membaca file ${importFileType.toUpperCase()}: ${error?.message || 'format tidak valid'}`;
      setStatus({ type: 'error', message: msg });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (format: ExportFormat) => {
    setIsLoading(true);
    setExportFormat(format);
    try {
      if (format === 'json') {
        const data = await onExport();
        if (!data) {
          setStatus({ type: 'error', message: 'Tidak ada data untuk diekspor' });
          return;
        }
        setExportText(JSON.stringify(data, null, 2));
        setStatus({ type: 'success', message: 'Data JSON siap diunduh!' });
      } else {
        const flatData = await onExportFlat();
        if (!flatData || flatData.length === 0) {
          setStatus({ type: 'error', message: 'Tidak ada data untuk diekspor' });
          return;
        }
        const sheetData = flatToSheetData(flatData);
        const ws = XLSX.utils.json_to_sheet(sheetData);

        // Set column widths
        ws['!cols'] = FLAT_COLUMNS.map(col => ({
          wch: col === 'name' || col === 'address' ? 25 :
               col === 'id' || col === 'parentId' ? 36 :
               col === 'photo' || col === 'spousePhoto' ? 40 : 18
        }));

        if (format === 'csv') {
          setExportText(XLSX.utils.sheet_to_csv(ws));
          setStatus({ type: 'success', message: 'Data CSV siap diunduh!' });
        } else {
          // XLSX - generate and download immediately
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'Silsilah Keluarga');
          const dateStr = new Date().toISOString().split('T')[0];
          XLSX.writeFile(wb, `silsilah-keluarga-${dateStr}.xlsx`);
          setExportText('');
          setStatus({ type: 'success', message: 'File XLSX berhasil diunduh!' });
        }
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Gagal mengekspor data' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!exportText) return;

    const isCSV = exportFormat === 'csv';
    const mimeType = isCSV ? 'text/csv;charset=utf-8' : 'application/json';
    const ext = isCSV ? 'csv' : 'json';
    const bom = isCSV ? '\uFEFF' : ''; // BOM for CSV Excel compatibility

    const blob = new Blob([bom + exportText], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `silsilah-keluarga-${new Date().toISOString().split('T')[0]}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setStatus({ type: 'success', message: 'File berhasil diunduh!' });
  };

  const handleCopyToClipboard = async () => {
    if (!exportText) return;
    try {
      await navigator.clipboard.writeText(exportText);
      setStatus({ type: 'success', message: 'Data disalin ke clipboard!' });
    } catch (error) {
      setStatus({ type: 'error', message: 'Gagal menyalin ke clipboard' });
    }
  };

  const handleClearAll = async () => {
    setIsLoading(true);
    try {
      await onClearAll();
      setStatus({ type: 'success', message: 'Semua data berhasil dihapus!' });
      setShowClearConfirm(false);
      setTimeout(() => { onClose(); }, 1500);
    } catch (error) {
      setStatus({ type: 'error', message: 'Gagal menghapus data' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSampleData = async () => {
    setIsLoading(true);
    try {
      await onLoadSampleData();
      setStatus({ type: 'success', message: 'Data contoh berhasil dimuat!' });
      setTimeout(() => { onClose(); }, 1500);
    } catch (error) {
      setStatus({ type: 'error', message: 'Gagal memuat data contoh' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const formatButtons: { format: ExportFormat; icon: string; label: string; desc: string; activeClass: string }[] = [
    { format: 'json', icon: 'fa-code', label: 'JSON', desc: 'Hierarki', activeClass: 'border-violet-500 bg-violet-50 text-violet-700 ring-2 ring-violet-200' },
    { format: 'csv', icon: 'fa-file-csv', label: 'CSV', desc: 'Tabel teks', activeClass: 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-200' },
    { format: 'xlsx', icon: 'fa-file-excel', label: 'XLSX', desc: 'Excel', activeClass: 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-200' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <i className="fas fa-database"></i>
              Kelola Data
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => { setActiveTab('import'); setStatus({ type: null, message: '' }); }}
            className={`flex-1 px-4 py-3 font-medium text-sm transition-colors ${
              activeTab === 'import'
                ? 'text-violet-600 border-b-2 border-violet-600 bg-violet-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <i className="fas fa-upload mr-2"></i>
            Import
          </button>
          <button
            onClick={() => { setActiveTab('export'); setStatus({ type: null, message: '' }); setExportText(''); }}
            className={`flex-1 px-4 py-3 font-medium text-sm transition-colors ${
              activeTab === 'export'
                ? 'text-violet-600 border-b-2 border-violet-600 bg-violet-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <i className="fas fa-download mr-2"></i>
            Export
          </button>
          <button
            onClick={() => { setActiveTab('manage'); setStatus({ type: null, message: '' }); }}
            className={`flex-1 px-4 py-3 font-medium text-sm transition-colors ${
              activeTab === 'manage'
                ? 'text-violet-600 border-b-2 border-violet-600 bg-violet-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <i className="fas fa-cog mr-2"></i>
            Kelola
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Status Message */}
          {status.type && (
            <div className={`mb-4 px-4 py-3 rounded-lg flex items-center gap-2 ${
              status.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              <i className={`fas ${status.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
              {status.message}
            </div>
          )}

          {/* Import Tab */}
          {activeTab === 'import' && (
            <div className="space-y-4">
              <div className="text-center border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-violet-400 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <i className="fas fa-file-upload text-4xl text-gray-400 mb-3"></i>
                <p className="text-gray-600 mb-1">Upload file data keluarga</p>
                <p className="text-xs text-gray-400 mb-3">Format: JSON, CSV, atau XLSX</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-violet-100 text-violet-600 rounded-lg hover:bg-violet-200 transition-colors font-medium"
                >
                  Pilih File
                </button>
                {importFileName && (
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-violet-50 text-violet-700 rounded-full text-sm">
                    <i className={`fas ${
                      importFileType === 'xlsx' ? 'fa-file-excel' :
                      importFileType === 'csv' ? 'fa-file-csv' : 'fa-file-code'
                    }`}></i>
                    {importFileName}
                  </div>
                )}
              </div>

              <div className="relative">
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center">
                  <div className="flex-1 border-t border-gray-200"></div>
                  <span className="px-3 text-sm text-gray-400 bg-white">atau</span>
                  <div className="flex-1 border-t border-gray-200"></div>
                </div>
              </div>

              <div className="mt-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paste JSON Data
                </label>
                <textarea
                  value={importFileType === 'xlsx' ? '' : importText}
                  onChange={(e) => {
                    setImportText(e.target.value);
                    setImportFileType(e.target.value.trim().startsWith('{') || e.target.value.trim().startsWith('[') ? 'json' : 'csv');
                    setImportFileName('');
                    setImportBinaryData(null);
                  }}
                  className="w-full h-48 px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent font-mono text-sm resize-none"
                  placeholder='{"id": "1", "name": "Nama Lengkap", ...}'
                />
              </div>

              <button
                onClick={handleImport}
                disabled={isLoading || !importText.trim()}
                className="w-full px-4 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Mengimpor...
                  </>
                ) : (
                  <>
                    <i className="fas fa-upload"></i>
                    Import Data
                  </>
                )}
              </button>

              {/* Format Info */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-700">
                  <i className="fas fa-info-circle mr-1"></i>
                  <strong>JSON:</strong> Format tree (hierarki bersarang). &nbsp;
                  <strong>CSV/XLSX:</strong> Format tabel datar dengan kolom: Nama, Jenis Kelamin, Generasi, Parent ID, dll.
                </p>
              </div>
            </div>
          )}

          {/* Export Tab */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              {/* Format Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Pilih format ekspor:</label>
                <div className="grid grid-cols-3 gap-3">
                  {formatButtons.map(({ format, icon, label, desc, activeClass }) => (
                    <button
                      key={format}
                      onClick={() => handleExport(format)}
                      disabled={isLoading}
                      className={`relative px-4 py-4 rounded-xl border-2 transition-all font-medium text-sm flex flex-col items-center gap-2 disabled:opacity-50 ${
                        exportFormat === format && exportText
                          ? activeClass
                          : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <i className={`fas ${icon} text-2xl`}></i>
                      {label}
                      <span className="text-[10px] text-gray-400">{desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {isLoading && (
                <div className="text-center py-6">
                  <i className="fas fa-spinner fa-spin text-3xl text-violet-500 mb-3"></i>
                  <p className="text-gray-500">Mempersiapkan data...</p>
                </div>
              )}

              {/* Preview & Download (for JSON and CSV) */}
              {!isLoading && exportText && (
                <>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-500 uppercase">
                        Preview {exportFormat.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-400">
                        {exportText.length.toLocaleString()} karakter
                      </span>
                    </div>
                    <pre className="text-xs text-gray-600 overflow-x-auto max-h-52 overflow-y-auto">
                      {exportText}
                    </pre>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleDownload}
                      className="flex-1 px-4 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <i className="fas fa-download"></i>
                      Download {exportFormat.toUpperCase()}
                    </button>
                    <button
                      onClick={handleCopyToClipboard}
                      className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <i className="fas fa-copy"></i>
                      Copy
                    </button>
                  </div>
                </>
              )}

              {!isLoading && !exportText && !status.type && (
                <div className="text-center py-6 text-gray-400">
                  <i className="fas fa-arrow-up text-2xl mb-2"></i>
                  <p className="text-sm">Pilih format di atas untuk mengekspor data</p>
                </div>
              )}
            </div>
          )}

          {/* Manage Tab */}
          {activeTab === 'manage' && (
            <div className="space-y-4">
              {/* Load Sample Data */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-users text-blue-600"></i>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900">Muat Data Contoh</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      Muat data silsilah keluarga contoh untuk melihat bagaimana aplikasi bekerja.
                    </p>
                    <button
                      onClick={handleLoadSampleData}
                      disabled={isLoading}
                      className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm disabled:opacity-50"
                    >
                      {isLoading ? 'Memuat...' : 'Muat Data Contoh'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Clear All Data */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-trash-alt text-red-600"></i>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-900">Hapus Semua Data</h3>
                    <p className="text-sm text-red-700 mt-1">
                      Hapus semua data silsilah keluarga. Tindakan ini tidak dapat dibatalkan!
                    </p>

                    {showClearConfirm ? (
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={handleClearAll}
                          disabled={isLoading}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm disabled:opacity-50"
                        >
                          {isLoading ? 'Menghapus...' : 'Ya, Hapus Semua'}
                        </button>
                        <button
                          onClick={() => setShowClearConfirm(false)}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowClearConfirm(true)}
                        className="mt-3 px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors font-medium text-sm"
                      >
                        Hapus Semua Data
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-info-circle text-gray-600"></i>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Tentang Penyimpanan</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Data disimpan di browser Anda menggunakan IndexedDB. Data akan tetap tersimpan
                      meskipun browser ditutup, namun akan hilang jika Anda menghapus data browser
                      atau menggunakan mode incognito.
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      <strong>Tips:</strong> Gunakan fitur Export untuk membuat backup data Anda secara berkala.
                      Anda dapat mengekspor ke JSON (hierarki), CSV (tabel), atau XLSX (Excel).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
