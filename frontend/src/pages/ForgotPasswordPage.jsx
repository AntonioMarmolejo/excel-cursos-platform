import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import '../styles/AuthPage.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
    } finally {
      setSent(true);
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>Cursos de Excel</h1>
          <p>Recupera tu contraseña</p>
        </div>

        {sent ? (
          <div className="auth-form">
            <div className="auth-success">
              Si el correo está registrado, recibirás un enlace para restablecer tu contraseña en los próximos minutos.
            </div>
            <div className="auth-links">
              <Link to="/login">Volver al inicio de sesión</Link>
            </div>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Correo electrónico</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                required
                autoFocus
              />
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar enlace'}
            </button>

            <div className="auth-links">
              <Link to="/login">Volver al inicio de sesión</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
