'use client';

import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface PhotoUploadProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
  disabled?: boolean;
}

export function PhotoUpload({ photos, onPhotosChange, maxPhotos = 5, disabled = false }: PhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError(null);
    setIsUploading(true);

    const newPhotos: string[] = [];
    
    try {
      for (const file of Array.from(files)) {
        if (newPhotos.length >= maxPhotos) break;
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          setError('Only image files are allowed');
          continue;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
          setError('Images must be smaller than 5MB');
          continue;
        }

        // Convert to base64
        const base64 = await fileToBase64(file);
        newPhotos.push(base64);
      }

      if (newPhotos.length > 0) {
        onPhotosChange([...photos, ...newPhotos].slice(0, maxPhotos));
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload images. Please try again.');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removePhoto = (index: number) => {
    const updated = photos.filter((_, i) => i !== index);
    onPhotosChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="font-bold text-xs uppercase tracking-widest">Photos ({photos.length}/{maxPhotos})</Label>
        {isUploading && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> Uploading...
          </span>
        )}
      </div>

      {error && (
        <p className="text-xs text-destructive font-bold">{error}</p>
      )}

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {photos.map((photo, index) => (
            <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-muted">
              <img
                src={photo}
                alt={`Upload ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute top-1 right-1 h-6 w-6 bg-black/60 rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
                >
                  <X className="h-3 w-3 text-white" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      {!disabled && photos.length < maxPhotos && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full h-20 border-2 border-dashed border-muted-foreground/30 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-muted/20 transition-colors disabled:opacity-50"
        >
          {isUploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : (
            <>
              <Upload className="h-6 w-6 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-bold">Tap to add photos</span>
            </>
          )}
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {photos.length === 0 && !disabled && (
        <p className="text-xs text-muted-foreground text-center">
          Add photos to document this visit (optional)
        </p>
      )}
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
