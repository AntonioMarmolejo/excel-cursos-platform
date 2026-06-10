import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
    const { user, logout } = useAuth();

    return (
        <nav className="navbar">
            <Link to="/" className="navbar-logo">Cursos de Excel</Link>
            {user && (
                <div className="navbar-user">
                    <span className="navbar-name">{user.name}</span>
                    <button className="navbar-logout" onClick={logout}>Cerrar sesión</button>
                </div>
            )}
        </nav>
    );
}
