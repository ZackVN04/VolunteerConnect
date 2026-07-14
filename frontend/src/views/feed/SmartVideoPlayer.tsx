import React, { useEffect, useRef, useState } from 'react';

// Smart Video Player Component that uses IntersectionObserver to control preload
export const SmartVideoPlayer: React.FC<{ src: string }> = ({ src }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [preloadState, setPreloadState] = useState<'none' | 'metadata'>('none');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setPreloadState('metadata');
          } else {
            setPreloadState('none');
            if (videoRef.current) {
              videoRef.current.pause();
            }
          }
        });
      },
      {
        rootMargin: '200px 0px',
        threshold: 0.1,
      }
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => observer.disconnect();
  }, [src]);

  return (
    <div className="rounded-xl overflow-hidden border border-slate-200/85 max-h-[360px] bg-black flex items-center justify-center shadow-inner relative group w-full">
      <video
        ref={videoRef}
        src={src}
        preload={preloadState}
        controls
        className="w-full max-h-[360px] object-contain"
      />
    </div>
  );
};
