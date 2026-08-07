import { useEffect, useRef } from 'react';
import '../styles/VideoPlayer.css';

let playerjsPromise = null;
function loadPlayerJs() {
  if (window.playerjs) return Promise.resolve();
  if (playerjsPromise) return playerjsPromise;
  playerjsPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = '//assets.mediadelivery.net/playerjs/playerjs-latest.min.js';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return playerjsPromise;
}

export default function VideoPlayer({ src, title, onEnded }) {
  const iframeRef = useRef(null);

  useEffect(() => {
    if (!src) return;
    let player;
    let cancelled = false;

    loadPlayerJs().then(() => {
      if (cancelled || !iframeRef.current) return;
      player = new window.playerjs.Player(iframeRef.current);
      player.on('ready', () => {
        if (onEnded) player.on('ended', onEnded);
      });
    });

    return () => { cancelled = true; };
  }, [src, onEnded]);

  if (!src) return null;

  return (
    <div className="video-player">
      <iframe
        ref={iframeRef}
        src={src}
        title={title}
        className="video-player__iframe"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
        allowFullScreen
      />
    </div>
  );
}
