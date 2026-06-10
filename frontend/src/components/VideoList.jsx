import './VideoList.css';

function formatDuration(seconds) {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function VideoList({ videos, selectedId, onSelect, progress }) {
  return (
    <aside className="video-list">
      <div className="video-list-header">
        <span>Contenido del curso</span>
        <span className="video-count">{videos.length} videos</span>
      </div>

      {progress > 0 && (
        <div className="course-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="progress-label">{Math.round(progress)}% completado</span>
        </div>
      )}

      <ul className="video-items">
        {videos.map((video) => (
          <li
            key={video._id}
            className={[
              'video-item',
              selectedId === video._id ? 'video-item--active' : '',
              video.locked ? 'video-item--locked' : '',
            ].join(' ')}
            onClick={() => onSelect(video)}
          >
            <div className="video-item-icon">
              {video.completed ? (
                <span className="icon-done">✓</span>
              ) : video.locked ? (
                <span className="icon-lock">🔒</span>
              ) : (
                <span className="icon-play">▶</span>
              )}
            </div>

            <div className="video-item-info">
              <span className="video-item-title">{video.title}</span>
              <div className="video-item-meta">
                {video.isFree && !video.locked && (
                  <span className="badge-free">Gratis</span>
                )}
                {video.duration > 0 && (
                  <span className="video-duration">{formatDuration(video.duration)}</span>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}
