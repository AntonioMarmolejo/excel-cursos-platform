import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import VideoPlayer from '../components/VideoPlayer';
import VideoList from '../components/VideoList';
import LockedOverlay from '../components/LockedOverlay';
import CommentSection from '../components/CommentSection';
import { groupVideosBySection, findNextVideo } from '../utils/courseGrouping';
import { resolveCourseThumbnail } from '../utils/courseThumbnails';
import '../styles/CoursePage.css';

const LEVEL_LABEL = { basico: 'Básico', medio: 'Intermedio', avanzado: 'Avanzado' };

const fmtDuration = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
};

export default function CoursePage() {
    const { slug } = useParams();
    const navigate = useNavigate();

    const [course, setCourse] = useState(null);
    const [videos, setVideos] = useState([]);
    const [studentsCount, setStudentsCount] = useState(0);
    const [progressPercentage, setProgressPercentage] = useState(0);
    const [selectedVideo, setSelected] = useState(null);
    const [streamUrl, setStreamUrl] = useState(null);
    const [loadingCourse, setLoadingCourse] = useState(true);
    const [loadingStream, setLoadingStream] = useState(false);
    const [error, setError] = useState(null);

    const [view, setView] = useState('overview'); // 'overview' | 'player'
    const [landingTab, setLandingTab] = useState('overview'); // 'overview' | 'programa' | 'instructor'
    const [openProgramaSections, setOpenProgramaSections] = useState(() => new Set());

    // Cargar datos del curso
    useEffect(() => {
        setLoadingCourse(true);
        api.get(`/courses/${slug}`)
            .then(res => {
                setCourse(res.data.course);
                setVideos(res.data.videos);
                setProgressPercentage(res.data.progressPercentage || 0);
                setStudentsCount(res.data.studentsCount || 0);
                setSelected(findNextVideo(res.data.videos));
            })
            .catch(() => setError('Curso no encontrado'))
            .finally(() => setLoadingCourse(false));
    }, [slug]);

    const groups = useMemo(() => groupVideosBySection(videos), [videos]);

    // Por defecto, todas las secciones del programa aparecen expandidas
    useEffect(() => {
        if (groups) setOpenProgramaSections(new Set(groups.map(([name]) => name)));
    }, [groups]);

    // Cargar stream URL solo cuando estamos reproduciendo
    useEffect(() => {
        if (view !== 'player' || !selectedVideo || selectedVideo.locked) {
            setStreamUrl(null);
            return;
        }

        setLoadingStream(true);
        setStreamUrl(null);

        api.get(`/videos/${selectedVideo._id}/stream`)
            .then(res => setStreamUrl(res.data.streamUrl))
            .catch(err => {
                if (err.response?.status === 403) setStreamUrl(null);
                else setError('Error al cargar el video');
            })
            .finally(() => setLoadingStream(false));
    }, [selectedVideo?._id, view]);

    const markCompleted = useCallback(() => {
        if (!selectedVideo || !course) return;
        api.post('/progress/video', {
            courseId: course._id,
            videoId: selectedVideo._id,
            completed: true,
        }).then(() => {
            setVideos(prev => prev.map(v =>
                v._id === selectedVideo._id ? { ...v, completed: true } : v
            ));
        }).catch(() => { });
    }, [selectedVideo, course]);

    const handleVideoEnd = useCallback(() => {
        markCompleted();
        const idx = videos.findIndex(v => v._id === selectedVideo?._id);
        const next = videos[idx + 1];
        if (next && !next.locked) setSelected(next);
    }, [markCompleted, selectedVideo, videos]);

    const handleContinue = () => {
        const next = findNextVideo(videos);
        if (next) setSelected(next);
        setView('player');
    };

    const handleSelectFromList = (video) => {
        setSelected(video);
        setView('player');
    };

    const toggleProgramaSection = (name) => {
        setOpenProgramaSections(prev => {
            const next = new Set(prev);
            next.has(name) ? next.delete(name) : next.add(name);
            return next;
        });
    };

    if (loadingCourse) return <div className="course-page__loading"><div className="course-page__spinner" /></div>;
    if (error) return <div className="course-page__error">{error} <button onClick={() => navigate('/')}>Volver</button></div>;

    const totalVideos = videos.length;
    const completedCount = videos.filter(v => v.completed).length;
    const continueLabel = completedCount === 0 ? 'Comenzar' : completedCount === totalVideos ? 'Repasar' : 'Continuar';

    const showLocked = selectedVideo?.locked;
    const currentIndex = selectedVideo ? videos.findIndex(v => v._id === selectedVideo._id) : -1;
    const prevVideo = currentIndex > 0 ? videos[currentIndex - 1] : null;
    const nextVideoInList = currentIndex >= 0 && currentIndex < videos.length - 1 ? videos[currentIndex + 1] : null;

    const renderLesson = (video, { showDuration = true } = {}) => (
        <li
            key={video._id}
            className={`course-page__lesson${selectedVideo?._id === video._id ? ' course-page__lesson--active' : ''}${video.locked ? ' course-page__lesson--locked' : ''}`}
            onClick={() => handleSelectFromList(video)}
        >
            <span className="course-page__lesson-icon">
                {video.completed ? '✓' : video.locked ? '🔒' : '▶'}
            </span>
            <span className="course-page__lesson-title">{video.title}</span>
            {showDuration && video.duration > 0 && (
                <span className="course-page__lesson-duration">{fmtDuration(video.duration)}</span>
            )}
        </li>
    );

    // ─────────────────────────────────────────────
    // Vista: presentación del curso (overview)
    // ─────────────────────────────────────────────
    if (view === 'overview') {
        return (
            <div className="course-page">
                <Navbar />

                <div className="course-page__breadcrumb">
                    <Link to="/">Inicio</Link> <span>›</span> <Link to="/">Cursos</Link> <span>›</span> <span>{course.title}</span>
                </div>

                <div className="course-page__hero">
                    <div className="course-page__hero-top">
                        <div className="course-page__instructor-mini">
                            <div className="course-page__instructor-avatar">{course.instructor?.name?.[0]?.toUpperCase() || 'A'}</div>
                            <div>
                                <div className="course-page__hero-label">Instructor</div>
                                <div className="course-page__instructor-name">{course.instructor?.name}</div>
                            </div>
                        </div>
                        <div>
                            <div className="course-page__hero-label">Categoría</div>
                            <div className="course-page__hero-value">{LEVEL_LABEL[course.level] || course.level}</div>
                        </div>
                    </div>

                    <h1 className="course-page__hero-title">{course.title}</h1>

                    <div className="course-page__hero-meta">
                        <span>⏱ De por vida</span>
                        <span>📶 {LEVEL_LABEL[course.level] || course.level}</span>
                        <span>📄 {totalVideos} Lecciones</span>
                        <span>❓ 0 Cuestionarios</span>
                    </div>

                    <div className="course-page__hero-students">🎓 {studentsCount} Estudiantes</div>
                </div>

                <div className="course-page__overview-body">
                    <main className="course-page__overview-main">
                        <div className="course-page__tabs">
                            <button
                                className={`course-page__tab${landingTab === 'overview' ? ' course-page__tab--active' : ''}`}
                                onClick={() => setLandingTab('overview')}
                            >
                                Visión general
                            </button>
                            <button
                                className={`course-page__tab${landingTab === 'programa' ? ' course-page__tab--active' : ''}`}
                                onClick={() => setLandingTab('programa')}
                            >
                                Programa
                            </button>
                            <button
                                className={`course-page__tab${landingTab === 'instructor' ? ' course-page__tab--active' : ''}`}
                                onClick={() => setLandingTab('instructor')}
                            >
                                Instructor
                            </button>
                        </div>

                        {landingTab === 'overview' && (
                            <p className="course-page__description">{course.description}</p>
                        )}

                        {landingTab === 'programa' && (
                            <div className="course-page__programa">
                                <p className="course-page__programa-meta">
                                    {groups ? `${groups.length} secciones` : '1 sección'} · {totalVideos} lecciones · De por vida
                                </p>

                                {groups ? (
                                    groups.map(([name, sectionVideos]) => {
                                        const isOpen = openProgramaSections.has(name);
                                        const done = sectionVideos.filter(v => v.completed).length;
                                        return (
                                            <div key={name} className="course-page__accordion">
                                                <button
                                                    type="button"
                                                    className="course-page__accordion-header"
                                                    onClick={() => toggleProgramaSection(name)}
                                                >
                                                    <span className={`course-page__accordion-arrow${isOpen ? ' course-page__accordion-arrow--open' : ''}`}>›</span>
                                                    <span className="course-page__accordion-title">{name}</span>
                                                    <span className="course-page__accordion-count">{done}/{sectionVideos.length}</span>
                                                </button>
                                                {isOpen && (
                                                    <ul className="course-page__lesson-list">
                                                        {sectionVideos.map(v => renderLesson(v))}
                                                    </ul>
                                                )}
                                            </div>
                                        );
                                    })
                                ) : (
                                    <ul className="course-page__lesson-list">
                                        {videos.map(v => renderLesson(v))}
                                    </ul>
                                )}
                            </div>
                        )}

                        {landingTab === 'instructor' && (
                            <div className="course-page__instructor-tab">
                                <div className="course-page__instructor-avatar course-page__instructor-avatar--lg">
                                    {course.instructor?.name?.[0]?.toUpperCase() || 'A'}
                                </div>
                                <div>
                                    <h3 className="course-page__instructor-tab-name">{course.instructor?.name}</h3>
                                    <p className="course-page__instructor-tab-bio">
                                        {course.instructor?.bio || 'Este instructor aún no ha agregado una biografía.'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </main>

                    <aside className="course-page__sidebar-card">
                        <div className="course-page__sidebar-thumb">
                            {resolveCourseThumbnail(course)
                                ? <img src={resolveCourseThumbnail(course)} alt={course.title} />
                                : <span>📊</span>
                            }
                        </div>
                        <button className="course-page__continue-btn" onClick={handleContinue}>{continueLabel}</button>
                        <div className="course-page__sidebar-stat">
                            <span>Lecciones completadas:</span>
                            <strong>{completedCount}/{totalVideos}</strong>
                        </div>
                        <div className="course-page__sidebar-stat">
                            <span>Progreso del curso:</span>
                            <strong>{progressPercentage}%</strong>
                        </div>
                        <div className="course-page__sidebar-progress-bar">
                            <div className="course-page__sidebar-progress-fill" style={{ width: `${progressPercentage}%` }} />
                        </div>
                    </aside>
                </div>
            </div>
        );
    }

    // ─────────────────────────────────────────────
    // Vista: reproductor de lecciones (player)
    // ─────────────────────────────────────────────
    return (
        <div className="course-page course-page--player">
            <div className="course-page__player-topbar">
                <button className="course-page__player-close" onClick={() => setView('overview')} title="Volver a la presentación del curso">✕</button>
                <div className="course-page__player-topbar-info">
                    <span className="course-page__player-topbar-title">{course.title}</span>
                    <span className="course-page__player-topbar-count">{completedCount} de {totalVideos} elementos</span>
                </div>
                <div className="course-page__player-topbar-bar">
                    <div className="course-page__player-topbar-fill" style={{ width: `${progressPercentage}%` }} />
                </div>
            </div>

            <div className="course-page__player-body">
                <main className="course-page__player-main">
                    <div className="course-page__player-area">
                        {loadingStream ? (
                            <div className="course-page__player-loading"><div className="course-page__spinner" /></div>
                        ) : showLocked ? (
                            <LockedOverlay />
                        ) : streamUrl ? (
                            <VideoPlayer
                                src={streamUrl}
                                title={selectedVideo?.title}
                                onEnded={handleVideoEnd}
                            />
                        ) : (
                            <div className="course-page__player-placeholder">
                                <span>Selecciona un video para comenzar</span>
                            </div>
                        )}
                    </div>

                    {selectedVideo && !showLocked && (
                        <div className="course-page__lesson-info">
                            <h2 className="course-page__video-title">{selectedVideo.title}</h2>
                            {selectedVideo.description && (
                                <p className="course-page__video-description">{selectedVideo.description}</p>
                            )}
                            {selectedVideo.resourceUrl && (
                                <a
                                    href={selectedVideo.resourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="course-page__resource-link"
                                >
                                    📎 Descarga el recurso de esta lección
                                </a>
                            )}

                            <div className="course-page__lesson-actions">
                                <button
                                    className="course-page__complete-btn"
                                    onClick={markCompleted}
                                    disabled={selectedVideo.completed}
                                >
                                    {selectedVideo.completed ? '✓ Completado' : 'Completar'}
                                </button>
                                <div className="course-page__lesson-nav">
                                    <button disabled={!prevVideo} onClick={() => prevVideo && setSelected(prevVideo)}>‹ Anterior</button>
                                    <button disabled={!nextVideoInList} onClick={() => nextVideoInList && setSelected(nextVideoInList)}>Siguiente ›</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedVideo && !showLocked && streamUrl && (
                        <CommentSection videoId={selectedVideo._id} courseId={course._id} />
                    )}
                </main>

                <VideoList
                    videos={videos}
                    selectedId={selectedVideo?._id}
                    onSelect={handleSelectFromList}
                />
            </div>
        </div>
    );
}
