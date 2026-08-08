import '../styles/VideoList.css';

function formatDuration(seconds) {
    if (!seconds) return '';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
}

export default function VideoList({ videos, selectedId, onSelect, progress }) {
    return (
        <aside className="video-list">
            <div className="video-list__header">
                <span>Contenido del curso</span>
                <span className="video-list__count">{videos.length} videos</span>
            </div>

            {progress > 0 && (
                <div className="video-list__progress">
                    <div className="video-list__progress-bar">
                        <div className="video-list__progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="video-list__progress-label">{Math.round(progress)}% completado</span>
                </div>
            )}

            <ul className="video-list__items">
                {videos.map((video) => (
                    <li
                        key={video._id}
                        className={[
                            'video-list__item',
                            selectedId === video._id ? 'video-list__item--active' : '',
                            video.locked ? 'video-list__item--locked' : '',
                        ].join(' ')}
                        onClick={() => onSelect(video)}
                    >
                        <div className="video-list__item-icon">
                            {video.completed ? (
                                <span className="video-list__icon video-list__icon--done">✓</span>
                            ) : video.locked ? (
                                <span className="video-list__icon video-list__icon--lock">🔒</span>
                            ) : (
                                <span className="video-list__icon video-list__icon--play">▶</span>
                            )}
                        </div>

                        <div className="video-list__item-info">
                            <span className="video-list__item-title">{video.title}</span>
                            <div className="video-list__item-meta">
                                {video.isFree && !video.locked && (
                                    <span className="video-list__badge">Gratis</span>
                                )}
                                {video.duration > 0 && (
                                    <span className="video-list__duration">{formatDuration(video.duration)}</span>
                                )}
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </aside>
    );
}
