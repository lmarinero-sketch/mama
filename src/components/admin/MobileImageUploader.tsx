import React, { useRef, useState } from 'react';
import { Camera, Image as ImageIcon, Upload, Trash2, CheckCircle2, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface MobileImageUploaderProps {
  currentImageUrl?: string;
  onImageUploaded: (url: string) => void;
  label?: string;
}

export const MobileImageUploader: React.FC<MobileImageUploaderProps> = ({
  currentImageUrl,
  onImageUploaded,
  label = "Imagen del producto / banner",
}) => {
  const { uploadImageToStorage } = useApp();
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string>(currentImageUrl || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const publicUrl = await uploadImageToStorage(file);
      if (publicUrl) {
        setPreview(publicUrl);
        onImageUploaded(publicUrl);
      }
    } catch (err) {
      console.error('Error uploading image', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview('');
    onImageUploaded('');
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold text-slate-700">{label}</label>

      {preview ? (
        <div className="relative rounded-2xl overflow-hidden border border-rose-200 bg-slate-900/5 h-36 group">
          <img src={preview} alt="Vista previa" className="w-full h-full object-cover" />
          
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-xl bg-white text-slate-800 font-bold text-xs shadow-md flex items-center gap-1 active:scale-95"
            >
              <Camera className="w-4 h-4 text-deli-600" />
              <span>Cambiar</span>
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="p-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs shadow-md flex items-center gap-1 active:scale-95"
            >
              <Trash2 className="w-4 h-4" />
              <span>Quitar</span>
            </button>
          </div>

          <div className="absolute bottom-2 left-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
            <CheckCircle2 className="w-3 h-3" />
            <span>Imagen lista</span>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-rose-200 hover:border-deli-500 rounded-2xl p-4 text-center cursor-pointer bg-cream-50 hover:bg-rose-50/50 transition-all flex flex-col items-center justify-center gap-2"
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2 py-2">
              <Loader2 className="w-6 h-6 text-deli-600 animate-spin" />
              <span className="text-xs font-bold text-deli-700">Subiendo a Supabase Storage...</span>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-deli-600 flex items-center justify-center">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">
                  Tomar foto o elegir de la galería
                </p>
                <p className="text-[10px] text-slate-400">JPG, PNG o WEBP (Sube a Supabase)</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};
