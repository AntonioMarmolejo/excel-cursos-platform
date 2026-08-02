import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/LockedOverlay.css';

export default function LockedOverlay() {
  const { user } = useAuth();
  const navigate  = useNavigate();

  return (
    <div className="locked-overlay">
      <div className="locked-card">
        <div className="lock-icon">🔒</div>
        <h3>Video bloqueado</h3>

        {!user ? (
          <>
            <p>Inicia sesión para ver los primeros 4 videos gratis,<br />o adquiere acceso completo al curso.</p>
            <div className="locked-actions">
              <button className="btn-primary" onClick={() => navigate('/login')}>
                Iniciar sesión
              </button>
              <button className="btn-secondary" onClick={() => navigate('/registro')}>
                Registrarse gratis
              </button>
            </div>
          </>
        ) : (
          <>
            <p>Este video requiere acceso al curso completo.</p>
            <p className="locked-hint">Contacta al administrador para obtener acceso.</p>
          </>
        )}
      </div>
    </div>
  );
}
