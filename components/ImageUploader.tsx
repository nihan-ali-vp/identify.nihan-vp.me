
import React, { useState, useCallback } from 'react';
import ImageIcon from './icons/ImageIcon';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  imageUrl: string | null;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, imageUrl }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageUpload(e.target.files[0]);
    }
  };

  const handleDragEvents = useCallback((e: React.DragEvent<HTMLLabelElement>, dragging: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(dragging);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    handleDragEvents(e, false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        if(e.dataTransfer.files[0].type.startsWith('image/')){
            onImageUpload(e.dataTransfer.files[0]);
        }
    }
  }, [handleDragEvents, onImageUpload]);

  return (
    <div className="w-full">
      <label
        htmlFor="image-upload"
        onDragEnter={(e) => handleDragEvents(e, true)}
        onDragLeave={(e) => handleDragEvents(e, false)}
        onDragOver={(e) => handleDragEvents(e, true)}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300
        ${isDragging ? 'border-purple-500 bg-gray-700/50' : 'border-gray-600 bg-gray-800/20 hover:border-gray-500 hover:bg-gray-700/30'}`}
      >
        {imageUrl ? (
          <img src={imageUrl} alt="Uploaded preview" className="object-contain w-full h-full rounded-lg" />
        ) : (
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-gray-400">
            <ImageIcon className="w-10 h-10 mb-3" />
            <p className="mb-2 text-sm"><span className="font-semibold">Click to upload</span> or drag and drop</p>
            <p className="text-xs">PNG, JPG, GIF or WEBP</p>
          </div>
        )}
        <input id="image-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
      </label>
    </div>
  );
};

export default ImageUploader;
