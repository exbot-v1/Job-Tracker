import React, { useState } from 'react';
import { Film, Play } from 'lucide-react';
import { getYouTubeThumbnailUrl } from '../lib/youtube';

interface YouTubeThumbnailProps {
  youtubeUrl?: string | null;
  title?: string;
  className?: string;
  aspectRatio?: 'video' | 'square';
  showPlayBadge?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

export const YouTubeThumbnail: React.FC<YouTubeThumbnailProps> = ({
  youtubeUrl,
  title = 'Video thumbnail',
  className = 'w-16 h-10',
  aspectRatio = 'video',
  showPlayBadge = false,
  onClick,
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

  const content = (
    <>
      <img
        src={thumbnailUrl}
        alt={title}
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        onError={() => setHasError(true)}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
      {showPlayBadge && (
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 flex items-center justify-center transition-colors">
          {/* Classic YouTube Red Play Badge */}
          <div
            className="w-7 h-5 rounded-[5px] bg-[#FF0000] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200"
            title="Watch on YouTube"
          >
            <Play className="w-2.5 h-2.5 fill-white text-white ml-0.5" />
          </div>
        </div>
      )}
    </>
  );

  const containerClasses = `relative rounded-lg overflow-hidden bg-slate-950 border border-[#2B3240] shrink-0 group block cursor-pointer select-none ${
    aspectRatio === 'video' ? 'aspect-video' : 'aspect-square'
  } ${className}`;

  if (youtubeUrl) {
    return (
      <a
        href={youtubeUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
        className={containerClasses}
        title={`Watch "${title}" on YouTube`}
        aria-label={`Watch "${title}" on YouTube`}
      >
        {content}
      </a>
    );
  }

  return (
    <div
      onClick={onClick}
      className={containerClasses}
      title={title}
    >
      {content}
    </div>
  );
};
