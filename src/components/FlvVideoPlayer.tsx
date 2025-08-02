import React, { useEffect, useRef, useState } from 'react';
import flvjs from 'flv.js';

interface FlvVideoPlayerProps {
  src: string;
  className?: string;
  controls?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  onError?: (error: any) => void;
  onLoad?: () => void;
}

const FlvVideoPlayer: React.FC<FlvVideoPlayerProps> = ({
  src,
  className = '',
  controls = true,
  autoPlay = true,
  muted = false,
  onError,
  onLoad
}) => {
  console.log('FlvVideoPlayer component rendered with src:', src);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const flvPlayerRef = useRef<flvjs.Player | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Simple test to see if component is working
  console.log('FlvVideoPlayer: Component is working!');
  console.log('FlvVideoPlayer: src =', src);
  console.log('FlvVideoPlayer: isLoading =', isLoading);

  useEffect(() => {
    console.log('FlvVideoPlayer useEffect triggered with src:', src);
    
    if (!videoRef.current || !src) {
      console.log('Missing videoRef or src');
      return;
    }

    // Check if flv.js is supported
    if (!flvjs.isSupported()) {
      console.error('FLV.js is not supported in this browser');
      onError?.({ message: 'FLV.js is not supported in this browser' });
      return;
    }

    console.log('Creating FLV player for:', src);

    // Create FLV player
    const flvPlayer = flvjs.createPlayer({
      type: 'flv',
      url: src,
      isLive: true,
      hasAudio: true,
      hasVideo: true
    });

    flvPlayer.attachMediaElement(videoRef.current);
    flvPlayer.load();
    flvPlayerRef.current = flvPlayer;

    // Event handlers
    flvPlayer.on(flvjs.Events.LOADING_COMPLETE, () => {
      console.log('FLV stream loaded successfully');
      setIsLoading(false);
      onLoad?.();
    });

    flvPlayer.on(flvjs.Events.MEDIA_INFO, (mediaInfo) => {
      console.log('Media info received:', mediaInfo);
      setIsLoading(false);
    });

    flvPlayer.on(flvjs.Events.ERROR, (errorType: string, errorDetail: any) => {
      console.error('FLV player error:', errorType, errorDetail);
      setIsLoading(false);
      onError?.({ type: errorType, detail: errorDetail });
    });

    // Force show video after 2 seconds
    setTimeout(() => {
      console.log('Forcing video display after 2 seconds');
      setIsLoading(false);
    }, 2000);

    // Cleanup function
    return () => {
      console.log('Cleaning up FLV player');
      if (flvPlayerRef.current) {
        flvPlayerRef.current.destroy();
        flvPlayerRef.current = null;
      }
    };
  }, [src, onError, onLoad]);

  console.log('FlvVideoPlayer render - isLoading:', isLoading);

  return (
    <div className={className}>
      {/* Always render the video element so videoRef.current is available */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        controls={controls}
        autoPlay={autoPlay}
        muted={muted}
        playsInline
      />
      
      {/* Show loading overlay when isLoading is true */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 text-white">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <p className="text-lg font-semibold">Loading Stream...</p>
            <p className="text-gray-400">Connecting to live stream</p>
            <p className="text-yellow-400 text-sm mt-2">DEBUG: Component is rendering!</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlvVideoPlayer; 