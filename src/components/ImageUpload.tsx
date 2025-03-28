import React from 'react';
import { Upload, X } from 'lucide-react';
import { uploadImage } from '../lib/storage';

interface ImageUploadProps {
  onUpload: (url: string) => void;
  onError?: (error: string) => void;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ onUpload, onError }) => {
  const [isUploading, setIsUploading] = React.useState(false);
  const [dragActive, setDragActive] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files?.[0]) {
      await handleFile(files[0]);
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const files = e.target.files;
    if (files?.[0]) {
      await handleFile(files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      onError?.('Please upload an image file');
      return;
    }

    setIsUploading(true);
    try {
      const url = await uploadImage(file);
      onUpload(url);
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Error uploading image');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
        dragActive
          ? 'border-indigo-500 bg-indigo-50'
          : 'border-gray-300 hover:border-indigo-500'
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />

      <div className="text-center">
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <div className="mt-4">
          <button
            type="button"
            disabled={isUploading}
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {isUploading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </>
            ) : (
              'Upload Image'
            )}
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          or drag and drop
        </p>
        <p className="mt-1 text-xs text-gray-500">
          PNG, JPG, GIF up to 10MB
        </p>
      </div>
    </div>
  );
};