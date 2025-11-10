// components/YouTubeEmbed.tsx
"use client";

import { useState } from "react";
import { FiPlay, FiExternalLink } from "react-icons/fi";

interface YouTubeEmbedProps {
  url: string;
  title?: string;
}

export default function YouTubeEmbed({ url, title }: YouTubeEmbedProps) {
  const [showVideo, setShowVideo] = useState(false);

  // Extract YouTube video ID dari berbagai format URL
  const getYouTubeId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const videoId = getYouTubeId(url);

  if (!videoId) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
        <p className="text-red-400 text-sm">URL YouTube tidak valid</p>
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 text-sm underline mt-2 inline-flex items-center gap-1"
        >
          Buka link <FiExternalLink className="text-xs" />
        </a>
      </div>
    );
  }

  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;

  if (showVideo) {
    return (
      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
        <iframe
          src={embedUrl}
          title={title || "YouTube video"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full border-0"
        />
      </div>
    );
  }

  return (
    <div 
      className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl cursor-pointer group"
      onClick={() => setShowVideo(true)}
    >
      {/* Thumbnail */}
      <img
        src={thumbnailUrl}
        alt={title || "YouTube thumbnail"}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 mb-3">
            <FiPlay className="text-white text-2xl ml-1" />
          </div>
          <p className="text-white font-medium text-lg">Putar Video</p>
          <p className="text-white/70 text-sm mt-1">Klik untuk menonton</p>
        </div>
      </div>

      {/* YouTube Badge */}
      <div className="absolute top-3 left-3 bg-red-600 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
        </svg>
        YouTube
      </div>
    </div>
  );
}