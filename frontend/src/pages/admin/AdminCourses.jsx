import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api, { resolveFileUrl } from '../../api/client';
import AdminModal from '../../components/AdminModal';

const EMPTY = {
    title: '', slug: '', description: '', level: 'basico',
    thumbnail: '', priceLifetime: 0, order: 0,
    category: 'otros', isPublished: false,
};

const REVIEW_BADGE = {
    pending: ['badge--yellow', 'En revisión'],
    rejected: ['badge--red', 'Rechazado'],
};

// "Excel Básico 2026" → "excel-basico-2026"
const slugify = (str) => str
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// Gestión de cursos compartida por el admin (todos los cursos + revisión)
// y el instructor (solo sus cursos + envío a revisión).
export default function AdminCourses({ mode = 'admin' }) {
    const isAdmin = mode === 'admin';
    const basePath = isAdmin ? '/admin/cursos' : '/instructor/cursos';

    const [courses, setCourses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [searchParams] = useSearchParams();
    const [statusFilter, setStatusFilter] = useState(() => searchParams.get('estado') || '');
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY);
    const [slugTouched, setSlugTouched] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [uploadingThumb, setUploadingThumb] = useState(false);
    const [thumbError, setThumbError] = useState('');
    const [reviewing, setReviewing] = useState(null);   // curso que el admin va a rechazar
    const [rejectReason, setRejectReason] = useState('');
    const thumbInputRef = useRef(null);

    const load = () => {
        const req = isAdmin
            ? api.get('/admin/courses', { params: statusFilter ? { reviewStatus: statusFilter } : {} })
            : api.get('/courses/mine');
        return req.then(r => setCourses(r.data.courses)).catch(() => {});
    };
    useEffect(() => { load(); }, [statusFilter, mode]);
    useEffect(() => {
        api.get('/courses/categories').then(r => setCategories(r.data.categories)).catch(() => {});
    }, []);

    const openCreate = () => { setForm(EMPTY); setEditing({}); setError(''); setSlugTouched(false); };
    const openEdit = (c) => {
        setForm({
            title: c.title, slug: c.slug, description: c.description,
            level: c.level, thumbnail: c.thumbnail || '',
            priceLifetime: c.price?.lifetime ?? 0,
            order: c.order, category: c.category || 'otros',
            isPublished: c.isPublished,
        });
        setEditing(c);
        setError('');
        setSlugTouched(true);
    };

    const handleChange = e => {
        const { name, value, type, checked } = e.target;
        if (name === 'slug') setSlugTouched(true);
        setForm(p => {
            const next = { ...p, [name]: type === 'checkbox' ? checked : value };
            // Mientras se crea el curso, el slug sigue al título hasta que se edite a mano
            if (name === 'title' && !slugTouched) next.slug = slugify(value);
            return next;
        });
    };

    const handleSubmit = async e => {
        e.preventDefault();
        setSaving(true); setError('');
        const payload = {
            title: form.title, slug: form.slug, description: form.description,
            level: form.level, category: form.category, thumbnail: form.thumbnail || undefined,
            price: { lifetime: Number(form.priceLifetime) },
        };
        if (isAdmin) Object.assign(payload, { order: Number(form.order), isPublished: form.isPublished });
        try {
            editing._id
                ? await api.put(`/courses/${editing._id}`, payload)
                : await api.post('/courses', payload);
            setEditing(null);
            load();
        } catch (err) {
            setError(err.response?.data?.message || 'Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const handleThumbnailUpload = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file || !editing?._id) return;

        setThumbError('');
        setUploadingThumb(true);
        try {
            const formData = new FormData();
            formData.append('thumbnail', file);
            const res = await api.put(`/courses/${editing._id}/thumbnail`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setForm(p => ({ ...p, thumbnail: res.data.course.thumbnail }));
            load();
        } catch (err) {
            setThumbError(err.response?.data?.message || 'Error al subir la imagen');
        } finally {
            setUploadingThumb(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Eliminar este curso y todos sus videos?')) return;
        try {
            await api.delete(`/courses/${id}`);
        } catch (err) {
            alert(err.response?.data?.message || 'No se pudo eliminar el curso');
        }
        load();
    };

    const handleSubmitForReview = async (c) => {
        if (!confirm(`¿Enviar "${c.title}" a revisión? Te avisaremos por correo cuando esté publicado.`)) return;
        setNotice('');
        try {
            await api.post(`/courses/${c._id}/submit`);
            setNotice(`"${c.title}" fue enviado a revisión.`);
        } catch (err) {
            alert(err.response?.data?.message || 'No se pudo enviar a revisión');
        }
        load();
    };

    const handleReview = async (c, action, reason = '') => {
        try {
            await api.put(`/admin/courses/${c._id}/review`, { action, reason });
            setReviewing(null);
            setRejectReason('');
            load();
        } catch (err) {
            alert(err.response?.data?.message || 'No se pudo guardar la revisión');
        }
    };

    const renderStatus = (c) => c.isPublished
        ? <span className="badge badge--green">Publicado</span>
        : (
            <span className={`badge ${REVIEW_BADGE[c.reviewStatus]?.[0] || 'badge--gray'}`}>
                {REVIEW_BADGE[c.reviewStatus]?.[1] || 'Borrador'}
            </span>
        );

    const columns = isAdmin ? 8 : 6;

    return (
        <>
            <div className="admin-page__header">
                <h1 className="admin-page__title">{isAdmin ? 'Cursos' : 'Mis cursos'}</h1>
                <div className="admin-page__header-actions">
                    {isAdmin && (
                        <select className="admin-search" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                            <option value="">Todos los estados</option>
                            <option value="pending">En revisión</option>
                            <option value="approved">Aprobados</option>
                            <option value="draft">Borradores</option>
                            <option value="rejected">Rechazados</option>
                        </select>
                    )}
                    <button className="btn btn--primary" onClick={openCreate}>+ Nuevo curso</button>
                </div>
            </div>

            {!isAdmin && (
                <p className="admin-form__hint u-mb-1">
                    Crea tu curso, sube sus videos y envíalo a revisión. Lo publicaremos en el catálogo cuando esté aprobado.
                </p>
            )}
            {notice && <div className="admin-notice u-mb-1">{notice}</div>}

            <div className="admin-table">
                <table className="admin-table__table">
                    <thead>
                        <tr>
                            {isAdmin && <th>#</th>}
                            <th>Título</th>
                            {isAdmin && <th>Instructor</th>}
                            <th>Nivel</th><th>Precio</th><th>Videos</th><th>Estado</th><th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {courses.length === 0 && (
                            <tr><td colSpan={columns} className="admin-empty">
                                {isAdmin ? 'No hay cursos' : 'Aún no has creado cursos. ¡Empieza con "+ Nuevo curso"!'}
                            </td></tr>
                        )}
                        {courses.map(c => (
                            <tr key={c._id}>
                                {isAdmin && <td>{c.order}</td>}
                                <td className="admin-table__cell--title">
                                    {c.title}
                                    {c.reviewStatus === 'rejected' && c.rejectionReason && (
                                        <p className="admin-form__thumbnail-error">Motivo: {c.rejectionReason}</p>
                                    )}
                                </td>
                                {isAdmin && <td>{c.instructor?.name || '—'}</td>}
                                <td><span className="badge badge--gray">{c.level}</span></td>
                                <td>${c.price?.lifetime?.toFixed(2)}</td>
                                <td>{c.totalVideos}</td>
                                <td>{renderStatus(c)}</td>
                                <td>
                                    <div className="admin-table__row-actions">
                                        <Link to={`${basePath}/${c._id}/videos`} className="btn btn--outline btn--sm">
                                            Videos
                                        </Link>
                                        <Link to={`/cursos/${c.slug}`} className="btn btn--outline btn--sm" target="_blank">
                                            Ver
                                        </Link>
                                        <button className="btn btn--outline btn--sm" onClick={() => openEdit(c)}>Editar</button>

                                        {!isAdmin && ['draft', 'rejected'].includes(c.reviewStatus) && (
                                            <button className="btn btn--primary btn--sm" onClick={() => handleSubmitForReview(c)}>
                                                Enviar a revisión
                                            </button>
                                        )}
                                        {isAdmin && c.reviewStatus === 'pending' && (
                                            <>
                                                <button className="btn btn--primary btn--sm" onClick={() => handleReview(c, 'approve')}>Aprobar</button>
                                                <button className="btn btn--danger btn--sm" onClick={() => { setReviewing(c); setRejectReason(''); }}>Rechazar</button>
                                            </>
                                        )}
                                        {(isAdmin || !c.isPublished) && (
                                            <button className="btn btn--danger btn--sm" onClick={() => handleDelete(c._id)}>Borrar</button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {reviewing && (
                <AdminModal title={`Rechazar "${reviewing.title}"`} onClose={() => setReviewing(null)}>
                    <form className="admin-form" onSubmit={e => { e.preventDefault(); handleReview(reviewing, 'reject', rejectReason); }}>
                        <div className="admin-form__field">
                            <label>¿Qué debe corregir el instructor? *</label>
                            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} required
                                placeholder="Se le enviará por correo y lo verá en su panel" />
                        </div>
                        <div className="admin-form__actions">
                            <button type="button" className="btn btn--outline" onClick={() => setReviewing(null)}>Cancelar</button>
                            <button type="submit" className="btn btn--danger">Rechazar curso</button>
                        </div>
                    </form>
                </AdminModal>
            )}

            {editing !== null && (
                <AdminModal title={editing._id ? 'Editar curso' : 'Nuevo curso'} onClose={() => setEditing(null)} wide>
                    <form className="admin-form" onSubmit={handleSubmit}>
                        {error && <div className="admin-form__error">{error}</div>}

                        <div className="admin-form__field-row">
                            <div className="admin-form__field">
                                <label>Título *</label>
                                <input name="title" value={form.title} onChange={handleChange} required />
                            </div>
                            <div className="admin-form__field">
                                <label>Slug (URL) *</label>
                                <input name="slug" value={form.slug} onChange={handleChange} required placeholder="mi-curso" />
                            </div>
                        </div>

                        <div className="admin-form__field">
                            <label>Descripción *</label>
                            <textarea name="description" value={form.description} onChange={handleChange} required />
                        </div>

                        <div className="admin-form__field-row">
                            <div className="admin-form__field">
                                <label>Categoría</label>
                                <select name="category" value={form.category} onChange={handleChange}>
                                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                </select>
                            </div>
                            <div className="admin-form__field">
                                <label>Nivel</label>
                                <select name="level" value={form.level} onChange={handleChange}>
                                    <option value="basico">Básico</option>
                                    <option value="medio">Intermedio</option>
                                    <option value="avanzado">Avanzado</option>
                                </select>
                            </div>
                        </div>

                        <div className="admin-form__field-row">
                            <div className="admin-form__field">
                                <label>Precio de por vida ($)</label>
                                <input type="number" name="priceLifetime" value={form.priceLifetime} onChange={handleChange} min={0} step={0.01} />
                            </div>
                            {isAdmin && (
                                <div className="admin-form__field">
                                    <label>Orden en el catálogo</label>
                                    <input type="number" name="order" value={form.order} onChange={handleChange} min={0} />
                                </div>
                            )}
                        </div>

                        <div className="admin-form__field">
                            <label>Imagen de portada</label>

                            {form.thumbnail && (
                                <img
                                    src={resolveFileUrl(form.thumbnail) || form.thumbnail}
                                    alt="Portada actual"
                                    className="admin-form__thumbnail-preview"
                                />
                            )}

                            <input name="thumbnail" value={form.thumbnail} onChange={handleChange} placeholder="https://... (URL externa)" />

                            {editing?._id ? (
                                <>
                                    <button
                                        type="button"
                                        className="btn btn--outline btn--sm"
                                        onClick={() => thumbInputRef.current?.click()}
                                        disabled={uploadingThumb}
                                    >
                                        {uploadingThumb ? 'Subiendo…' : '📤 Subir imagen desde tu equipo'}
                                    </button>
                                    <input
                                        ref={thumbInputRef}
                                        type="file"
                                        accept="image/png, image/jpeg, image/webp, image/gif"
                                        onChange={handleThumbnailUpload}
                                        hidden
                                    />
                                    {thumbError && <p className="admin-form__thumbnail-error">{thumbError}</p>}
                                </>
                            ) : (
                                <p className="admin-form__hint">Guarda el curso primero para poder subir una imagen desde tu equipo.</p>
                            )}
                        </div>

                        {isAdmin && (
                            <div className="admin-form__field admin-form__field--check">
                                <input type="checkbox" name="isPublished" id="chk-published" checked={form.isPublished} onChange={handleChange} />
                                <label htmlFor="chk-published">Publicado</label>
                            </div>
                        )}

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
