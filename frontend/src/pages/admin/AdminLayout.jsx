import { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/admin.css';

const NAV = [
    { to: '/admin',             label: 'Dashboard',    icon: '📊', end: true },
    { to: '/admin/cursos',      label: 'Cursos',        icon: '📚' },
    { to: '/admin/usuarios',    label: 'Usuarios',      icon: '👥' },
    { to: '/admin/comentarios', label: 'Comentarios',   icon: '💬' },
];

const STORAGE_KEY = 'adminSidebarCollapsed';

export default function AdminLayout() {
    const { logout } = useAuth();
    const [collapsed, setCollapsed] = useState(() => localStorage.getItem(STORAGE_KEY) === '1');

    const toggleCollapsed = () => {
        setCollapsed(prev => {
            const next = !prev;
            localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
            return next;
        });
    };

    return (
        <div className={`admin-layout${collapsed ? ' admin-layout--collapsed' : ''}`}>
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

            <button
                type="button"
                className="admin-layout__collapse-btn"
                onClick={toggleCollapsed}
                title={collapsed ? 'Mostrar menú' : 'Ocultar menú'}
                aria-label={collapsed ? 'Mostrar menú' : 'Ocultar menú'}
                aria-expanded={!collapsed}
            >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                </svg>
            </button>

            <main className="admin-layout__content">
                <Outlet />
            </main>
        </div>
    );
}
