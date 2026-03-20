import { useFirestore } from '@/firebase';
import { getBase64Image } from '@/firebase/storage';
import { useState, useEffect, useRef } from 'react';

export function useResolvedPhotoURL(photoURL: string | null | undefined): string | null {
  const firestore = useFirestore();
  const [resolvedURL, setResolvedURL] = useState<string | null>(photoURL || null);
  const currentPhotoRef = useRef(photoURL);

  useEffect(() => {
    currentPhotoRef.current = photoURL;
    
    if (!photoURL) {
      setResolvedURL(null);
      return;
    }

    if (photoURL.startsWith('base64:')) {
      if (firestore) {
        getBase64Image(photoURL, firestore).then((data) => {
          if (data && currentPhotoRef.current === photoURL) {
            setResolvedURL(data);
          }
        });
      }
    } else {
      setResolvedURL(photoURL);
    }
  }, [photoURL, firestore]);

  return resolvedURL;
}
