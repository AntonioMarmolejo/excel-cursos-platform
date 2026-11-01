import { useNavigate } from 'react-router-dom';
import { resolveCourseThumbnail } from '../utils/courseThumbnails';
import '../styles/HomePage.css';

const LEVEL_LABEL = { basico: 'Básico', medio: 'Intermedio', avanzado: 'Avanzado' };

function formatDuration(secs) {
    const h = Math.floor(secs / 3600);
    const m = Math.round((secs % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m} min`;
}

// Tarjeta de curso del catálogo. `progress` es opcional (solo usuarios autenticados).
export default function CourseCard({ course, progress = 0, showInstructor = true }) {
    const navigate = useNavigate();
    const isCompleted = progress === 100;
    const isStarted = progress > 0;
    const thumb = resolveCourseThumbnail(course);
    const goToCourse = () => navigate(`/cursos/${course.slug}`);

    return (
        <article className="course-card" onClick={goToCourse}>
            <div className="course-card__thumbnail">
                {thumb
                    ? <img src={thumb} alt={course.title} />
                    : <div className="course-card__thumbnail-placeholder">🎓</div>
                }
                <span className={`course-card__level course-card__level--${course.level}`}>
                    {LEVEL_LABEL[course.level] || course.level}
                </span>
                {isCompleted && (
                    <span className="course-card__completed-badge">✓</span>
                )}
            </div>

            <div className="course-card__body">
                {course.categoryName && <span className="course-card__category">{course.categoryName}</span>}
                <h2 className="course-card__title">{course.title}</h2>
                {showInstructor && course.instructor?.name && (
                    <span className="course-card__instructor">por {course.instructor.name}</span>
                )}
                <p className="course-card__desc">{course.description}</p>

                <div className="course-card__stats">
                    {course.totalVideos > 0 && <span>{course.totalVideos} videos</span>}
                    {course.totalDuration > 0 && <span>{formatDuration(course.totalDuration)}</span>}
                </div>

                {isStarted && (
                    <div className="course-card__progress-wrap">
                        <div className="course-card__progress-bar">
                            <div
                                className="course-card__progress-fill"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <span className="course-card__progress-pct">{progress}%</span>
                    </div>
                )}

                <div className="course-card__footer">
                    {isCompleted ? (
                        <span className="course-card__price course-card__price--done">✓ Completado</span>
                    ) : (
                        <span className="course-card__price">${course.price?.lifetime?.toFixed(2)}</span>
                    )}
                    <button
                        className={`course-card__btn${isCompleted ? ' course-card__btn--done' : ''}`}
                        onClick={e => { e.stopPropagation(); goToCourse(); }}
                    >
                        {isCompleted ? 'Repasar' : isStarted ? 'Continuar →' : 'Ver curso →'}
                    </button>
                </div>
            </div>
        </article>
    );
}
