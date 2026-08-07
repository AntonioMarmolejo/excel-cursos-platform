import { useEffect, useRef, useState } from 'react';
import api from '../../api/client';
import AdminModal from '../../components/AdminModal';

export default function AdminUsers() {
    const [users, setUsers]     = useState([]);
    const [total, setTotal]     = useState(0);
    const [page, setPage]       = useState(1);
    const [search, setSearch]   = useState('');
    const [courses, setCourses] = useState([]);
    const [selected, setSelected] = useState(null);
    const [subForm, setSubForm] = useState({ plan: 'lifetime', endDate: '' });
    const [saving, setSaving]   = useState(false);
    const searchTimer = useRef(null);

    const fetchUsers = (q = search, p = page) =>
        api.get('/admin/users', { params: { search: q, page: p, limit: 15 } })
            .then(r => { setUsers(r.data.users); setTotal(r.data.total); })
            .catch(() => {});

    useEffect(() => { fetchUsers(); }, []);
    useEffect(() => {
        api.get('/admin/courses').then(r => setCourses(r.data.courses)).catch(() => {});
    }, []);

    const handleSearch = e => {
        const val = e.target.value;
        setSearch(val);
        clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => { setPage(1); fetchUsers(val, 1); }, 400);
    };

    const openAccess = (u) => {
        setSelected(u);
        setSubForm({ plan: u.subscription?.plan || 'lifetime', endDate: '' });
    };

    const refreshSelected = async () => {
        const r = await api.get('/admin/users', { params: { search, page, limit: 15 } });
        setUsers(r.data.users);
        setSelected(prev => r.data.users.find(u => u._id === prev._id) || prev);
    };

    const grantCourse = async (courseId) => {
        setSaving(true);
        await api.put(`/admin/users/${selected._id}/access`, { action: 'grant-course', courseId }).catch(() => {});
        await refreshSelected();
        setSaving(false);
    };

    const revokeCourse = async (courseId) => {
        setSaving(true);
        await api.put(`/admin/users/${selected._id}/access`, { action: 'revoke-course', courseId }).catch(() => {});
        await refreshSelected();
        setSaving(false);
    };

    const setSubscription = async e => {
        e.preventDefault();
        setSaving(true);
        await api.put(`/admin/users/${selected._id}/access`, { action: 'set-subscription', ...subForm }).catch(() => {});
        await refreshSelected();
        setSaving(false);
    };

    const cancelSub = async () => {
        if (!confirm('¿Cancelar suscripción de este usuario?')) return;
        await api.put(`/admin/users/${selected._id}/access`, { action: 'cancel-subscription' }).catch(() => {});
        fetchUsers();
        setSelected(null);
    };

    const subBadge = (u) => {
        const s = u.subscription;
        if (!s?.plan) return <span className="badge badge--gray">Sin plan</span>;
        const cls = s.status === 'active' ? 'badge--green' : s.status === 'cancelled' ? 'badge--red' : 'badge--yellow';
        return <span className={`badge ${cls}`}>{s.plan} · {s.status}</span>;
    };

    const pages = Math.ceil(total / 15);

    const hasAccess = (courseId) =>
        selected?.subscription?.courseAccess?.some(id =>
            (typeof id === 'string' ? id : id?.toString()) === courseId
        );

    return (
        <>
            <div className="admin-page__header">
                <h1 className="admin-page__title">Usuarios</h1>
                <input className="admin-search" placeholder="Buscar por nombre o email…" value={search} onChange={handleSearch} />
            </div>

            <div className="admin-table">
                <table className="admin-table__table">
                    <thead>
                        <tr>
                            <th>Nombre</th><th>Email</th><th>Suscripción</th>
                            <th>Registro</th><th>Último acceso</th><th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length === 0 && <tr><td colSpan={6} className="admin-empty">No hay usuarios</td></tr>}
                        {users.map(u => (
                            <tr key={u._id}>
                                <td className="admin-table__cell--title">{u.name}</td>
                                <td className="admin-table__cell--muted">{u.email}</td>
                                <td>{subBadge(u)}</td>
                                <td className="admin-table__cell--muted-sm">
                                    {new Date(u.createdAt).toLocaleDateString('es')}
                                </td>
                                <td className="admin-table__cell--muted-sm">
                                    {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('es') : '—'}
                                </td>
                                <td>
                                    <button className="btn btn--outline btn--sm" onClick={() => openAccess(u)}>
                                        Acceso
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {pages > 1 && (
                <div className="pagination">
                    {Array.from({ length: pages }, (_, i) => (
                        <button
                            key={i}
                            className={`btn btn--sm ${i + 1 === page ? 'btn--primary' : 'btn--outline'}`}
                            onClick={() => { setPage(i + 1); fetchUsers(search, i + 1); }}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
            )}

            {selected && (
                <AdminModal title={`Acceso — ${selected.name}`} onClose={() => setSelected(null)} wide>
                    <div className="modal__sections">

                        {/* Suscripción global */}
                        <section>
                            <p className="admin-section-label">Suscripción global</p>
                            <form className="admin-form" onSubmit={setSubscription}>
                                <div className="admin-form__field-row">
                                    <div className="admin-form__field">
                                        <label>Plan</label>
                                        <select value={subForm.plan} onChange={e => setSubForm(p => ({ ...p, plan: e.target.value }))}>
                                            <option value="mensual">Mensual</option>
                                            <option value="anual">Anual</option>
                                            <option value="lifetime">Lifetime</option>
                                        </select>
                                    </div>
                                    {subForm.plan !== 'lifetime' && (
                                        <div className="admin-form__field">
                                            <label>Expira</label>
                                            <input type="date" value={subForm.endDate}
                                                onChange={e => setSubForm(p => ({ ...p, endDate: e.target.value }))} />
                                        </div>
                                    )}
                                </div>
                                <div className="admin-form__actions">
                                    {selected.subscription?.status === 'active' && (
                                        <button type="button" className="btn btn--danger btn--sm" onClick={cancelSub}>
                                            Cancelar suscripción
                                        </button>
                                    )}
                                    <button type="submit" className="btn btn--primary" disabled={saving}>Activar</button>
                                </div>
                            </form>
                        </section>

                        <hr className="admin-divider" />

                        {/* Acceso individual por curso */}
                        <section>
                            <p className="admin-section-label">Acceso por curso</p>
                            <div className="course-access">
                                {courses.map(c => (
                                    <div key={c._id} className="course-access__row">
                                        <span className="course-access__title">{c.title}</span>
                                        {hasAccess(c._id) ? (
                                            <button className="btn btn--danger btn--sm" onClick={() => revokeCourse(c._id)} disabled={saving}>
                                                Revocar
                                            </button>
                                        ) : (
                                            <button className="btn btn--outline btn--sm" onClick={() => grantCourse(c._id)} disabled={saving}>
                                                Dar acceso
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>

                    </div>
                </AdminModal>
            )}
        </>
    );
}
