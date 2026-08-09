import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/client';
import AdminModal from '../../components/AdminModal';

const EMPTY = { title: '', description: '', section: '', bunnyVideoId: '', resourceUrl: '', duration: 0, order: 1, isPublished: false };

const fmtSecs = s => { const m = Math.floor(s / 60); return `${m}:${String(s % 60).padStart(2, '0')}`; };

export default function AdminVideos() {
    const { courseId } = useParams();
    const [courseName, setCourseName] = useState('');
    const [videos, setVideos] = useState([]);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [showBackToTop, setShowBackToTop] = useState(false);

    const loadVideos = () =>
        api.get(`/videos/course/${courseId}`).then(r => setVideos(r.data.videos)).catch(() => {});

    // Secciones ya usadas en este curso, para sugerirlas al crear/editar un video
    const sectionOptions = useMemo(
        () => [...new Set(videos.map(v => v.section).filter(Boolean))],
        [videos]
    );

    useEffect(() => {
        api.get('/admin/courses').then(r => {
            const c = r.data.courses.find(c => c._id === courseId);
            if (c) setCourseName(c.title);
        }).catch(() => {});
        loadVideos();
    }, [courseId]);

    // Muestra el botón de "volver arriba" solo después de bajar un poco
    useEffect(() => {
        const onScroll = () => setShowBackToTop(window.scrollY > 300);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

    const openCreate = () => {
        setForm({ ...EMPTY, order: videos.length + 1 });
        setEditing({});
        setError('');
    };
    const openEdit = (v) => {
        setForm({
            title: v.title, description: v.description || '', section: v.section || '',
            bunnyVideoId: v.bunnyVideoId, resourceUrl: v.resourceUrl || '',
            duration: v.duration || 0, order: v.order, isPublished: v.isPublished,
        });
        setEditing(v);
        setError('');
    };

    const handleChange = e => {
        const { name, value, type, checked } = e.target;
        setForm(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = async e => {
        e.preventDefault();
        setSaving(true); setError('');
        const payload = { ...form, course: courseId, duration: Number(form.duration), order: Number(form.order) };
        try {
            editing._id
                ? await api.put(`/videos/${editing._id}`, payload)
                : await api.post('/videos', payload);
            setEditing(null);
            loadVideos();
        } catch (err) {
            setError(err.response?.data?.message || 'Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Eliminar este video?')) return;
        await api.delete(`/videos/${id}`).catch(() => {});
        loadVideos();
    };

    return (
        <>
            <div className="admin-page__breadcrumb">
                <Link to="/admin/cursos">Cursos</Link> / {courseName || '…'}
            </div>

            <div className="admin-page__header">
                <h1 className="admin-page__title">Videos del curso</h1>
            </div>

            <button className="admin-fab admin-fab--new" onClick={openCreate}>+ Nuevo video</button>

            <button
                type="button"
                className={`admin-fab admin-fab--top${showBackToTop ? ' admin-fab--visible' : ''}`}
                onClick={scrollToTop}
                title="Volver arriba"
                aria-label="Volver arriba"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="18 15 12 9 6 15" />
                </svg>
            </button>

            <div className="admin-table">
                <table className="admin-table__table">
                    <thead>
                        <tr>
                            <th>#</th><th>Título</th><th>Sección</th><th>Bunny ID</th>
                            <th>Duración</th><th>Gratis</th><th>Estado</th><th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {videos.length === 0 && (
                            <tr><td colSpan={8} className="admin-empty">No hay videos</td></tr>
                        )}
                        {videos.map(v => (
                            <tr key={v._id}>
                                <td>{v.order}</td>
                                <td className="admin-table__cell--title">{v.title}</td>
                                <td className="admin-table__cell--muted-sm">{v.section || '—'}</td>
                                <td className="admin-table__cell--mono">
                                    {v.bunnyVideoId?.slice(0, 18)}…
                                </td>
                                <td>{v.duration > 0 ? fmtSecs(v.duration) : '—'}</td>
                                <td><span className={`badge ${v.isFree ? 'badge--green' : 'badge--gray'}`}>{v.isFree ? 'Sí' : 'No'}</span></td>
                                <td><span className={`badge ${v.isPublished ? 'badge--green' : 'badge--yellow'}`}>{v.isPublished ? 'Publicado' : 'Borrador'}</span></td>
                                <td>
                                    <div className="admin-table__row-actions">
                                        <button className="btn btn--outline btn--sm" onClick={() => openEdit(v)}>Editar</button>
                                        <button className="btn btn--danger btn--sm" onClick={() => handleDelete(v._id)}>Borrar</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {editing !== null && (
                <AdminModal title={editing._id ? 'Editar video' : 'Nuevo video'} onClose={() => setEditing(null)}>
                    <form className="admin-form" onSubmit={handleSubmit}>
                        {error && <div className="admin-form__error">{error}</div>}

                        <div className="admin-form__field">
                            <label>Título *</label>
                            <input name="title" value={form.title} onChange={handleChange} required />
                        </div>

                        <div className="admin-form__field">
                            <label>Descripción</label>
                            <textarea name="description" value={form.description} onChange={handleChange} />
                        </div>

                        <div className="admin-form__field">
                            <label>Bunny Video ID *</label>
                            <input name="bunnyVideoId" value={form.bunnyVideoId} onChange={handleChange} required placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
                        </div>

                        <div className="admin-form__field">
                            <label>Sección / módulo</label>
                            <input
                                name="section"
                                list="section-options"
                                value={form.section}
                                onChange={handleChange}
                                placeholder="Ej. El entorno de Excel"
                                autoComplete="off"
                            />
                            <datalist id="section-options">
                                {sectionOptions.map(s => <option key={s} value={s} />)}
                            </datalist>
                        </div>

                        <div className="admin-form__field">
                            <label>URL de recurso descargable (opcional)</label>
                            <input name="resourceUrl" value={form.resourceUrl} onChange={handleChange} placeholder="https://... (planilla, PDF, etc.)" />
                        </div>

                        <div className="admin-form__field-row">
                            <div className="admin-form__field">
                                <label>Orden *</label>
                                <input type="number" name="order" value={form.order} onChange={handleChange} min={1} required />
                            </div>
                            <div className="admin-form__field">
                                <label>Duración (segundos)</label>
                                <input type="number" name="duration" value={form.duration} onChange={handleChange} min={0} />
                            </div>
                        </div>

                        <div className="admin-form__field admin-form__field--check">
                            <input type="checkbox" name="isPublished" id="chk-vid-pub" checked={form.isPublished} onChange={handleChange} />
                            <label htmlFor="chk-vid-pub">Publicado</label>
                        </div>

                        <div className="admin-form__actions">
                            <button type="button" className="btn btn--outline" onClick={() => setEditing(null)}>Cancelar</button>
                            <button type="submit" className="btn btn--primary" disabled={saving}>
                                {saving ? 'Guardando…' : 'Guardar'}
                            </button>
                        </div>
                    </form>
                </AdminModal>
            )}
        </>
    );
}
