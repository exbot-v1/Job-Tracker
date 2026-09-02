import React, { useState } from 'react';
import { Film, Play } from 'lucide-react';
import { getYouTubeThumbnailUrl } from '../lib/youtube';

interface YouTubeThumbnailProps {
  youtubeUrl?: string | null;
  title?: string;
  className?: string;
  aspectRatio?: 'video' | 'square';
  showPlayBadge?: boolean;
}

export const YouTubeThumbnail: React.FC<YouTubeThumbnailProps> = ({
  youtubeUrl,
  title = 'Video thumbnail',
  className = 'w-16 h-10',
  aspectRatio = 'video',
  showPlayBadge = false,
}) => {
  const [hasError, setHasError] = useState(false);
  const thumbnailUrl = getYouTubeThumbnailUrl(youtubeUrl, 'mq');

  if (!thumbnailUrl || hasError) {
    return (
      <div
        className={`rounded-lg bg-gradient-to-br from-[#1A1D26] to-[#12151B] border border-[#2B3240] flex items-center justify-center text-slate-500 overflow-hidden shrink-0 ${
          aspectRatio === 'video' ? 'aspect-video' : 'aspect-square'
        } ${className}`}
        title={title}
      >
        <Film className="w-4 h-4 opacity-50 text-slate-400" />
      </div>
    );
  }

  return (
    <div
      className={`relative rounded-lg overflow-hidden bg-slate-950 border border-[#2B3240] shrink-0 group ${
        aspectRatio === 'video' ? 'aspect-video' : 'aspect-square'
      } ${className}`}
      title={title}
    >
      <img
        src={thumbnailUrl}
        alt={title}
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        onError={() => setHasError(true)}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
      {showPlayBadge && (
        <div className="absolute inset-0 bg-slate-950/20 flex items-center justify-center group-hover:bg-slate-950/40 transition-colors">
          <div className="w-5 h-5 rounded-full bg-slate-900/80 backdrop-blur-xs flex items-center justify-center text-emerald-400 border border-emerald-500/30">
            <Play className="w-2.5 h-2.5 fill-emerald-400 ml-0.5" />
          </div>
        </div>
      )}
    </div>
  );
};
