import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import AdminModal from '../../components/AdminModal';

const EMPTY = {
    title: '', slug: '', description: '', level: 'basico',
    thumbnail: '', priceLifetime: 0, order: 0,
    instructorName: 'Administrador', isPublished: false,
};

export default function AdminCourses() {
    const [courses, setCourses] = useState([]);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const load = () => api.get('/admin/courses').then(r => setCourses(r.data.courses)).catch(() => {});
    useEffect(() => { load(); }, []);

    const openCreate = () => { setForm(EMPTY); setEditing({}); setError(''); };
    const openEdit = (c) => {
        setForm({
            title: c.title, slug: c.slug, description: c.description,
            level: c.level, thumbnail: c.thumbnail || '',
            priceLifetime: c.price?.lifetime ?? 0,
            order: c.order, instructorName: c.instructor?.name || 'Administrador',
            isPublished: c.isPublished,
        });
        setEditing(c);
        setError('');
    };

    const handleChange = e => {
        const { name, value, type, checked } = e.target;
        setForm(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = async e => {
        e.preventDefault();
        setSaving(true); setError('');
        const payload = {
            title: form.title, slug: form.slug, description: form.description,
            level: form.level, thumbnail: form.thumbnail || undefined,
            price: { lifetime: Number(form.priceLifetime) },
            order: Number(form.order), isPublished: form.isPublished,
            instructor: { name: form.instructorName },
        };
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

    const handleDelete = async (id) => {
        if (!confirm('¿Eliminar este curso y todos sus videos?')) return;
        await api.delete(`/courses/${id}`).catch(() => {});
        load();
    };

    return (
        <>
            <div className="admin-page__header">
                <h1 className="admin-page__title">Cursos</h1>
                <button className="btn btn--primary" onClick={openCreate}>+ Nuevo curso</button>
            </div>

            <div className="admin-table">
                <table className="admin-table__table">
                    <thead>
                        <tr>
                            <th>#</th><th>Título</th><th>Nivel</th>
                            <th>Precio</th><th>Videos</th><th>Estado</th><th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {courses.length === 0 && (
                            <tr><td colSpan={7} className="admin-empty">No hay cursos</td></tr>
                        )}
                        {courses.map(c => (
                            <tr key={c._id}>
                                <td>{c.order}</td>
                                <td className="admin-table__cell--title">{c.title}</td>
                                <td><span className="badge badge--gray">{c.level}</span></td>
                                <td>${c.price?.lifetime?.toFixed(2)}</td>
                                <td>{c.totalVideos}</td>
                                <td>
                                    <span className={`badge ${c.isPublished ? 'badge--green' : 'badge--yellow'}`}>
                                        {c.isPublished ? 'Publicado' : 'Borrador'}
                                    </span>
                                </td>
                                <td>
                                    <div className="admin-table__row-actions">
                                        <Link to={`/admin/cursos/${c._id}/videos`} className="btn btn--outline btn--sm">
                                            Videos
                                        </Link>
                                        <button className="btn btn--outline btn--sm" onClick={() => openEdit(c)}>Editar</button>
                                        <button className="btn btn--danger btn--sm" onClick={() => handleDelete(c._id)}>Borrar</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

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
                                <label>Slug *</label>
                                <input name="slug" value={form.slug} onChange={handleChange} required placeholder="excel-basico" />
                            </div>
                        </div>

                        <div className="admin-form__field">
                            <label>Descripción *</label>
                            <textarea name="description" value={form.description} onChange={handleChange} required />
                        </div>

                        <div className="admin-form__field-row">
                            <div className="admin-form__field">
                                <label>Nivel</label>
                                <select name="level" value={form.level} onChange={handleChange}>
                                    <option value="basico">Básico</option>
                                    <option value="medio">Intermedio</option>
                                    <option value="avanzado">Avanzado</option>
                                </select>
                            </div>
                            <div className="admin-form__field">
                                <label>Precio lifetime ($)</label>
                                <input type="number" name="priceLifetime" value={form.priceLifetime} onChange={handleChange} min={0} step={0.01} />
                            </div>
                        </div>

                        <div className="admin-form__field-row">
                            <div className="admin-form__field">
                                <label>Orden</label>
                                <input type="number" name="order" value={form.order} onChange={handleChange} min={0} />
                            </div>
                            <div className="admin-form__field">
                                <label>Instructor</label>
                                <input name="instructorName" value={form.instructorName} onChange={handleChange} />
                            </div>
                        </div>

                        <div className="admin-form__field">
                            <label>URL thumbnail</label>
                            <input name="thumbnail" value={form.thumbnail} onChange={handleChange} placeholder="https://..." />
                        </div>

                        <div className="admin-form__field admin-form__field--check">
                            <input type="checkbox" name="isPublished" id="chk-published" checked={form.isPublished} onChange={handleChange} />
                            <label htmlFor="chk-published">Publicado</label>
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
