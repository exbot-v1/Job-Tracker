/**
 * YouTube Utility Helper
 * Supports extracting video IDs and building thumbnail URLs
 * for standard watch URLs, youtu.be, shorts, embeds, and mobile links.
 */

export function extractYouTubeVideoId(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // Patterns handled:
  // - https://www.youtube.com/watch?v=VIDEO_ID
  // - https://m.youtube.com/watch?v=VIDEO_ID&feature=share
  // - https://youtu.be/VIDEO_ID
  // - https://www.youtube.com/shorts/VIDEO_ID
  // - https://www.youtube.com/embed/VIDEO_ID
  // - https://www.youtube.com/v/VIDEO_ID
  // - youtube.com/watch?v=VIDEO_ID
  const regExp = /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = trimmed.match(regExp);
  if (match && match[1]) {
    return match[1];
  }
  return null;
}

export function getYouTubeThumbnailUrl(
  url?: string | null,
  quality: 'hq' | 'mq' | 'default' = 'hq'
): string | null {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return null;

  if (quality === 'hq') {
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  }
  if (quality === 'mq') {
    return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
  }
  return `https://img.youtube.com/vi/${videoId}/default.jpg`;
}

/**
 * Attempt to load an image URL and convert to Base64 data URL for PDF inclusion.
 * Resolves to null if loading or CORS fails.
 */
export async function loadImageAsBase64(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve(dataUrl);
      } catch (err) {
        console.warn('Canvas conversion failed for thumbnail:', err);
        resolve(null);
      }
    };
    img.onerror = () => {
      resolve(null);
    };
    // Set a 4 second timeout in case image request hangs
    setTimeout(() => resolve(null), 4000);
    img.src = url;
  });
}
