import { NavLink, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/admin.css';

const NAV = [
    { to: '/admin',             label: 'Dashboard',    icon: '📊', end: true },
    { to: '/admin/cursos',      label: 'Cursos',        icon: '📚' },
    { to: '/admin/usuarios',    label: 'Usuarios',      icon: '👥' },
    { to: '/admin/comentarios', label: 'Comentarios',   icon: '💬' },
];

export default function AdminLayout() {
    const { logout } = useAuth();

    return (
        <div className="admin-layout">
            <aside className="admin-layout__sidebar">
                <Link to="/admin" className="admin-layout__sidebar-logo">
                    Panel Admin
                    <span>Cursos de Excel</span>
                </Link>

                <nav className="admin-layout__nav">
                    {NAV.map(({ to, label, icon, end }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={end}
                            className={({ isActive }) => `admin-layout__nav-link${isActive ? ' admin-layout__nav-link--active' : ''}`}
                        >
                            <span>{icon}</span> {label}
                        </NavLink>
                    ))}
                </nav>

                <div className="admin-layout__sidebar-footer">
                    <Link to="/" className="admin-layout__sidebar-back">← Ver sitio</Link>
                    <button className="admin-layout__logout-btn" onClick={logout}>Cerrar sesión</button>
                </div>
            </aside>

            <main className="admin-layout__content">
                <Outlet />
            </main>
        </div>
    );
}
