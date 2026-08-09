import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Navbar.css';

export default function Navbar() {
    const { user, logout } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <nav className="navbar">
            <Link to="/" className="navbar__logo" onClick={() => setMenuOpen(false)}>Cursos de Excel</Link>

            {user && (
                <>
                    <button
                        type="button"
                        className={`navbar__toggle${menuOpen ? ' navbar__toggle--open' : ''}`}
                        onClick={() => setMenuOpen(o => !o)}
                        aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
                        aria-expanded={menuOpen}
                    >
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>

                    <div className={`navbar__user${menuOpen ? ' navbar__user--open' : ''}`}>
                        {user.role === 'admin' && (
                            <Link to="/admin" className="navbar__admin-link" onClick={() => setMenuOpen(false)}>
                                Panel Admin
                            </Link>
                        )}
                        <Link to="/perfil" className="navbar__profile-link" onClick={() => setMenuOpen(false)}>
                            Mi Perfil
                        </Link>
                        <span className="navbar__name">{user.name}</span>
                        <button className="navbar__logout" onClick={() => { setMenuOpen(false); logout(); }}>
                            Cerrar sesión
                        </button>
                    </div>
                </>
            )}
        </nav>
    );
}
