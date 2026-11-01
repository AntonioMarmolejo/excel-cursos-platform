import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import AdminModal from '../../components/AdminModal';

const TABS = [
    { id: 'pending', label: 'Pendientes' },
    { id: 'approved', label: 'Aprobados' },
    { id: 'rejected', label: 'Rechazados' },
];

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

// Solo se muestran enlaces http(s) como clicables
const safeUrl = (url) => /^https?:\/\//i.test(url || '') ? url : null;

export default function AdminInstructors() {
    const [tab, setTab] = useState('pending');
    const [result, setResult] = useState({ tab: null, applications: [] });
    const [rejecting, setRejecting] = useState(null);
    const [reason, setReason] = useState('');

    const load = useCallback(() =>
        api.get('/admin/instructor-applications', { params: { status: tab } })
            .then(r => setResult({ tab, applications: r.data.applications }))
            .catch(() => setResult({ tab, applications: [] })),
    [tab]);
    useEffect(() => { load(); }, [load]);

    const loading = result.tab !== tab;
    const { applications } = result;

    const review = async (user, action, rejectReason = '') => {
        try {
            await api.put(`/admin/instructor-applications/${user._id}`, { action, reason: rejectReason });
            setRejecting(null);
            setReason('');
            load();
        } catch (err) {
            alert(err.response?.data?.message || 'No se pudo guardar la decisión');
        }
    };

    const renderLink = (url) => safeUrl(url)
        ? <a href={url} target="_blank" rel="noopener noreferrer">{url}</a>
        : (url || '—');

    return (
        <>
            <div className="admin-page__header">
                <h1 className="admin-page__title">Instructores</h1>
                <div className="admin-page__header-actions">
                    {TABS.map(t => (
                        <button
                            key={t.id}
                            className={`btn btn--sm ${tab === t.id ? 'btn--primary' : 'btn--outline'}`}
                            onClick={() => setTab(t.id)}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="admin-empty">Cargando…</div>
            ) : applications.length === 0 ? (
                <div className="admin-empty">
                    {tab === 'pending' ? 'No hay solicitudes pendientes 🎉' : 'No hay instructores en esta lista'}
                </div>
            ) : (
                <div className="application-list">
                    {applications.map(u => {
                        const p = u.instructorProfile || {};
                        return (
                            <article key={u._id} className="application-card">
                                <div className="application-card__head">
                                    <div>
                                        <div className="application-card__name">
                                            {tab === 'approved' ? <Link to={`/instructores/${u._id}`} target="_blank">{u.name}</Link> : u.name}
                                        </div>
                                        <div className="application-card__email">{u.email}</div>
                                        {p.headline && <div className="application-card__headline">{p.headline}</div>}
                                    </div>
                                    <div className="application-card__date">
                                        Solicitó: {fmtDate(p.appliedAt)}
                                        {p.reviewedAt && <><br />Revisado: {fmtDate(p.reviewedAt)}</>}
                                    </div>
                                </div>

                                <div>
                                    <div className="application-card__label">Qué quiere enseñar</div>
                                    <p className="application-card__text">{p.expertise || '—'}</p>
                                </div>
                                <div>
                                    <div className="application-card__label">Biografía</div>
                                    <p className="application-card__text">{p.bio || '—'}</p>
                                </div>
                                <div className="admin-form__field-row">
                                    <div>
                                        <div className="application-card__label">Sitio web / redes</div>
                                        <p className="application-card__text">{renderLink(p.website)}</p>
                                    </div>
                                    <div>
                                        <div className="application-card__label">Muestra de su trabajo</div>
                                        <p className="application-card__text">{renderLink(p.sampleUrl)}</p>
                                    </div>
                                </div>

                                {tab === 'rejected' && p.rejectionReason && (
                                    <p className="admin-form__thumbnail-error">Motivo del rechazo: {p.rejectionReason}</p>
                                )}

                                {tab === 'pending' && (
                                    <div className="admin-form__actions">
                                        <button className="btn btn--danger btn--sm" onClick={() => { setRejecting(u); setReason(''); }}>Rechazar</button>
                                        <button className="btn btn--primary btn--sm" onClick={() => review(u, 'approve')}>Aprobar instructor</button>
                                    </div>
                                )}
                            </article>
                        );
                    })}
                </div>
            )}

            {rejecting && (
                <AdminModal title={`Rechazar a ${rejecting.name}`} onClose={() => setRejecting(null)}>
                    <form className="admin-form" onSubmit={e => { e.preventDefault(); review(rejecting, 'reject', reason); }}>
                        <div className="admin-form__field">
                            <label>Motivo (se le enviará por correo)</label>
                            <textarea value={reason} onChange={e => setReason(e.target.value)}
                                placeholder="Ej. Necesitamos una muestra de video para evaluar la calidad del contenido" />
                        </div>
                        <div className="admin-form__actions">
                            <button type="button" className="btn btn--outline" onClick={() => setRejecting(null)}>Cancelar</button>
                            <button type="submit" className="btn btn--danger">Rechazar solicitud</button>
                        </div>
                    </form>
                </AdminModal>
            )}
        </>
    );
}
