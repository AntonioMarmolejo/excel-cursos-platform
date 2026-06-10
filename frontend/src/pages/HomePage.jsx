import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import Navbar from '../components/Navbar';
import './HomePage.css';

const LEVEL_LABEL = { basico: 'Básico', medio: 'Intermedio', avanzado: 'Avanzado' };

function formatDuration(secs) {
    const h = Math.floor(secs / 3600);
    const m = Math.round((secs % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m} min`;
}

export default function HomePage() {
    const [courses, setCourses] = useState([]);
    const [progressMap, setProgressMap] = useState({});
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        Promise.all([
            api.get('/courses'),
            api.get('/progress'),
        ]).then(([coursesRes, progressRes]) => {
            setCourses(coursesRes.data.courses);
            const map = {};
            progressRes.data.progress.forEach(p => {
                map[p.course._id] = {
                    percentage: p.percentage,
                    completedAt: p.completedAt,
                };
            });
            setProgressMap(map);
        }).catch(() => {
            api.get('/courses')
                .then(res => setCourses(res.data.courses))
                .catch(() => {});
        }).finally(() => setLoading(false));
    }, []);

    const inProgress = courses.filter(c => {
        const p = progressMap[c._id];
        return p && p.percentage > 0 && p.percentage < 100;
    });

    return (
        <div className="home-page">
            <Navbar />

            <main className="home-main">

                {/* ── Continuar aprendiendo ── */}
                {!loading && inProgress.length > 0 && (
                    <section className="continue-section">
                        <h2 className="section-title">Continuar aprendiendo</h2>
                        <div className="continue-grid">
                            {inProgress.map(course => {
                                const prog = progressMap[course._id];
                                return (
                                    <div
                                        key={course._id}
                                        className="continue-card"
                                        onClick={() => navigate(`/cursos/${course.slug}`)}
                                    >
                                        <div className="continue-thumb">
                                            {course.thumbnail
                                                ? <img src={course.thumbnail} alt={course.title} />
                                                : <div className="continue-thumb-placeholder">📊</div>
                                            }
                                        </div>
                                        <div className="continue-info">
                                            <span className="continue-title">{course.title}</span>
                                            <div className="continue-progress-bar">
                                                <div
                                                    className="continue-progress-fill"
                                                    style={{ width: `${prog.percentage}%` }}
                                                />
                                            </div>
                                            <span className="continue-pct">{prog.percentage}% completado</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* ── Catálogo ── */}
                <section>
                    <div className="home-header">
                        <h1>Todos los cursos</h1>
                        <p>Aprende Excel desde cero hasta nivel avanzado</p>
                    </div>

                    {loading ? (
                        <div className="home-loading">
                            <div className="home-spinner" />
                        </div>
                    ) : courses.length === 0 ? (
                        <div className="home-empty">
                            <p>No hay cursos disponibles por el momento.</p>
                        </div>
                    ) : (
                        <div className="courses-grid">
                            {courses.map(course => {
                                const prog = progressMap[course._id] || { percentage: 0 };
                                const isCompleted = prog.percentage === 100;
                                const isStarted   = prog.percentage > 0;

                                return (
                                    <article
                                        key={course._id}
                                        className="course-card"
                                        onClick={() => navigate(`/cursos/${course.slug}`)}
                                    >
                                        <div className="card-thumbnail">
                                            {course.thumbnail
                                                ? <img src={course.thumbnail} alt={course.title} />
                                                : <div className="card-thumbnail-placeholder">📊</div>
                                            }
                                            <span className={`card-level card-level--${course.level}`}>
                                                {LEVEL_LABEL[course.level] || course.level}
                                            </span>
                                            {isCompleted && (
                                                <span className="card-completed-badge">✓</span>
                                            )}
                                        </div>

                                        <div className="card-body">
                                            <h2 className="card-title">{course.title}</h2>
                                            <p className="card-desc">{course.description}</p>

                                            <div className="card-stats">
                                                {course.totalVideos > 0 && <span>{course.totalVideos} videos</span>}
                                                {course.totalDuration > 0 && <span>{formatDuration(course.totalDuration)}</span>}
                                            </div>

                                            {isStarted && (
                                                <div className="card-progress-wrap">
                                                    <div className="card-progress-bar">
                                                        <div
                                                            className="card-progress-fill"
                                                            style={{ width: `${prog.percentage}%` }}
                                                        />
                                                    </div>
                                                    <span className="card-progress-pct">{prog.percentage}%</span>
                                                </div>
                                            )}

                                            <div className="card-footer">
                                                {isCompleted ? (
                                                    <span className="card-price card-price--done">✓ Completado</span>
                                                ) : (
                                                    <span className="card-price">${course.price?.lifetime?.toFixed(2)}</span>
                                                )}
                                                <button
                                                    className={`card-btn${isCompleted ? ' card-btn--done' : ''}`}
                                                    onClick={e => { e.stopPropagation(); navigate(`/cursos/${course.slug}`); }}
                                                >
                                                    {isCompleted ? 'Repasar' : isStarted ? 'Continuar →' : 'Comenzar →'}
                                                </button>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
