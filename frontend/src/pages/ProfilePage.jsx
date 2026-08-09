import { useEffect, useRef, useState } from 'react';
import api, { resolveFileUrl } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Certificate from '../components/Certificate';
import '../styles/ProfilePage.css';

const SECTIONS = [
    { id: 'cursos',       label: 'Mis cursos',   icon: '📚', available: true },
    { id: 'certificados', label: 'Certificados', icon: '🎓', available: true },
    { id: 'cuestionarios', label: 'Cuestionarios', icon: '📝', available: false },
    { id: 'pedidos',      label: 'Pedidos',       icon: '🛒', available: false },
];

const SETTINGS_LINKS = [
    { id: 'general',  label: 'General',          available: false },
    { id: 'portada',  label: 'Imagen de portada', available: false },
    { id: 'password', label: 'Contraseña',        available: true },
    { id: 'privacy',  label: 'Privacidad',        available: false },
];

const TABS = [
    { id: 'todos',       label: 'Todos' },
    { id: 'progreso',    label: 'En progreso' },
    { id: 'finalizado',  label: 'Finalizado' },
    { id: 'aprobado',    label: 'Aprobado' },
    { id: 'suspendido',  label: 'Suspendido' },
];

export default function ProfilePage() {
    const { user, logout, updateUser } = useAuth();
    const [progress, setProgress] = useState([]);
    const [loading, setLoading]   = useState(true);
    const [section, setSection]   = useState('cursos');
    const [tab, setTab]           = useState('todos');
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [avatarError, setAvatarError] = useState('');
    const fileInputRef = useRef(null);

    const [activeSetting, setActiveSetting] = useState(null); // id de SETTINGS_LINKS abierto, o null
    const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
    const [pwSaving, setPwSaving] = useState(false);
    const [pwError, setPwError] = useState('');
    const [pwSuccess, setPwSuccess] = useState('');

    useEffect(() => {
        api.get('/progress')
            .then(res => setProgress(res.data.progress))
            .catch(() => setProgress([]))
            .finally(() => setLoading(false));
    }, []);

    const handleAvatarClick = () => fileInputRef.current?.click();

    const handleAvatarChange = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = ''; // permite volver a elegir el mismo archivo después
        if (!file) return;

        setAvatarError('');
        setUploadingAvatar(true);
        try {
            const formData = new FormData();
            formData.append('avatar', file);
            const res = await api.put('/auth/me/avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            updateUser({ avatar: res.data.user.avatar });
        } catch (err) {
            setAvatarError(err.response?.data?.message || 'Error al subir la imagen');
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handlePasswordChange = (e) =>
        setPwForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setPwError('');
        setPwSuccess('');

        if (pwForm.next.length < 6) {
            setPwError('La nueva contraseña debe tener al menos 6 caracteres');
            return;
        }
        if (pwForm.next !== pwForm.confirm) {
            setPwError('Las contraseñas nuevas no coinciden');
            return;
        }

        setPwSaving(true);
        try {
            await api.put('/auth/me/password', {
                currentPassword: pwForm.current,
                newPassword: pwForm.next,
            });
            setPwSuccess('Contraseña actualizada correctamente');
            setPwForm({ current: '', next: '', confirm: '' });
        } catch (err) {
            setPwError(err.response?.data?.message || 'Error al actualizar la contraseña');
        } finally {
            setPwSaving(false);
        }
    };

    const toggleSetting = (id) => {
        setActiveSetting(prev => (prev === id ? null : id));
        setPwError('');
        setPwSuccess('');
    };

    const completedCourses = progress.filter(p => p.percentage === 100);

    const enrolled   = progress.length;
    const inProgress = progress.filter(p => p.percentage > 0 && p.percentage < 100).length;
    const completed  = progress.filter(p => p.percentage === 100).length;

    const dueDate = () => {
        const sub = user?.subscription;
        if (!sub?.plan) return '—';
        if (sub.plan === 'lifetime' || !sub.endDate) return 'Nunca';
        return new Date(sub.endDate).toLocaleDateString('es');
    };

    const finishedAt = (p) =>
        p.completedAt ? new Date(p.completedAt).toLocaleString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-';

    const filteredCourses = (() => {
        if (tab === 'progreso')   return progress.filter(p => p.percentage > 0 && p.percentage < 100);
        if (tab === 'finalizado') return progress.filter(p => p.percentage === 100);
        if (tab === 'aprobado' || tab === 'suspendido') return null; // sin backend de cuestionarios
        return progress;
    })();

    return (
        <div className="profile-page">
            <Navbar />

            {/* Cabecera con datos del usuario */}
            <header className="profile-page__header">
                <div className="profile-page__avatar-wrap">
                    <div className="profile-page__avatar">
                        {user?.avatar
                            ? <img src={resolveFileUrl(user.avatar)} alt={user.name} />
                            : (user?.name?.[0]?.toUpperCase() || '?')
                        }
                    </div>
                    <button
                        type="button"
                        className="profile-page__avatar-edit"
                        onClick={handleAvatarClick}
                        disabled={uploadingAvatar}
                        title="Cambiar foto de perfil"
                    >
                        {uploadingAvatar ? '…' : '✏️'}
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png, image/jpeg, image/webp, image/gif"
                        onChange={handleAvatarChange}
                        hidden
                    />
                </div>
                <div className="profile-page__identity">
                    {avatarError && <p className="profile-page__avatar-error">{avatarError}</p>}
                    <h1 className="profile-page__name">{user?.name}</h1>
                    <p className="profile-page__meta">
                        {user?.email}
                        {user?.createdAt && ` · Miembro desde ${new Date(user.createdAt).toLocaleDateString('es', { month: 'long', year: 'numeric' })}`}
                    </p>
                </div>
            </header>

            <div className="profile-page__body">
                {/* Sidebar */}
                <aside className="profile-page__sidebar">
                    <nav className="profile-page__nav">
                        {SECTIONS.map(s => (
                            <button
                                key={s.id}
                                className={[
                                    'profile-page__nav-link',
                                    section === s.id ? 'profile-page__nav-link--active' : '',
                                    !s.available ? 'profile-page__nav-link--disabled' : '',
                                ].join(' ').trim()}
                                onClick={() => setSection(s.id)}
                            >
                                <span>{s.icon}</span> {s.label}
                            </button>
                        ))}
                    </nav>

                    <div className="profile-page__settings">
                        <button
                            className="profile-page__settings-toggle"
                            onClick={() => setSettingsOpen(o => !o)}
                        >
                            <span>⚙️ Ajustes</span>
                            <span className={`profile-page__settings-arrow${settingsOpen ? ' profile-page__settings-arrow--open' : ''}`}>›</span>
                        </button>
                        {settingsOpen && (
                            <div className="profile-page__settings-menu">
                                {SETTINGS_LINKS.map(s => (
                                    <div key={s.id}>
                                        {s.available ? (
                                            <button
                                                type="button"
                                                className={`profile-page__settings-link profile-page__settings-link--active${activeSetting === s.id ? ' profile-page__settings-link--open' : ''}`}
                                                onClick={() => toggleSetting(s.id)}
                                            >
                                                {s.label}
                                            </button>
                                        ) : (
                                            <span className="profile-page__settings-link" title="Próximamente">
                                                {s.label}
                                            </span>
                                        )}

                                        {s.id === 'password' && activeSetting === 'password' && (
                                            <form className="profile-page__password-form" onSubmit={handlePasswordSubmit}>
                                                {pwError && <p className="profile-page__password-error">{pwError}</p>}
                                                {pwSuccess && <p className="profile-page__password-success">{pwSuccess}</p>}

                                                <input
                                                    type="password"
                                                    name="current"
                                                    placeholder="Contraseña actual"
                                                    value={pwForm.current}
                                                    onChange={handlePasswordChange}
                                                    required
                                                />
                                                <input
                                                    type="password"
                                                    name="next"
                                                    placeholder="Nueva contraseña"
                                                    value={pwForm.next}
                                                    onChange={handlePasswordChange}
                                                    minLength={6}
                                                    required
                                                />
                                                <input
                                                    type="password"
                                                    name="confirm"
                                                    placeholder="Confirmar nueva contraseña"
                                                    value={pwForm.confirm}
                                                    onChange={handlePasswordChange}
                                                    minLength={6}
                                                    required
                                                />
                                                <button type="submit" className="profile-page__password-submit" disabled={pwSaving}>
                                                    {pwSaving ? 'Guardando…' : 'Actualizar contraseña'}
                                                </button>
                                            </form>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <button className="profile-page__logout" onClick={logout}>
                        ⏻ Cerrar sesión
                    </button>
                </aside>

                {/* Contenido */}
                <main className="profile-page__content">
                    {section === 'certificados' ? (
                        loading ? (
                            <div className="profile-page__empty">Cargando...</div>
                        ) : completedCourses.length === 0 ? (
                            <div className="profile-page__empty">
                                <span className="profile-page__empty-icon">🎓</span>
                                <p>Aún no tienes certificados. ¡Completa un curso al 100% para obtener el tuyo!</p>
                            </div>
                        ) : (
                            <div className="profile-page__certificates">
                                {completedCourses.map(p => (
                                    <Certificate
                                        key={p._id}
                                        studentName={user?.name}
                                        courseTitle={p.course?.title}
                                        completedAt={p.completedAt || p.updatedAt}
                                    />
                                ))}
                            </div>
                        )
                    ) : section !== 'cursos' ? (
                        <div className="profile-page__empty">
                            <span className="profile-page__empty-icon">
                                {SECTIONS.find(s => s.id === section)?.icon}
                            </span>
                            <p>Esta sección estará disponible próximamente.</p>
                        </div>
                    ) : loading ? (
                        <div className="profile-page__empty">Cargando...</div>
                    ) : (
                        <>
                            <div className="profile-page__stats">
                                <div className="profile-page__stat">
                                    <div className="profile-page__stat-icon profile-page__stat-icon--enrolled">📘</div>
                                    <div>
                                        <div className="profile-page__stat-label">Curso matriculado</div>
                                        <div className="profile-page__stat-value">{enrolled}</div>
                                    </div>
                                </div>
                                <div className="profile-page__stat">
                                    <div className="profile-page__stat-icon profile-page__stat-icon--progress">⏳</div>
                                    <div>
                                        <div className="profile-page__stat-label">Curso en progreso</div>
                                        <div className="profile-page__stat-value">{inProgress}</div>
                                    </div>
                                </div>
                                <div className="profile-page__stat">
                                    <div className="profile-page__stat-icon profile-page__stat-icon--done">🏁</div>
                                    <div>
                                        <div className="profile-page__stat-label">Curso finalizado</div>
                                        <div className="profile-page__stat-value">{completed}</div>
                                    </div>
                                </div>
                                <div className="profile-page__stat profile-page__stat--disabled" title="Requiere sistema de cuestionarios (próximamente)">
                                    <div className="profile-page__stat-icon profile-page__stat-icon--approved">✅</div>
                                    <div>
                                        <div className="profile-page__stat-label">Curso aprobado</div>
                                        <div className="profile-page__stat-value">—</div>
                                    </div>
                                </div>
                                <div className="profile-page__stat profile-page__stat--disabled" title="Requiere sistema de cuestionarios (próximamente)">
                                    <div className="profile-page__stat-icon profile-page__stat-icon--suspended">⛔</div>
                                    <div>
                                        <div className="profile-page__stat-label">Curso suspendido</div>
                                        <div className="profile-page__stat-value">—</div>
                                    </div>
                                </div>
                            </div>

                            <div className="profile-page__tabs">
                                {TABS.map(t => (
                                    <button
                                        key={t.id}
                                        className={`profile-page__tab${tab === t.id ? ' profile-page__tab--active' : ''}`}
                                        onClick={() => setTab(t.id)}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>

                            <div className="profile-page__table-wrap">
                                {filteredCourses === null ? (
                                    <div className="profile-page__empty">
                                        <p>Los cuestionarios no están disponibles todavía.</p>
                                    </div>
                                ) : filteredCourses.length === 0 ? (
                                    <div className="profile-page__empty">
                                        <p>No hay cursos en esta categoría.</p>
                                    </div>
                                ) : (
                                    <table className="profile-page__table">
                                        <thead>
                                            <tr>
                                                <th>Curso</th>
                                                <th>Resultado</th>
                                                <th>Fecha de vencimiento</th>
                                                <th>Hora de finalización</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredCourses.map(p => (
                                                <tr key={p._id}>
                                                    <td>
                                                        <div className="profile-page__course-cell">
                                                            <div className="profile-page__course-thumb">
                                                                {p.course?.thumbnail
                                                                    ? <img src={p.course.thumbnail} alt={p.course.title} />
                                                                    : <span>📊</span>
                                                                }
                                                            </div>
                                                            {p.course?.title}
                                                        </div>
                                                    </td>
                                                    <td>{p.percentage}%</td>
                                                    <td>{dueDate()}</td>
                                                    <td>{finishedAt(p)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}
