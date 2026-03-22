import React, { useState, useEffect, useRef } from 'react';
import { FamilyMemberDB } from '../db/database';
import { ImageKitConfig, uploadToImageKit } from '../utils/imagekit';

interface MemberFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (member: Partial<FamilyMemberDB>) => void;
  onDelete?: () => void;
  member?: FamilyMemberDB | null;
  parentId?: string | null;
  parentName?: string;
  mode: 'add' | 'edit' | 'addChild';
  nextGeneration?: number;
  imageKitConfig?: ImageKitConfig | null;
}

const avatarOptions = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=man1',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=man2',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=man3',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=woman1',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=woman2',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=woman3',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=elder1',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=elder2',
];

export default function MemberFormModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  member,
  parentId,
  parentName,
  mode,
  nextGeneration = 1,
  imageKitConfig
}: MemberFormModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    gender: 'L' as 'L' | 'P',
    dob: '',
    job: '',
    address: '',
    phone: '',
    photo: avatarOptions[0],
    spouseName: '',
    spousePhoto: ''
  });
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showSpouseAvatarPicker, setShowSpouseAvatarPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [uploading, setUploading] = useState<'member' | 'spouse' | null>(null);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const spouseFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (member && (mode === 'edit')) {
      setFormData({
        name: member.name,
        gender: member.gender,
        dob: member.dob,
        job: member.job,
        address: member.address,
        phone: member.phone,
        photo: member.photo || avatarOptions[0],
        spouseName: member.spouseName || '',
        spousePhoto: member.spousePhoto || ''
      });
    } else {
      setFormData({
        name: '',
        gender: 'L',
        dob: '',
        job: '',
        address: '',
        phone: '',
        photo: avatarOptions[0],
        spouseName: '',
        spousePhoto: ''
      });
    }
    setShowDeleteConfirm(false);
    setUploadError('');
  }, [member, mode, isOpen]);

  const handleFileUpload = async (file: File, target: 'member' | 'spouse') => {
    if (!imageKitConfig) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      setUploadError('File harus berupa gambar');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Ukuran file maksimal 10MB');
      return;
    }

    setUploading(target);
    setUploadError('');

    try {
      const result = await uploadToImageKit(file, imageKitConfig, '/familytree/photos');
      if (target === 'member') {
        setFormData(prev => ({ ...prev, photo: result.url }));
        setShowAvatarPicker(false);
      } else {
        setFormData(prev => ({ ...prev, spousePhoto: result.url }));
        setShowSpouseAvatarPicker(false);
      }
    } catch (error: any) {
      setUploadError(error?.message || 'Gagal mengupload foto');
    } finally {
      setUploading(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const memberData: Partial<FamilyMemberDB> = {
      name: formData.name,
      gender: formData.gender,
      dob: formData.dob,
      job: formData.job,
      address: formData.address,
      phone: formData.phone,
      photo: formData.photo,
      spouseName: formData.spouseName || undefined,
      spousePhoto: formData.spousePhoto || undefined,
    };

    if (mode === 'addChild' || mode === 'add') {
      memberData.parentId = parentId || null;
      memberData.generation = nextGeneration;
    }

    onSave(memberData);
  };

  if (!isOpen) return null;

  const title = mode === 'edit'
    ? 'Edit Anggota Keluarga'
    : mode === 'addChild'
      ? `Tambah Anak dari ${parentName}`
      : 'Tambah Anggota Keluarga';

  const hasImageKit = !!imageKitConfig;

  const renderUploadButton = (target: 'member' | 'spouse') => {
    if (!hasImageKit) return null;
    const isUploading = uploading === target;
    const inputRef = target === 'member' ? fileInputRef : spouseFileInputRef;
    const size = target === 'member' ? 'w-8 h-8' : 'w-6 h-6';
    const iconSize = target === 'member' ? 'text-sm' : 'text-xs';
    const bgColor = target === 'member' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-blue-500 hover:bg-blue-600';
    const position = target === 'member' ? 'absolute bottom-0 left-0' : 'absolute bottom-0 left-0';

    return (
      <>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file, target);
            e.target.value = '';
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className={`${position} ${size} ${bgColor} text-white rounded-full flex items-center justify-center transition-colors disabled:opacity-50`}
          title="Upload foto"
        >
          {isUploading ? (
            <i className={`fas fa-spinner fa-spin ${iconSize}`}></i>
          ) : (
            <i className={`fas fa-upload ${iconSize}`}></i>
          )}
        </button>
      </>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">{title}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="space-y-4">
            {/* Upload Error */}
            {uploadError && (
              <div className="px-3 py-2 bg-red-50 text-red-600 rounded-lg text-xs flex items-center gap-2">
                <i className="fas fa-exclamation-circle"></i>
                {uploadError}
                <button type="button" onClick={() => setUploadError('')} className="ml-auto">
                  <i className="fas fa-times"></i>
                </button>
              </div>
            )}

            {/* Photo */}
            <div className="flex justify-center">
              <div className="relative">
                <img
                  src={formData.photo}
                  alt="Avatar"
                  className="w-24 h-24 rounded-full border-4 border-emerald-200 object-cover"
                />
                {/* Avatar picker toggle */}
                <button
                  type="button"
                  onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                  className="absolute bottom-0 right-0 w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center hover:bg-emerald-600 transition-colors"
                >
                  <i className="fas fa-camera text-sm"></i>
                </button>
                {/* Upload button */}
                {renderUploadButton('member')}
              </div>
            </div>

            {/* Uploading indicator */}
            {uploading === 'member' && (
              <div className="text-center text-xs text-blue-600">
                <i className="fas fa-spinner fa-spin mr-1"></i>
                Mengupload foto ke ImageKit...
              </div>
            )}

            {/* Avatar Picker */}
            {showAvatarPicker && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-2">Pilih Avatar:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {avatarOptions.map((avatar, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, photo: avatar });
                        setShowAvatarPicker(false);
                      }}
                      className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all ${
                        formData.photo === avatar ? 'border-emerald-500 scale-110' : 'border-gray-200 hover:border-emerald-300'
                      }`}
                    >
                      <img src={avatar} alt={`Avatar ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>

                {/* Upload from file */}
                {hasImageKit && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading === 'member'}
                      className="w-full px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-xs font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {uploading === 'member' ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i>
                          Mengupload...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-cloud-upload-alt"></i>
                          Upload Foto dari Perangkat
                        </>
                      )}
                    </button>
                  </div>
                )}

                <div className="mt-2">
                  <input
                    type="text"
                    placeholder="Atau masukkan URL foto..."
                    value={formData.photo}
                    onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                {/* ImageKit hint */}
                {!hasImageKit && (
                  <p className="text-[10px] text-gray-400 mt-2 text-center">
                    <i className="fas fa-info-circle mr-1"></i>
                    Hubungkan ImageKit di Pengaturan untuk upload foto dari perangkat
                  </p>
                )}
              </div>
            )}

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                placeholder="Masukkan nama lengkap"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jenis Kelamin <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 cursor-pointer transition-all ${
                  formData.gender === 'L' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-blue-200'
                }`}>
                  <input
                    type="radio"
                    name="gender"
                    value="L"
                    checked={formData.gender === 'L'}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'L' | 'P' })}
                    className="sr-only"
                  />
                  <i className="fas fa-mars"></i>
                  <span className="font-medium">Laki-laki</span>
                </label>
                <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 cursor-pointer transition-all ${
                  formData.gender === 'P' ? 'border-pink-500 bg-pink-50 text-pink-700' : 'border-gray-200 hover:border-pink-200'
                }`}>
                  <input
                    type="radio"
                    name="gender"
                    value="P"
                    checked={formData.gender === 'P'}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'L' | 'P' })}
                    className="sr-only"
                  />
                  <i className="fas fa-venus"></i>
                  <span className="font-medium">Perempuan</span>
                </label>
              </div>
            </div>

            {/* DOB */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tempat, Tanggal Lahir
              </label>
              <input
                type="text"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                placeholder="Contoh: Jakarta, 17 Agustus 1980"
              />
            </div>

            {/* Job */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pekerjaan
              </label>
              <input
                type="text"
                value={formData.job}
                onChange={(e) => setFormData({ ...formData, job: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                placeholder="Contoh: Dokter, Guru, Wiraswasta"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alamat
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
                rows={2}
                placeholder="Masukkan alamat lengkap"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nomor Telepon
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                placeholder="Contoh: 08123456789"
              />
            </div>

            {/* Spouse Section */}
            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <i className="fas fa-heart text-pink-500"></i>
                Data Pasangan (Opsional)
              </h3>

              <div className="space-y-3">
                {/* Spouse Photo */}
                {formData.spouseName && (
                  <div className="flex justify-center">
                    <div className="relative">
                      <img
                        src={formData.spousePhoto || avatarOptions[0]}
                        alt="Spouse Avatar"
                        className="w-16 h-16 rounded-full border-2 border-pink-200 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSpouseAvatarPicker(!showSpouseAvatarPicker)}
                        className="absolute bottom-0 right-0 w-6 h-6 bg-pink-500 text-white rounded-full flex items-center justify-center hover:bg-pink-600 transition-colors"
                      >
                        <i className="fas fa-camera text-xs"></i>
                      </button>
                      {renderUploadButton('spouse')}
                    </div>
                  </div>
                )}

                {/* Uploading indicator for spouse */}
                {uploading === 'spouse' && (
                  <div className="text-center text-xs text-blue-600">
                    <i className="fas fa-spinner fa-spin mr-1"></i>
                    Mengupload foto pasangan ke ImageKit...
                  </div>
                )}

                {/* Spouse Avatar Picker */}
                {showSpouseAvatarPicker && (
                  <div className="bg-pink-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-2">Pilih Avatar Pasangan:</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {avatarOptions.map((avatar, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, spousePhoto: avatar });
                            setShowSpouseAvatarPicker(false);
                          }}
                          className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all ${
                            formData.spousePhoto === avatar ? 'border-pink-500 scale-110' : 'border-gray-200 hover:border-pink-300'
                          }`}
                        >
                          <img src={avatar} alt={`Avatar ${index + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>

                    {/* Upload from file for spouse */}
                    {hasImageKit && (
                      <div className="mt-3 pt-3 border-t border-pink-200">
                        <button
                          type="button"
                          onClick={() => spouseFileInputRef.current?.click()}
                          disabled={uploading === 'spouse'}
                          className="w-full px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-xs font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {uploading === 'spouse' ? (
                            <>
                              <i className="fas fa-spinner fa-spin"></i>
                              Mengupload...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-cloud-upload-alt"></i>
                              Upload Foto Pasangan
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* URL input for spouse photo */}
                    <div className="mt-2">
                      <input
                        type="text"
                        placeholder="Atau masukkan URL foto pasangan..."
                        value={formData.spousePhoto}
                        onChange={(e) => setFormData({ ...formData, spousePhoto: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}

                {/* Spouse Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Pasangan
                  </label>
                  <input
                    type="text"
                    value={formData.spouseName}
                    onChange={(e) => setFormData({ ...formData, spouseName: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                    placeholder="Masukkan nama pasangan"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Delete Confirmation */}
          {showDeleteConfirm && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 mb-3">
                <i className="fas fa-exclamation-triangle mr-2"></i>
                Apakah Anda yakin ingin menghapus <strong>{member?.name}</strong> dan semua keturunannya? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onDelete?.();
                    onClose();
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  Ya, Hapus
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                >
                  Batal
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t flex gap-3">
          {mode === 'edit' && onDelete && !showDeleteConfirm && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors font-medium"
            >
              <i className="fas fa-trash mr-2"></i>
              Hapus
            </button>
          )}
          <div className="flex-1"></div>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Batal
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
          >
            <i className="fas fa-save mr-2"></i>
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}
