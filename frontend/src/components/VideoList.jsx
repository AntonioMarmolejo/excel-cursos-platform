import { useEffect, useMemo, useState } from 'react';
import '../styles/VideoList.css';

function formatDuration(seconds) {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const GENERAL = 'Contenido del curso';

export default function VideoList({ videos, selectedId, onSelect }) {
  const [search, setSearch] = useState('');
  const [openSections, setOpenSections] = useState(() => new Set());

  // Agrupa los videos por sección, preservando el orden de aparición.
  // Si ningún video tiene sección asignada, se muestra como lista plana (sin acordeón).
  const hasSections = videos.some(v => v.section);
  const groups = useMemo(() => {
    if (!hasSections) return null;
    const map = new Map();
    videos.forEach(v => {
      const key = v.section || GENERAL;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(v);
    });
    return Array.from(map.entries());
  }, [videos, hasSections]);

  // Al cambiar el video activo, asegura que su sección esté abierta.
  useEffect(() => {
    if (!hasSections || !selectedId) return;
    const active = videos.find(v => v._id === selectedId);
    if (active) {
      setOpenSections(prev => new Set(prev).add(active.section || GENERAL));
    }
  }, [selectedId, hasSections, videos]);

  const toggleSection = (name) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const matches = (v) => v.title.toLowerCase().includes(search.trim().toLowerCase());

  const renderItem = (video) => (
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
  );

  return (
    <aside className="video-list">
      <div className="video-list__search-wrap">
        <input
          className="video-list__search"
          type="text"
          placeholder="Buscar contenido de cursos"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="video-list__scroll">
        {!hasSections ? (
          <ul className="video-list__items">
            {videos.filter(matches).map(renderItem)}
          </ul>
        ) : (
          groups.map(([name, sectionVideos]) => {
            const filtered = sectionVideos.filter(matches);
            if (search && filtered.length === 0) return null;
            const isOpen = search ? true : openSections.has(name);
            const doneCount = sectionVideos.filter(v => v.completed).length;

            return (
              <div key={name} className="video-list__section">
                <button
                  type="button"
                  className="video-list__section-header"
                  onClick={() => toggleSection(name)}
                >
                  <span className={`video-list__section-arrow${isOpen ? ' video-list__section-arrow--open' : ''}`}>›</span>
                  <span className="video-list__section-title">{name}</span>
                  <span className="video-list__section-count">{doneCount}/{sectionVideos.length}</span>
                </button>
                {isOpen && (
                  <ul className="video-list__items">
                    {(search ? filtered : sectionVideos).map(renderItem)}
                  </ul>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
