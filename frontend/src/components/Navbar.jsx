import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { resolveFileUrl } from '../api/client';
import '../styles/Navbar.css';
import { BRAND_NAME } from '../config/brand';

export default function Navbar() {
    const { user, logout } = useAuth();
    const [open, setOpen] = useState(false);
    const menuRef = useRef(null);

    // Cierra el menú al hacer clic afuera o presionar Escape
    useEffect(() => {
        if (!open) return;
        const handleClick = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
        };
        const handleKey = (e) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('mousedown', handleClick);
        document.addEventListener('keydown', handleKey);
        return () => {
            document.removeEventListener('mousedown', handleClick);
            document.removeEventListener('keydown', handleKey);
        };
    }, [open]);

    return (
        <nav className="navbar">
            <Link to="/" className="navbar__logo" onClick={() => setOpen(false)}>{BRAND_NAME}</Link>

            {!user && (
                <div className="navbar__guest">
                    <Link to="/ser-instructor" className="navbar__link">Enseña en {BRAND_NAME}</Link>
                    <Link to="/login" className="navbar__btn">Iniciar sesión</Link>
                    <Link to="/registro" className="navbar__btn navbar__btn--primary">Crear cuenta</Link>
                </div>
            )}

            {user && (
                <div className="navbar__menu" ref={menuRef}>
                    <button
                        type="button"
                        className={`navbar__trigger${open ? ' navbar__trigger--open' : ''}`}
                        onClick={() => setOpen(o => !o)}
                        aria-haspopup="true"
                        aria-expanded={open}
                    >
                        <span className="navbar__avatar">
                            {user.avatar
                                ? <img src={resolveFileUrl(user.avatar)} alt={user.name} />
                                : (user.name?.[0]?.toUpperCase() || '?')
                            }
                        </span>
                        <span className="navbar__trigger-name">{user.name}</span>
                        <svg className="navbar__chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
                    </button>

                    {open && (
                        <div className="navbar__dropdown">
                            <Link to="/perfil" className="navbar__dropdown-item" onClick={() => setOpen(false)}>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 21a8 8 0 0 0-16 0" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                                Mi Perfil
                            </Link>

                            {['instructor', 'admin'].includes(user.role) ? (
                                <Link to="/instructor" className="navbar__dropdown-item" onClick={() => setOpen(false)}>
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polygon points="23 7 16 12 23 17 23 7" />
                                        <rect x="1" y="5" width="15" height="14" rx="2" />
                                    </svg>
                                    Panel Instructor
                                </Link>
                            ) : (
                                <Link to="/ser-instructor" className="navbar__dropdown-item" onClick={() => setOpen(false)}>
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M22 10 12 5 2 10l10 5 10-5z" />
                                        <path d="M6 12v5c3 3 9 3 12 0v-5" />
                                    </svg>
                                    Enseña en {BRAND_NAME}
                                </Link>
                            )}

                            {user.role === 'admin' && (
                                <Link to="/admin" className="navbar__dropdown-item" onClick={() => setOpen(false)}>
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="3" width="7" height="7" rx="1" />
                                        <rect x="14" y="3" width="7" height="7" rx="1" />
                                        <rect x="14" y="14" width="7" height="7" rx="1" />
                                        <rect x="3" y="14" width="7" height="7" rx="1" />
                                    </svg>
                                    Panel Admin
                                </Link>
                            )}

                            <div className="navbar__dropdown-divider" />

                            <button
                                type="button"
                                className="navbar__dropdown-item navbar__dropdown-item--danger"
                                onClick={() => { setOpen(false); logout(); }}
                            >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                    <polyline points="16 17 21 12 16 7" />
                                    <line x1="21" y1="12" x2="9" y2="12" />
                                </svg>
                                Cerrar sesión
                            </button>
                        </div>
                    )}
                </div>
            )}
        </nav>
    );
}
