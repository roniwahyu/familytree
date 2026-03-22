import { useState, useEffect } from 'react';
import { ImageKitConfig, getImageKitConfig, saveImageKitConfig, clearImageKitConfig, uploadToImageKit } from '../utils/imagekit';

interface ImageKitSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ImageKitSettingsModal({ isOpen, onClose }: ImageKitSettingsModalProps) {
  const [config, setConfig] = useState<ImageKitConfig>({ publicKey: '', privateKey: '', urlEndpoint: '' });
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadConfig();
      setStatus({ type: null, message: '' });
    }
  }, [isOpen]);

  const loadConfig = async () => {
    const saved = await getImageKitConfig();
    if (saved) setConfig(saved);
  };

  const handleSave = async () => {
    if (!config.urlEndpoint.trim()) {
      setStatus({ type: 'error', message: 'URL Endpoint wajib diisi' });
      return;
    }
    setIsLoading(true);
    try {
      // Normalize URL endpoint - remove trailing slash
      const normalized = {
        ...config,
        urlEndpoint: config.urlEndpoint.replace(/\/+$/, ''),
      };
      await saveImageKitConfig(normalized);
      setConfig(normalized);
      setStatus({ type: 'success', message: 'Pengaturan ImageKit berhasil disimpan!' });
      setTimeout(() => onClose(), 1200);
    } catch {
      setStatus({ type: 'error', message: 'Gagal menyimpan pengaturan' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTest = async () => {
    if (!config.privateKey || !config.urlEndpoint) {
      setStatus({ type: 'error', message: 'Isi semua field terlebih dahulu untuk melakukan test' });
      return;
    }
    setIsTesting(true);
    setStatus({ type: null, message: '' });
    try {
      // Create a tiny test image (1x1 pixel PNG)
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b!), 'image/png')
      );
      const testFile = new File([blob], '_test_connection.png', { type: 'image/png' });

      const result = await uploadToImageKit(testFile, config, '/familytree/.test');
      if (result.url) {
        setStatus({ type: 'success', message: `Koneksi berhasil! Test upload: ${result.name}` });
      }
    } catch (error: any) {
      setStatus({ type: 'error', message: `Koneksi gagal: ${error?.message || 'Periksa kembali kredensial Anda'}` });
    } finally {
      setIsTesting(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
      await clearImageKitConfig();
      setConfig({ publicKey: '', privateKey: '', urlEndpoint: '' });
      setStatus({ type: 'success', message: 'ImageKit berhasil diputuskan' });
    } catch {
      setStatus({ type: 'error', message: 'Gagal memutuskan koneksi' });
    } finally {
      setIsLoading(false);
    }
  };

  const isConfigured = config.publicKey && config.privateKey && config.urlEndpoint;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <i className="fas fa-cloud-upload-alt"></i>
              Pengaturan ImageKit
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] space-y-4">
          {/* Status */}
          {status.type && (
            <div className={`px-4 py-3 rounded-lg flex items-center gap-2 ${
              status.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              <i className={`fas ${status.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
              <span className="text-sm">{status.message}</span>
            </div>
          )}

          {/* Connection status badge */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
            isConfigured ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'
          }`}>
            <div className={`w-2.5 h-2.5 rounded-full ${isConfigured ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            {isConfigured ? 'Terhubung ke ImageKit' : 'Belum terhubung'}
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-700">
              <i className="fas fa-info-circle mr-1"></i>
              ImageKit.io digunakan untuk menyimpan dan mengelola foto anggota keluarga.
              Kredensial disimpan secara lokal di browser Anda dan hanya digunakan untuk berkomunikasi langsung dengan ImageKit.
            </p>
          </div>

          {/* URL Endpoint */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL Endpoint <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={config.urlEndpoint}
              onChange={(e) => setConfig({ ...config, urlEndpoint: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm"
              placeholder="https://ik.imagekit.io/your_id"
            />
            <p className="text-xs text-gray-400 mt-1">Contoh: https://ik.imagekit.io/your_imagekit_id</p>
          </div>

          {/* Public Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Public Key <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={config.publicKey}
              onChange={(e) => setConfig({ ...config, publicKey: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm font-mono"
              placeholder="public_..."
            />
          </div>

          {/* Private Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Private Key <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPrivateKey ? 'text' : 'password'}
                value={config.privateKey}
                onChange={(e) => setConfig({ ...config, privateKey: e.target.value })}
                className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm font-mono"
                placeholder="private_..."
              />
              <button
                type="button"
                onClick={() => setShowPrivateKey(!showPrivateKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <i className={`fas ${showPrivateKey ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              <i className="fas fa-lock mr-1"></i>
              Tersimpan lokal, tidak dikirim ke server manapun selain ImageKit
            </p>
          </div>

          {/* Test Connection */}
          <button
            type="button"
            onClick={handleTest}
            disabled={isTesting || !config.privateKey || !config.urlEndpoint}
            className="w-full px-4 py-2.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isTesting ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Menguji koneksi...
              </>
            ) : (
              <>
                <i className="fas fa-plug"></i>
                Test Koneksi
              </>
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t flex gap-3">
          {isConfigured && (
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={isLoading}
              className="px-4 py-2.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors font-medium text-sm disabled:opacity-50"
            >
              <i className="fas fa-unlink mr-1"></i>
              Putuskan
            </button>
          )}
          <div className="flex-1"></div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isLoading}
            className="px-5 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium text-sm disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : (
              <i className="fas fa-save"></i>
            )}
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}
