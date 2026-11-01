import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CourseCard from '../components/CourseCard';
import { resolveCourseThumbnail } from '../utils/courseThumbnails';
import { BRAND_NAME, BRAND_TAGLINE } from '../config/brand';
import '../styles/HomePage.css';

export default function HomePage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const category = searchParams.get('categoria') || '';
    const query = searchParams.get('q') || '';

    // Resultado del catálogo junto a los filtros con los que se pidió:
    // mientras no coincidan con los actuales, se muestra el spinner
    const [catalog, setCatalog] = useState({ key: null, courses: [] });
    const [categories, setCategories] = useState([]);
    const [progressMap, setProgressMap] = useState({});
    const [progressCourses, setProgressCourses] = useState([]);
    const [search, setSearch] = useState(query);

    useEffect(() => {
        api.get('/courses/categories').then(r => setCategories(r.data.categories)).catch(() => {});
    }, []);

    // Progreso del usuario (solo con sesión iniciada)
    useEffect(() => {
        if (!user) return;
        api.get('/progress').then(res => {
            const map = {};
            res.data.progress.forEach(p => { if (p.course) map[p.course._id] = p.percentage; });
            setProgressMap(map);
            setProgressCourses(res.data.progress.filter(p => p.course && p.percentage > 0 && p.percentage < 100));
        }).catch(() => {});
    }, [user]);

    // Catálogo filtrado por categoría y búsqueda (desde la URL, para poder compartir el enlace)
    const filtersKey = `${category}|${query}`;
    useEffect(() => {
        const params = {};
        if (category) params.category = category;
        if (query) params.q = query;
        api.get('/courses', { params })
            .then(res => setCatalog({ key: filtersKey, courses: res.data.courses }))
            .catch(() => setCatalog({ key: filtersKey, courses: [] }));
    }, [category, query, filtersKey]);

    const loading = catalog.key !== filtersKey;
    const courses = catalog.courses;

    const updateFilters = (changes) => {
        const next = new URLSearchParams(searchParams);
        Object.entries(changes).forEach(([k, v]) => v ? next.set(k, v) : next.delete(k));
        setSearchParams(next, { replace: true });
    };

    const handleSearch = (e) => {
        e.preventDefault();
        updateFilters({ q: search.trim() });
    };

    const activeCategoryName = categories.find(c => c.id === category)?.name;

    return (
        <div className="home-page">
            <Navbar />

            <main className="home-page__main">

                {/* ── Hero ── */}
                <section className="home-hero">
                    <h1 className="home-hero__title">
                        {user ? `Hola, ${user.name.split(' ')[0]} 👋` : <>Aprende con los mejores en <span>{BRAND_NAME}</span></>}
                    </h1>
                    <p className="home-hero__subtitle">{BRAND_TAGLINE}</p>

                    <form className="home-hero__search" onSubmit={handleSearch} role="search">
                        <input
                            type="search"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="¿Qué quieres aprender hoy?"
                            aria-label="Buscar cursos"
                        />
                        <button type="submit">Buscar</button>
                    </form>

                    {!user && (
                        <div className="home-hero__ctas">
                            <Link to="/registro" className="home-hero__cta home-hero__cta--primary">Crear cuenta gratis</Link>
                            <Link to="/login" className="home-hero__cta">Iniciar sesión</Link>
                        </div>
                    )}
                </section>

                {/* ── Continuar aprendiendo ── */}
                {progressCourses.length > 0 && (
                    <section className="home-page__continue-section">
                        <h2 className="home-page__section-title">Continuar aprendiendo</h2>
                        <div className="home-page__continue-grid">
                            {progressCourses.map(({ course, percentage }) => (
                                <div
                                    key={course._id}
                                    className="continue-card"
                                    onClick={() => navigate(`/cursos/${course.slug}`)}
                                >
                                    <div className="continue-card__thumb">
                                        {resolveCourseThumbnail(course)
                                            ? <img src={resolveCourseThumbnail(course)} alt={course.title} />
                                            : <div className="continue-card__thumb-placeholder">🎓</div>
                                        }
                                    </div>
                                    <div className="continue-card__info">
                                        <span className="continue-card__title">{course.title}</span>
                                        <div className="continue-card__progress-bar">
                                            <div
                                                className="continue-card__progress-fill"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                        <span className="continue-card__pct">{percentage}% completado</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* ── Catálogo ── */}
                <section>
                    <div className="home-page__header">
                        <h2 className="home-page__catalog-title">
                            {query ? `Resultados para "${query}"` : activeCategoryName || 'Todos los cursos'}
                        </h2>
                    </div>

                    {categories.length > 0 && (
                        <div className="category-chips" role="tablist" aria-label="Categorías">
                            <button
                                className={`category-chip${!category ? ' category-chip--active' : ''}`}
                                onClick={() => updateFilters({ categoria: '' })}
                            >
                                Todas
                            </button>
                            {categories.map(c => (
                                <button
                                    key={c.id}
                                    className={`category-chip${category === c.id ? ' category-chip--active' : ''}`}
                                    onClick={() => updateFilters({ categoria: c.id })}
                                >
                                    {c.name}
                                </button>
                            ))}
                        </div>
                    )}

                    {loading ? (
                        <div className="home-page__loading">
                            <div className="home-page__spinner" />
                        </div>
                    ) : courses.length === 0 ? (
                        <div className="home-page__empty">
                            <p>
                                {query || category
                                    ? 'No encontramos cursos con esos filtros.'
                                    : 'No hay cursos disponibles por el momento.'}
                            </p>
                            {(query || category) && (
                                <button className="category-chip" onClick={() => { setSearch(''); setSearchParams({}, { replace: true }); }}>
                                    Ver todos los cursos
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="home-page__courses-grid">
                            {courses.map(course => (
                                <CourseCard key={course._id} course={course} progress={progressMap[course._id] || 0} />
                            ))}
                        </div>
                    )}
                </section>

                {/* ── Invitación a enseñar ── */}
                {user?.role !== 'instructor' && user?.role !== 'admin' && (
                    <section className="teach-banner">
                        <div>
                            <h2 className="teach-banner__title">¿Sabes algo que otros quieren aprender?</h2>
                            <p className="teach-banner__text">
                                Conviértete en instructor de {BRAND_NAME}, publica tus cursos y gana dinero con cada venta.
                            </p>
                        </div>
                        <Link to="/ser-instructor" className="home-hero__cta home-hero__cta--primary">Enseña en {BRAND_NAME}</Link>
                    </section>
                )}
            </main>

            <Footer />
        </div>
    );
}
