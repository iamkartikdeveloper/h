'use client';

import React, { useState } from 'react';
import { extractYouTubeId, getYouTubeEmbedUrl, getYouTubeThumbnail } from '@/lib/utils/youtube';
import { Play, AlertCircle, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface YouTubeEmbedProps {
  urlOrId: string | null | undefined;
  title?: string;
  className?: string;
  autoPlay?: boolean;
}

export function YouTubeEmbed({ urlOrId, title = 'YouTube video tutorial', className, autoPlay = false }: YouTubeEmbedProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [hasError, setHasError] = useState(false);

  const videoId = extractYouTubeId(urlOrId);

  if (!urlOrId || !videoId) {
    return (
      <div
        className={cn(
          'w-full aspect-video rounded-2xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center p-6 text-center text-slate-600',
          className
        )}
      >
        <AlertCircle className="w-10 h-10 text-amber-500 mb-2" />
        <p className="text-sm font-semibold text-slate-800">Video Walkthrough Not Available</p>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          Please refer to the detailed written implementation steps and source code below.
        </p>
      </div>
    );
  }

  const embedUrl = getYouTubeEmbedUrl(videoId);
  const thumbnailUrl = getYouTubeThumbnail(videoId);

  return (
    <div
      className={cn(
        'relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-md group',
        className
      )}
    >
      {!isPlaying ? (
        <div className="relative w-full h-full cursor-pointer" onClick={() => setIsPlaying(true)}>
          {/* Video Poster Thumbnail */}
          <img
            src={thumbnailUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setHasError(true)}
          />
          {/* Subtle Dark Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-black/20" />

          {/* YouTube Brand Play Button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-red-600/90 hover:bg-red-600 text-white flex items-center justify-center shadow-2xl shadow-red-600/50 transition-all duration-300 group-hover:scale-110">
              <Play className="w-8 h-8 ml-1 fill-white" />
            </div>
          </div>

          {/* Overlay Info */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white text-xs">
            <span className="font-medium bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 line-clamp-1 max-w-md">
              ▶ Watch Video Tutorial: {title}
            </span>
            <a
              href={`https://www.youtube.com/watch?v=${videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 bg-black/60 hover:bg-black/80 px-2.5 py-1.5 rounded-lg border border-white/10 text-slate-300 hover:text-white transition-colors"
            >
              <span>Open on YouTube</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      ) : (
        <iframe
          src={`${embedUrl}&autoplay=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="w-full h-full border-0"
        />
      )}
    </div>
  );
}
