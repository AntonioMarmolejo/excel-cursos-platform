import { useEffect, useState } from 'react';
import api from '../../api/client';

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);

    useEffect(() => {
        api.get('/admin/stats').then(res => setStats(res.data.stats)).catch(() => {});
    }, []);

    if (!stats) return <div className="admin-empty">Cargando...</div>;

    return (
        <>
            <div className="admin-page-header">
                <h1 className="admin-page-title">Dashboard</h1>
            </div>

            <div className="stat-grid">
                <div className="stat-card">
                    <div className="stat-card-label">Total usuarios</div>
                    <div className="stat-card-value">{stats.totalUsers}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-label">Suscripciones activas</div>
                    <div className="stat-card-value">{stats.activeSubscriptions}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-label">Cursos publicados</div>
                    <div className="stat-card-value">{stats.totalCourses}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-label">Nuevos (30 días)</div>
                    <div className="stat-card-value">{stats.newUsersLast30Days}</div>
                </div>
            </div>

            {stats.recentComments?.length > 0 && (
                <>
                    <p className="admin-section-label" style={{ marginBottom: '1rem' }}>Comentarios recientes</p>
                    <div className="admin-table-wrap">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Usuario</th>
                                    <th>Video</th>
                                    <th>Comentario</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.recentComments.map(c => (
                                    <tr key={c._id}>
                                        <td>{c.user?.name || '—'}</td>
                                        <td style={{ color: 'var(--text-muted)' }}>{c.video?.title || '—'}</td>
                                        <td style={{ color: 'var(--text-muted)', maxWidth: 300 }}>
                                            {c.content?.slice(0, 80)}{c.content?.length > 80 ? '…' : ''}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </>
    );
}
