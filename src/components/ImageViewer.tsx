import { useEffect, useRef, useState } from 'react';
import { ImageKitConfig, uploadToImageKit } from '../utils/imagekit';
import ImageCropper from './ImageCropper';

interface ImageViewerProps {
  isOpen: boolean;
  imageUrl: string;
  altText: string;
  onClose: () => void;
  onImageUpdate?: (newUrl: string) => void;
  imageKitConfig?: ImageKitConfig | null;
  memberId?: string;
}

export default function ImageViewer({ 
  isOpen, 
  imageUrl, 
  altText, 
  onClose,
  onImageUpdate,
  imageKitConfig,
  memberId
}: ImageViewerProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [showCropper, setShowCropper] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [originalFileSize, setOriginalFileSize] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !showCropper) onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, showCropper, onClose]);

  const handleFileSelect = (file: File) => {
    // Validate file
    if (!file.type.startsWith('image/')) {
      setUploadError('File harus berupa gambar');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Ukuran file maksimal 10MB');
      return;
    }

    // Store original file size
    setOriginalFileSize(file.size);

    // Read file and show cropper
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!imageKitConfig || !onImageUpdate) return;

    setShowCropper(false);
    setUploading(true);
    setUploadError('');

    try {
      // Convert blob to file
      const file = new File([croppedBlob], 'photo.jpg', { type: 'image/jpeg' });
      const result = await uploadToImageKit(file, imageKitConfig, '/familytree/photos');
      onImageUpdate(result.url);
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error: any) {
      setUploadError(error?.message || 'Gagal mengupload foto');
      setShowCropper(false);
    } finally {
      setUploading(false);
      setSelectedImage(null);
    }
  };

  if (!isOpen) return null;

  const hasImageKit = !!imageKitConfig;
  const canEdit = hasImageKit && onImageUpdate && memberId;

  // Show cropper if image is selected
  if (showCropper && selectedImage) {
    return (
      <ImageCropper
        image={selectedImage}
        onCropComplete={handleCropComplete}
        onCancel={() => {
          setShowCropper(false);
          setSelectedImage(null);
          setOriginalFileSize(0);
        }}
        aspectRatio={1}
        shape="round"
        originalSize={originalFileSize}
      />
    );
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
          e.target.value = '';
        }}
      />

      <div className="absolute top-4 right-4 flex items-center gap-2">
        {canEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            disabled={uploading}
            className="w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition-all disabled:opacity-50"
            title="Ganti foto"
          >
            {uploading ? (
              <i className="fas fa-spinner fa-spin text-xl"></i>
            ) : (
              <i className="fas fa-upload text-xl"></i>
            )}
          </button>
        )}
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
        >
          <i className="fas fa-times text-xl"></i>
        </button>
      </div>

      <div 
        className="relative max-w-4xl max-h-[90vh] p-4"
        onClick={(e) => e.stopPropagation()}
      >
        {uploadError && (
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-red-500 text-white rounded-lg text-sm mb-2 flex items-center gap-2">
            <i className="fas fa-exclamation-circle"></i>
            {uploadError}
            <button onClick={() => setUploadError('')}>
              <i className="fas fa-times"></i>
            </button>
          </div>
        )}

        {uploading && (
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm flex items-center gap-2">
            <i className="fas fa-spinner fa-spin"></i>
            Mengupload foto ke ImageKit...
          </div>
        )}

        <img
          src={imageUrl}
          alt={altText}
          className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
        />
        <p className="text-white text-center mt-4 text-sm">{altText}</p>
      </div>
    </div>
  );
}
