import { useRef } from 'react';
import { Upload, Check } from 'lucide-react';

export const PRESET_IMAGES = [
  'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/954973baa_image.png',
  'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/e2a83fded_image.png',
  'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/6138ff867_image.png',
  'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/7499fd7e7_image.png',
  'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/151ed9c82_image.png',
  'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/80cf906e8_image.png',
  'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/fb6555f67_image.png',
  // Example split background images
  'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/e8cb3e56c_image.png',
  'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/a9ff09fcf_image.png',
  'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/5e854ea52_image.png',
  'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/831e29602_image.png',
  'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/a45a6aa20_image.png',
  // User-uploaded images
  'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/039ef34f8_image.png',
  'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/d5760e7c6_image.png',
  'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/71974cf18_image.png',
  'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/c2e8728fc_image.png',
];

export default function BackgroundImagePicker({ selectedImage, onSelect, onUpload, uploading }) {
  const fileInputRef = useRef(null);
  const isCustom = selectedImage && !PRESET_IMAGES.includes(selectedImage);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
    e.target.value = '';
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        {PRESET_IMAGES.map((url) => (
          <button
            key={url}
            onClick={() => onSelect(url)}
            className={`relative rounded-2xl overflow-hidden h-32 transition-all duration-150 active:scale-95 ${
              selectedImage === url ? 'ring-4 ring-blue-500 ring-offset-2' : 'ring-1 ring-border'
            }`}
          >
            <img src={url} alt="" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
            {selectedImage === url && (
              <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center shadow-lg z-10">
                <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
              </div>
            )}
          </button>
        ))}

        {/* Upload tile */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className={`relative rounded-2xl overflow-hidden h-32 flex flex-col items-center justify-center gap-2 transition-all duration-150 active:scale-95 ${
            isCustom ? 'ring-4 ring-blue-500 ring-offset-2' : 'ring-1 ring-border bg-muted/50'
          }`}
        >
          {isCustom ? (
            <>
              <img src={selectedImage} alt="" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
              <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center shadow-lg z-10">
                <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
              </div>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center">
                {uploading ? (
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Upload className="w-5 h-5 text-blue-500" />
                )}
              </div>
              <span className="text-xs font-semibold text-muted-foreground">{uploading ? 'Uploading…' : 'Upload'}</span>
            </>
          )}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}