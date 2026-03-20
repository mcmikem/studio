/**
 * Base64 Image Utilities
 * Store images directly in Firestore - 100% free, no paid Firebase needed
 */

/**
 * Convert file to base64 data URL
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Convert base64 to File
 */
export function base64ToFile(base64: string, filename: string): File {
  const arr = base64.split(',');
  const mime = arr[0]?.match(/:(.*?);/)?.[1] || 'image/png';
  const base64Data = arr[1];
  if (!base64Data) {
    throw new Error('Invalid base64 string: missing data after comma');
  }
  const bstr = atob(base64Data);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

/**
 * Compress image if too large
 */
export async function compressImage(file: File, maxSizeKB: number = 500): Promise<File> {
  if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic')) {
    throw new Error("HEIC (iPhone photo) format is not supported directly in the browser. Please convert to JPG/PNG or change your iPhone camera settings to 'Most Compatible'.");
  }

  if (file.size <= maxSizeKB * 1024) {
    return file;
  }

  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      
      img.onload = () => {
        try {
          let { width, height } = img;
          const maxDim = 1200;
          
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = (height / width) * maxDim;
              width = maxDim;
            } else {
              width = (width / height) * maxDim;
              height = maxDim;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx?.drawImage(img, 0, 0, width, height);
          URL.revokeObjectURL(objectUrl);
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(new File([blob], file.name, { type: 'image/jpeg' }));
              } else {
                console.warn("[Image Compress] Canvas toBlob failed, returning original file");
                resolve(file);
              }
            },
            'image/jpeg',
            0.8
          );
        } catch (err) {
          URL.revokeObjectURL(objectUrl);
          console.error("[Image Compress] Error during canvas draw/blob:", err);
          resolve(file);
        }
      };
      
      img.onerror = () => {
         URL.revokeObjectURL(objectUrl);
         console.error("[Image Compress] Image failed to load into canvas");
         reject(new Error("Failed to load image for compression. The file might be corrupted or in an unsupported format."));
      };

      img.src = objectUrl;
    } catch (err) {
      console.error("[Image Compress] Fatal compression error:", err);
      resolve(file);
    }
  });
}

/**
 * Check if a URL is a base64 data URL
 */
export function isBase64Url(url: string): boolean {
  return url?.startsWith('data:') || false;
}

/**
 * Get image dimensions
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ width: 0, height: 0 });
    };
    img.src = objectUrl;
  });
}
