import React, { useState, useRef } from 'react';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: any) => Promise<void>;
  onExport: () => Promise<any>;
  onClearAll: () => Promise<void>;
  onLoadSampleData: () => Promise<void>;
}

export default function ImportExportModal({
  isOpen,
  onClose,
  onImport,
  onExport,
  onClearAll,
  onLoadSampleData
}: ImportExportModalProps) {
  const [activeTab, setActiveTab] = useState<'import' | 'export' | 'manage'>('import');
  const [importText, setImportText] = useState('');
  const [exportText, setExportText] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setImportText(text);
      setStatus({ type: null, message: '' });
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!importText.trim()) {
      setStatus({ type: 'error', message: 'Tidak ada data untuk diimpor' });
      return;
    }

    setIsLoading(true);
    try {
      const data = JSON.parse(importText);
      await onImport(data);
      setStatus({ type: 'success', message: 'Data berhasil diimpor!' });
      setImportText('');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      setStatus({ type: 'error', message: 'Format JSON tidak valid. Pastikan data sesuai format.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    setIsLoading(true);
    try {
      const data = await onExport();
      if (!data) {
        setStatus({ type: 'error', message: 'Tidak ada data untuk diekspor' });
        return;
      }
      const jsonStr = JSON.stringify(data, null, 2);
      setExportText(jsonStr);
      setStatus({ type: 'success', message: 'Data berhasil diekspor!' });
    } catch (error) {
      setStatus({ type: 'error', message: 'Gagal mengekspor data' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!exportText) return;

    const blob = new Blob([exportText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `silsilah-keluarga-${new Date().toISOString().split('T')[0]}.json`;
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
      setTimeout(() => {
        onClose();
      }, 1500);
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
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      setStatus({ type: 'error', message: 'Gagal memuat data contoh' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

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
            onClick={() => { setActiveTab('export'); setStatus({ type: null, message: '' }); handleExport(); }}
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
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <i className="fas fa-file-upload text-4xl text-gray-400 mb-3"></i>
                <p className="text-gray-600 mb-2">Upload file JSON</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-violet-100 text-violet-600 rounded-lg hover:bg-violet-200 transition-colors font-medium"
                >
                  Pilih File
                </button>
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
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
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
            </div>
          )}

          {/* Export Tab */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8">
                  <i className="fas fa-spinner fa-spin text-3xl text-violet-500 mb-3"></i>
                  <p className="text-gray-500">Mempersiapkan data...</p>
                </div>
              ) : exportText ? (
                <>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <pre className="text-xs text-gray-600 overflow-x-auto max-h-64 overflow-y-auto">
                      {exportText}
                    </pre>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleDownload}
                      className="flex-1 px-4 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <i className="fas fa-download"></i>
                      Download JSON
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
              ) : (
                <div className="text-center py-8">
                  <i className="fas fa-inbox text-4xl text-gray-300 mb-3"></i>
                  <p className="text-gray-500">Tidak ada data untuk diekspor</p>
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
