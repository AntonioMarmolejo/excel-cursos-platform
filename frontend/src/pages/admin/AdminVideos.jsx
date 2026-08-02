import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/client';
import AdminModal from '../../components/AdminModal';

const EMPTY = { title: '', description: '', bunnyVideoId: '', duration: 0, order: 1, isPublished: false };

const fmtSecs = s => { const m = Math.floor(s / 60); return `${m}:${String(s % 60).padStart(2, '0')}`; };

export default function AdminVideos() {
    const { courseId } = useParams();
    const [courseName, setCourseName] = useState('');
    const [videos, setVideos] = useState([]);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const loadVideos = () =>
        api.get(`/videos/course/${courseId}`).then(r => setVideos(r.data.videos)).catch(() => {});

    useEffect(() => {
        api.get('/admin/courses').then(r => {
            const c = r.data.courses.find(c => c._id === courseId);
            if (c) setCourseName(c.title);
        }).catch(() => {});
        loadVideos();
    }, [courseId]);

    const openCreate = () => {
        setForm({ ...EMPTY, order: videos.length + 1 });
        setEditing({});
        setError('');
    };
    const openEdit = (v) => {
        setForm({ title: v.title, description: v.description || '', bunnyVideoId: v.bunnyVideoId, duration: v.duration || 0, order: v.order, isPublished: v.isPublished });
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
            <div className="admin-breadcrumb">
                <Link to="/admin/cursos">Cursos</Link> / {courseName || '…'}
            </div>

            <div className="admin-page-header">
                <h1 className="admin-page-title">Videos del curso</h1>
                <button className="btn btn-primary" onClick={openCreate}>+ Nuevo video</button>
            </div>

            <div className="admin-table-wrap">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>#</th><th>Título</th><th>Bunny ID</th>
                            <th>Duración</th><th>Gratis</th><th>Estado</th><th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {videos.length === 0 && (
                            <tr><td colSpan={7} className="admin-empty">No hay videos</td></tr>
                        )}
                        {videos.map(v => (
                            <tr key={v._id}>
                                <td>{v.order}</td>
                                <td className="cell-title">{v.title}</td>
                                <td className="cell-mono">
                                    {v.bunnyVideoId?.slice(0, 18)}…
                                </td>
                                <td>{v.duration > 0 ? fmtSecs(v.duration) : '—'}</td>
                                <td><span className={`badge ${v.isFree ? 'badge-green' : 'badge-gray'}`}>{v.isFree ? 'Sí' : 'No'}</span></td>
                                <td><span className={`badge ${v.isPublished ? 'badge-green' : 'badge-yellow'}`}>{v.isPublished ? 'Publicado' : 'Borrador'}</span></td>
                                <td>
                                    <div className="row-actions">
                                        <button className="btn btn-outline btn-sm" onClick={() => openEdit(v)}>Editar</button>
                                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(v._id)}>Borrar</button>
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
                        {error && <div className="admin-error">{error}</div>}

                        <div className="admin-field">
                            <label>Título *</label>
                            <input name="title" value={form.title} onChange={handleChange} required />
                        </div>

                        <div className="admin-field">
                            <label>Descripción</label>
                            <textarea name="description" value={form.description} onChange={handleChange} />
                        </div>

                        <div className="admin-field">
                            <label>Bunny Video ID *</label>
                            <input name="bunnyVideoId" value={form.bunnyVideoId} onChange={handleChange} required placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
                        </div>

                        <div className="admin-field-row">
                            <div className="admin-field">
                                <label>Orden *</label>
                                <input type="number" name="order" value={form.order} onChange={handleChange} min={1} required />
                            </div>
                            <div className="admin-field">
                                <label>Duración (segundos)</label>
                                <input type="number" name="duration" value={form.duration} onChange={handleChange} min={0} />
                            </div>
                        </div>

                        <div className="admin-field admin-field-check">
                            <input type="checkbox" name="isPublished" id="chk-vid-pub" checked={form.isPublished} onChange={handleChange} />
                            <label htmlFor="chk-vid-pub">Publicado</label>
                        </div>

                        <div className="admin-form-actions">
                            <button type="button" className="btn btn-outline" onClick={() => setEditing(null)}>Cancelar</button>
                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                {saving ? 'Guardando…' : 'Guardar'}
                            </button>
                        </div>
                    </form>
                </AdminModal>
            )}
        </>
    );
}
