import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import './VideoPlayer.css';

export default function VideoPlayer({ src, title, onEnded }) {
  const videoRef = useRef(null);
  const hlsRef   = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!src || !videoRef.current) return;

    setError(null);
    const video = videoRef.current;

    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }

    const isHls = src.includes('.m3u8') || src.includes('playlist');

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, startLevel: -1 });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) setError('No se pudo cargar el video. Intenta de nuevo.');
      });
      hlsRef.current = hls;
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS
      video.src = src;
      video.play().catch(() => {});
    } else {
      video.src = src;
      video.play().catch(() => {});
    }

    return () => {
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
      video.pause();
      video.src = '';
    };
  }, [src]);

  if (error) {
    return (
      <div className="player-error">
        <span className="player-error-icon">⚠</span>
        <p>{error}</p>
        <button onClick={() => setError(null)}>Reintentar</button>
      </div>
    );
  }

  return (
    <div className="player-wrapper">
      <video
        ref={videoRef}
        className="video-element"
        controls
        playsInline
        title={title}
        onEnded={onEnded}
      />
    </div>
  );
}
