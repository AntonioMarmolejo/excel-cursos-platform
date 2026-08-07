import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Navbar.css';

export default function Navbar() {
    const { user, logout } = useAuth();

    return (
        <nav className="navbar">
            <Link to="/" className="navbar__logo">Cursos de Excel</Link>
            {user && (
                <div className="navbar__user">
                    {user.role === 'admin' && (
                        <Link to="/admin" className="navbar__admin-link">Panel Admin</Link>
                    )}
                    <span className="navbar__name">{user.name}</span>
                    <button className="navbar__logout" onClick={logout}>Cerrar sesión</button>
                </div>
            )}
        </nav>
    );
}
