import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Trash2 } from 'lucide-react';

interface SequenceFaceProps {
  volume: number;
}

export const SequenceFace: React.FC<SequenceFaceProps> = ({ volume }) => {
  const [images, setImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;

    const newImages: string[] = [];
    let loadedCount = 0;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          newImages.push(event.target.result as string);
        }
        loadedCount++;
        if (loadedCount === files.length) {
          setImages((prev) => [...prev, ...newImages]);
        }
      };
      reader.readAsDataURL(file);
    });
    
    // Reset input so the same files can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center border-2 border-dashed border-gray-600 rounded-xl bg-gray-800/50">
        <ImageIcon className="w-16 h-16 mb-4 text-gray-400" />
        <h3 className="mb-2 text-xl font-semibold text-white">Upload Image Sequence</h3>
        <p className="mb-6 text-sm text-gray-400 max-w-md">
          Upload multiple images of your character with different mouth shapes. 
          The app will switch between them based on how loud you speak!
          <br/><br/>
          <strong>Tip:</strong> Upload them in order from "Quiet/Closed Mouth" to "Loud/Wide Open".
        </p>
        
        <input 
          type="file" 
          accept="image/*" 
          multiple
          className="hidden" 
          ref={fileInputRef}
          onChange={handleImageUpload}
        />
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center px-4 py-2 font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <Upload className="w-4 h-4 mr-2" />
          Select Multiple Images
        </button>
      </div>
    );
  }

  // Calculate which image to show based on volume
  // volume is typically between 0 and 1
  // We map the volume to an index in the images array
  // Add a slight boost to volume so it reaches the max frame easier
  const boostedVolume = Math.min(volume * 1.5, 1);
  const activeIndex = Math.min(
    Math.floor(boostedVolume * images.length),
    images.length - 1
  );

  return (
    <div className="relative flex flex-col items-center w-full h-full">
      {/* Controls */}
      <div className="absolute top-0 right-0 z-20 flex flex-col gap-2 p-4 items-end">
        <div className="flex gap-2">
          <input 
            type="file" 
            accept="image/*" 
            multiple
            className="hidden" 
            ref={fileInputRef}
            onChange={handleImageUpload}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-500 shadow-lg"
          >
            Add More Frames
          </button>
          <button 
            onClick={() => setImages([])}
            className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-500 shadow-lg"
          >
            Clear All
          </button>
        </div>
        
        {/* Frame list thumbnail preview */}
        <div className="flex flex-col gap-1 mt-2 max-h-[400px] overflow-y-auto p-2 bg-gray-900/80 backdrop-blur rounded-lg border border-gray-700">
          <div className="text-[10px] text-gray-400 uppercase font-bold mb-1 text-center">Frames (Quiet → Loud)</div>
          {images.map((img, idx) => (
            <div 
              key={idx} 
              className={`relative group w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${
                idx === activeIndex ? 'border-pink-500 scale-110 z-10 shadow-lg shadow-pink-500/50' : 'border-transparent opacity-50'
              }`}
            >
              <img src={img} alt={`Frame ${idx}`} className="w-full h-full object-cover" />
              <button 
                onClick={() => removeImage(idx)}
                className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[9px] text-center text-white font-mono">
                {idx + 1}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* The Face Container */}
      <div className="relative w-full max-w-2xl aspect-square mt-4 overflow-hidden rounded-2xl bg-black/40 flex items-center justify-center shadow-2xl border border-gray-800">
        {images.map((img, idx) => (
          <img 
            key={idx}
            src={img} 
            alt={`Robot Face Frame ${idx}`} 
            className={`absolute inset-0 object-contain w-full h-full transition-opacity duration-75 ${
              idx === activeIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
