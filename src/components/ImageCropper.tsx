import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Area } from 'react-easy-crop';
import { compressImage, formatFileSize } from '../utils/imageCompression';

interface ImageCropperProps {
  image: string;
  onCropComplete: (croppedImage: Blob) => void;
  onCancel: () => void;
  aspectRatio?: number;
  shape?: 'rect' | 'round';
  originalSize?: number;
}

export default function ImageCropper({
  image,
  onCropComplete,
  onCancel,
  aspectRatio = 1,
  shape = 'round',
  originalSize
}: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);
  const [compressionQuality, setCompressionQuality] = useState(85);

  const onCropChange = (location: { x: number; y: number }) => {
    setCrop(location);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onCropAreaComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area
  ): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    // Set canvas size to cropped area
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // Draw the cropped image with high quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    // Convert to blob
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas is empty'));
        }
      }, 'image/jpeg', compressionQuality / 100);
    });
  };

  const handleSave = async () => {
    if (!croppedAreaPixels) return;

    setProcessing(true);
    try {
      const croppedImage = await getCroppedImg(image, croppedAreaPixels);
      
      // Compress if needed (max 1200x1200)
      const compressed = await compressImage(croppedImage, 1200, 1200, compressionQuality / 100);
      
      onCropComplete(compressed);
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 text-white px-4 py-3 flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Atur Foto</h3>
          {originalSize && (
            <p className="text-xs text-gray-400 mt-0.5">
              Ukuran asli: {formatFileSize(originalSize)}
            </p>
          )}
        </div>
        <button
          onClick={onCancel}
          className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>

      {/* Cropper Area */}
      <div className="flex-1 relative">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={aspectRatio}
          cropShape={shape}
          showGrid={false}
          onCropChange={onCropChange}
          onZoomChange={onZoomChange}
          onCropComplete={onCropAreaComplete}
        />
      </div>

      {/* Controls */}
      <div className="bg-gray-900 text-white px-4 py-4 space-y-4">
        {/* Zoom Slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-gray-300">Zoom</label>
            <span className="text-sm text-gray-400">{Math.round(zoom * 100)}%</span>
          </div>
          <div className="flex items-center gap-3">
            <i className="fas fa-search-minus text-gray-400"></i>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
            <i className="fas fa-search-plus text-gray-400"></i>
          </div>
        </div>

        {/* Quality Slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-gray-300">Kualitas</label>
            <span className="text-sm text-gray-400">{compressionQuality}%</span>
          </div>
          <div className="flex items-center gap-3">
            <i className="fas fa-compress text-gray-400"></i>
            <input
              type="range"
              min={60}
              max={100}
              step={5}
              value={compressionQuality}
              onChange={(e) => setCompressionQuality(Number(e.target.value))}
              className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
            <i className="fas fa-star text-gray-400"></i>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {compressionQuality >= 90 ? 'Kualitas tinggi (ukuran besar)' : 
             compressionQuality >= 75 ? 'Kualitas baik (ukuran sedang)' : 
             'Kualitas standar (ukuran kecil)'}
          </p>
        </div>

        {/* Info */}
        <div className="text-xs text-gray-400 text-center space-y-1">
          <div>
            <i className="fas fa-hand-pointer mr-1"></i>
            Geser untuk mengatur posisi
          </div>
          <div>
            <i className="fas fa-sliders-h mr-1"></i>
            Gunakan slider untuk zoom dan kualitas
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={processing}
            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Memproses...
              </>
            ) : (
              <>
                <i className="fas fa-check mr-2"></i>
                Simpan
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
        }
        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
}
