'use client';

import { useEffect, useRef, useCallback } from 'react';

const VideoSection = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const handleVideoObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const entry = entries[0];

      if (videoRef.current) {
        if (entry.isIntersecting) {
          if (videoRef.current.paused) {
            requestAnimationFrame(() => {
              videoRef.current
                ?.play()
                .catch(e => console.error('Play error:', e));
            });
          }
        } else {
          if (!videoRef.current.paused) {
            requestAnimationFrame(() => {
              videoRef.current?.pause();
            });
          }
        }
      }
    },
    [],
  );

  useEffect(() => {
    if (!videoRef.current) return;

    const observer = new IntersectionObserver(handleVideoObserver, {
      threshold: 0.5, // Ensures 50% of video is in view before playing
    });

    observer.observe(videoRef.current);

    return () => observer.disconnect();
  }, [handleVideoObserver]);

  return (
    <section id='demo' className='mx-4 my-10 scroll-mt-20 rounded-xl shadow-lg'>
      <div className='container mx-auto max-w-5xl'>
        {/* Video Container */}
        <div className='relative overflow-hidden rounded-xl'>
          <video
            ref={videoRef}
            className='h-full w-full rounded-xl object-cover'
            muted
            loop
            playsInline
            onCanPlay={() => {
              if (videoRef.current?.paused) {
                requestAnimationFrame(() => {
                  videoRef.current
                    ?.play()
                    .catch(e => console.error('Autoplay prevented:', e));
                });
              }
            }}
          >
            <source src='/final.mp4' type='video/mp4' />
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
    </section>
  );
};

export default VideoSection;
