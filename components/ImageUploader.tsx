import React, { useRef } from 'react';
import { ImageFile } from '../types';

interface ImageUploaderProps {
  label: string;
  image: ImageFile | null;
  onImageSelected: (file: File) => void;
  onClear: () => void;
  placeholderText?: string;
  icon?: React.ReactNode;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  label,
  image,
  onImageSelected,
  onClear,
  placeholderText = "Upload an image",
  icon
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageSelected(e.target.files[0]);
    }
  };

  const triggerUpload = () => {
    inputRef.current?.click();
  };

  return (
    <div className="flex flex-col w-full">
      <label className="mb-2 text-sm font-bold text-stone-700 tracking-wider uppercase">{label}</label>
      
      {!image ? (
        <div 
          onClick={triggerUpload}
          className="group relative flex flex-col items-center justify-center w-full h-80 border-2 border-dashed border-stone-300 rounded-xl bg-stone-50 hover:bg-rose-50 hover:border-rose-300 transition-all duration-300 cursor-pointer overflow-hidden"
        >
          <div className="flex flex-col items-center justify-center p-6 text-center z-10">
            <div className="p-4 mb-4 rounded-full bg-stone-100 group-hover:bg-white group-hover:shadow-md transition-all duration-300 text-stone-400 group-hover:text-rose-500">
               {icon || (
                 <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                 </svg>
               )}
            </div>
            <p className="text-sm font-medium text-stone-600 group-hover:text-rose-700">{placeholderText}</p>
            <p className="mt-1 text-xs text-stone-400">JPG, PNG up to 10MB</p>
          </div>
          <input 
            ref={inputRef}
            type="file" 
            className="hidden" 
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>
      ) : (
        <div className="relative w-full h-80 rounded-xl overflow-hidden shadow-lg border border-stone-200 group">
          <img 
            src={image.previewUrl} 
            alt={label} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
          <button
            onClick={onClear}
            className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm text-rose-600 hover:bg-rose-600 hover:text-white transition-all duration-200 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0"
            title="Remove image"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};