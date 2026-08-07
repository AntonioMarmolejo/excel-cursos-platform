import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import VideoPlayer from '../components/VideoPlayer';
import VideoList from '../components/VideoList';
import LockedOverlay from '../components/LockedOverlay';
import CommentSection from '../components/CommentSection';
import '../styles/CoursePage.css';

export default function CoursePage() {
  const { slug }   = useParams();
  const { user }   = useAuth();
  const navigate   = useNavigate();

  const [course, setCourse]           = useState(null);
  const [videos, setVideos]           = useState([]);
  const [selectedVideo, setSelected]  = useState(null);
  const [streamUrl, setStreamUrl]     = useState(null);
  const [progress, setProgress]       = useState(0);
  const [loadingCourse, setLoadingCourse] = useState(true);
  const [loadingStream, setLoadingStream] = useState(false);
  const [error, setError]             = useState(null);

  // Cargar datos del curso
  useEffect(() => {
    setLoadingCourse(true);
    api.get(`/courses/${slug}`)
      .then(res => {
        setCourse(res.data.course);
        setVideos(res.data.videos);
        setProgress(res.data.progressPercentage || 0);
        // Auto-seleccionar el primer video
        const first = res.data.videos[0];
        if (first) setSelected(first);
      })
      .catch(() => setError('Curso no encontrado'))
      .finally(() => setLoadingCourse(false));
  }, [slug]);

  // Cargar stream URL cuando cambia el video seleccionado
  useEffect(() => {
    if (!selectedVideo || selectedVideo.locked) {
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
  }, [selectedVideo?._id]);

  const handleVideoEnd = useCallback(() => {
    if (!selectedVideo) return;
    // Marcar como completado en el backend
    api.post('/progress/video', {
      courseId: course._id,
      videoId:  selectedVideo._id,
      completed: true,
    }).then(() => {
      setVideos(prev => prev.map(v =>
        v._id === selectedVideo._id ? { ...v, completed: true } : v
      ));
    }).catch(() => {});

    // Auto-avanzar al siguiente video
    const idx  = videos.findIndex(v => v._id === selectedVideo._id);
    const next = videos[idx + 1];
    if (next && !next.locked) setSelected(next);
  }, [selectedVideo, videos, course]);

  const handleSelectVideo = (video) => {
    if (!video.locked || !user) setSelected(video);
    else if (video.locked) setSelected(video); // muestra el overlay
  };

  if (loadingCourse) return <div className="page-loading"><div className="spinner" /></div>;
  if (error)         return <div className="page-error">{error} <button onClick={() => navigate('/')}>Volver</button></div>;

  const showLocked  = selectedVideo?.locked;
  const showLogin   = !user && selectedVideo && !selectedVideo.locked;

  return (
    <div className="course-page">
      <Navbar />

      {/* Header */}
      <header className="course-header">
        {course.thumbnail && (
          <div className="course-header-bg" style={{ backgroundImage: `url(${course.thumbnail})` }} />
        )}
        <div className="course-header-content">
          <button className="back-btn" onClick={() => navigate('/')}>← Cursos</button>
          <div className="course-meta">
            <span className="course-level">{course.level}</span>
          </div>
          <h1 className="course-title">{course.title}</h1>
          {course.instructor?.name && (
            <p className="course-instructor">Por {course.instructor.name}</p>
          )}
          <div className="course-stats">
            <span>{course.totalVideos} videos</span>
            {course.totalDuration > 0 && (
              <span>{Math.round(course.totalDuration / 60)} min</span>
            )}
          </div>
        </div>
      </header>

      {/* Main layout */}
      <div className="course-body">
        <main className="course-main">
          {/* Player area */}
          <div className="player-area">
            {loadingStream ? (
              <div className="player-loading"><div className="spinner" /></div>
            ) : showLocked ? (
              <LockedOverlay />
            ) : showLogin ? (
              <LockedOverlay />
            ) : streamUrl ? (
              <VideoPlayer
                src={streamUrl}
                title={selectedVideo?.title}
                onEnded={handleVideoEnd}
              />
            ) : (
              <div className="player-placeholder">
                <span>Selecciona un video para comenzar</span>
              </div>
            )}
          </div>

          {/* Info del video activo */}
          {selectedVideo && !showLocked && (
            <div className="video-info">
              <h2 className="video-title">{selectedVideo.title}</h2>
              {selectedVideo.description && (
                <p className="video-description">{selectedVideo.description}</p>
              )}
            </div>
          )}

          {/* Comentarios */}
          {selectedVideo && !showLocked && streamUrl && (
            <CommentSection videoId={selectedVideo._id} courseId={course._id} />
          )}
        </main>

        {/* Sidebar */}
        <VideoList
          videos={videos}
          selectedId={selectedVideo?._id}
          onSelect={handleSelectVideo}
          progress={progress}
        />
      </div>
    </div>
  );
}
