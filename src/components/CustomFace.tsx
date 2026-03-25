import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';

interface CustomFaceProps {
  volume: number;
}

export const CustomFace: React.FC<CustomFaceProps> = ({ volume }) => {
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [jawImage, setJawImage] = useState<string | null>(null);
  
  const baseInputRef = useRef<HTMLInputElement>(null);
  const jawInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setImage: React.Dispatch<React.SetStateAction<string | null>>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const jawDrop = volume * 30; // Max 30px drop for custom jaw

  if (!baseImage) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center border-2 border-dashed border-gray-600 rounded-xl bg-gray-800/50">
        <ImageIcon className="w-16 h-16 mb-4 text-gray-400" />
        <h3 className="mb-2 text-xl font-semibold text-white">Upload Custom Illustration</h3>
        <p className="mb-6 text-sm text-gray-400 max-w-md">
          For the best effect, upload a base face (without the lower jaw) and a separate jaw image with a transparent background.
        </p>
        
        <input 
          type="file" 
          accept="image/*" 
          className="hidden" 
          ref={baseInputRef}
          onChange={(e) => handleImageUpload(e, setBaseImage)}
        />
        <button 
          onClick={() => baseInputRef.current?.click()}
          className="flex items-center px-4 py-2 font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Base Face Image
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center w-full h-full">
      {/* Controls for re-uploading */}
      <div className="absolute top-0 right-0 z-20 flex gap-2 p-4">
        <input 
          type="file" 
          accept="image/*" 
          className="hidden" 
          ref={baseInputRef}
          onChange={(e) => handleImageUpload(e, setBaseImage)}
        />
        <button 
          onClick={() => baseInputRef.current?.click()}
          className="px-3 py-1 text-xs font-medium text-white bg-gray-700 rounded hover:bg-gray-600"
        >
          Change Base
        </button>

        <input 
          type="file" 
          accept="image/*" 
          className="hidden" 
          ref={jawInputRef}
          onChange={(e) => handleImageUpload(e, setJawImage)}
        />
        <button 
          onClick={() => jawInputRef.current?.click()}
          className="px-3 py-1 text-xs font-medium text-white bg-gray-700 rounded hover:bg-gray-600"
        >
          {jawImage ? 'Change Jaw' : 'Upload Jaw'}
        </button>
      </div>

      {/* The Face Container */}
      <div className="relative w-full max-w-md aspect-square mt-12 overflow-hidden rounded-xl bg-black/20 flex items-center justify-center">
        {/* Base Image */}
        <img 
          src={baseImage} 
          alt="Base Face" 
          className="absolute inset-0 object-contain w-full h-full z-0"
        />
        
        {/* Jaw Image */}
        {jawImage && (
          <img 
            src={jawImage} 
            alt="Animated Jaw" 
            className="absolute inset-0 object-contain w-full h-full z-10"
            style={{ 
              transform: `translateY(${jawDrop}px)`,
              transition: 'transform 0.05s ease-out'
            }}
          />
        )}
        
        {!jawImage && (
          <div className="absolute bottom-4 left-0 right-0 text-center z-20">
            <p className="text-sm text-yellow-400 bg-black/50 inline-block px-3 py-1 rounded-full">
              Upload a separate jaw image to see animation!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
