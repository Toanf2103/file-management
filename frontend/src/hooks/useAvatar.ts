import { useState, useEffect, useRef } from 'react';
import { usersService } from '../services/api';

export const useAvatar = (avatarPath: string | undefined) => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const previousUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!avatarPath) {
      // Cleanup previous URL if exists
      if (previousUrlRef.current) {
        window.URL.revokeObjectURL(previousUrlRef.current);
        previousUrlRef.current = null;
      }
      setAvatarUrl(null);
      return;
    }

    setLoading(true);
    usersService.getAvatarBlob(avatarPath)
      .then((url) => {
        // Cleanup previous URL before setting new one
        if (previousUrlRef.current) {
          window.URL.revokeObjectURL(previousUrlRef.current);
        }
        previousUrlRef.current = url;
        setAvatarUrl(url);
      })
      .catch((error) => {
        console.error('Failed to load avatar:', error);
        setAvatarUrl(null);
      })
      .finally(() => {
        setLoading(false);
      });

    // Cleanup blob URL when component unmounts or avatar changes
    return () => {
      if (previousUrlRef.current) {
        window.URL.revokeObjectURL(previousUrlRef.current);
        previousUrlRef.current = null;
      }
    };
  }, [avatarPath]);

  return { avatarUrl, loading };
};

