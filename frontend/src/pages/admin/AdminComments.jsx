import { useEffect, useState } from 'react';
import api from '../../api/client';

export default function AdminComments() {
    const [comments, setComments] = useState([]);
    const [total, setTotal]       = useState(0);
    const [showHidden, setShowHidden] = useState(false);

    const load = (hidden = showHidden) =>
        api.get('/admin/comments', { params: { hidden } })
            .then(r => { setComments(r.data.comments); setTotal(r.data.total); })
            .catch(() => {});

    useEffect(() => { load(); }, []);

    const switchTab = (hidden) => { setShowHidden(hidden); load(hidden); };

    const toggle = async (id) => {
        await api.put(`/admin/comments/${id}/toggle`).catch(() => {});
        load();
    };

    return (
        <>
            <div className="admin-page-header">
                <h1 className="admin-page-title">Comentarios</h1>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button
                        className={`btn btn-sm ${!showHidden ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => switchTab(false)}
                    >
                        Visibles {!showHidden && `(${total})`}
                    </button>
                    <button
                        className={`btn btn-sm ${showHidden ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => switchTab(true)}
                    >
                        Ocultos {showHidden && `(${total})`}
                    </button>
                </div>
            </div>

            <div className="admin-table-wrap">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Usuario</th><th>Video</th><th>Comentario</th><th>Fecha</th><th>Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {comments.length === 0 && (
                            <tr><td colSpan={5} className="admin-empty">No hay comentarios</td></tr>
                        )}
                        {comments.map(c => (
                            <tr key={c._id}>
                                <td>
                                    <div style={{ fontWeight: 600 }}>{c.user?.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.user?.email}</div>
                                </td>
                                <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    {c.video?.title || '—'}
                                </td>
                                <td style={{ maxWidth: 320, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    {c.content?.slice(0, 100)}{c.content?.length > 100 ? '…' : ''}
                                </td>
                                <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                    {new Date(c.createdAt).toLocaleDateString('es')}
                                </td>
                                <td>
                                    <button
                                        className={`btn btn-sm ${c.isHidden ? 'btn-outline' : 'btn-danger'}`}
                                        onClick={() => toggle(c._id)}
                                    >
                                        {c.isHidden ? 'Mostrar' : 'Ocultar'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}
