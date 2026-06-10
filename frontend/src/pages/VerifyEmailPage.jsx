import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import './AuthPage.css';

export default function VerifyEmailPage() {
  const { token } = useParams();
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    api.get(`/auth/verify/${token}`)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>Cursos de Excel</h1>
          <p>Verificación de cuenta</p>
        </div>

        <div className="auth-form">
          {status === 'loading' && (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
              Verificando tu cuenta...
            </p>
          )}
          {status === 'success' && (
            <>
              <div className="auth-success">
                Tu correo fue verificado correctamente. Ya puedes acceder a todos los cursos.
              </div>
              <Link to="/login" className="auth-btn">Ir al inicio de sesión</Link>
            </>
          )}
          {status === 'error' && (
            <>
              <div className="auth-error">
                El enlace de verificación es inválido o ya fue usado.
              </div>
              <Link to="/login" className="auth-btn">Ir al inicio de sesión</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
