/**
 * YouTube Utility Helper
 * Supports extracting video IDs, fetching oEmbed metadata (title and thumbnail),
 * and building thumbnail URLs for standard watch URLs, youtu.be, shorts, embeds, and mobile links.
 */
import { useState, useEffect } from 'react';

export interface YouTubeMetadata {
  title?: string;
  thumbnail_url?: string;
  author_name?: string;
}

const metadataMemoryCache = new Map<string, YouTubeMetadata>();

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

/**
 * Fetch video title and thumbnail via official YouTube oEmbed endpoint.
 * Notice: We deliberately DO NOT fetch or use video duration from YouTube.
 * Results are cached in memory and sessionStorage to minimize network traffic.
 */
export async function fetchYouTubeMetadata(url?: string | null): Promise<YouTubeMetadata | null> {
  if (!url || typeof url !== 'string') return null;
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return null;

  const cacheKey = `yt_meta_${videoId}`;
  if (metadataMemoryCache.has(cacheKey)) {
    return metadataMemoryCache.get(cacheKey)!;
  }

  // Try sessionStorage
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const cached = window.sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        metadataMemoryCache.set(cacheKey, parsed);
        return parsed;
      }
    }
  } catch {
    // ignore sessionStorage errors
  }

  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url.trim())}&format=json`;
    const response = await fetch(oembedUrl);
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    const result: YouTubeMetadata = {
      title: data.title || undefined,
      thumbnail_url: data.thumbnail_url || undefined,
      author_name: data.author_name || undefined,
    };

    metadataMemoryCache.set(cacheKey, result);
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem(cacheKey, JSON.stringify(result));
      }
    } catch {
      // ignore
    }

    return result;
  } catch (err) {
    // Network error, CORS, or private video: silently return null to gracefully fall back
    return null;
  }
}

/**
 * React hook to retrieve YouTube metadata asynchronously with immediate cached return.
 */
export function useYouTubeMetadata(url?: string | null): {
  metadata: YouTubeMetadata | null;
  isLoading: boolean;
} {
  const videoId = extractYouTubeVideoId(url);
  const cacheKey = videoId ? `yt_meta_${videoId}` : null;

  const [metadata, setMetadata] = useState<YouTubeMetadata | null>(() => {
    if (!cacheKey) return null;
    if (metadataMemoryCache.has(cacheKey)) {
      return metadataMemoryCache.get(cacheKey)!;
    }
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const item = window.sessionStorage.getItem(cacheKey);
        if (item) return JSON.parse(item);
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(!metadata && Boolean(videoId));

  useEffect(() => {
    if (!url || !videoId) {
      setMetadata(null);
      setIsLoading(false);
      return;
    }

    if (metadata && metadataMemoryCache.has(cacheKey!)) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    fetchYouTubeMetadata(url)
      .then((data) => {
        if (isMounted) {
          setMetadata(data);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [url, videoId, cacheKey]);

  return { metadata, isLoading };
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
