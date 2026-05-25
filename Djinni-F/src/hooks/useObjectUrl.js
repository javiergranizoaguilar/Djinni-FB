import { useEffect, useState } from 'react';

/**
 * Wraps URL.createObjectURL / revokeObjectURL with React lifecycle so the
 * blob URL is freed when the file changes or the component unmounts.
 *
 * Usage:
 *   const [file, setFile] = useState(null);
 *   const previewUrl = useObjectUrl(file);
 */
export function useObjectUrl(file) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    if (!file) {
      setUrl(null);
      return undefined;
    }
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);

  return url;
}

export default useObjectUrl;
