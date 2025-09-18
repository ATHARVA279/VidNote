import React, { useEffect, useRef } from 'react';

interface VideoPlayerProps {
  videoId: string;
}

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoId }) => {
  const playerRef = useRef<HTMLDivElement>(null);
  const ytPlayerRef = useRef<any>(null);

  useEffect(() => {
    // Load YouTube API script if not already loaded
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      
      window.onYouTubeIframeAPIReady = initializePlayer;
    } else {
      initializePlayer();
    }
    
    return () => {
      if (ytPlayerRef.current) {
        ytPlayerRef.current.destroy();
      }
    };
  }, [videoId]);

  const initializePlayer = () => {
    if (!playerRef.current) return;
    
    ytPlayerRef.current = new window.YT.Player(playerRef.current, {
      videoId,
      playerVars: {
        autoplay: 0,
        modestbranding: 1,
        rel: 0,
      },
      events: {
        onReady: (event: any) => {
          // Player is ready
        },
        onStateChange: (event: any) => {
          // Player state changed
        },
        onError: (event: any) => {
          console.error('YouTube Player Error:', event.data);
        },
      },
    });
  };

  return (
    <div className="aspect-video bg-black rounded-lg overflow-hidden">
      <div ref={playerRef} className="w-full h-full" />
    </div>
  );
};

export default VideoPlayer;