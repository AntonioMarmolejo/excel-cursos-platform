import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import '../styles/AuthPage.css';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.post(`/auth/reset-password/${token}`, { password: form.password });
      navigate('/login', { state: { message: 'Contraseña actualizada correctamente. Inicia sesión.' } });
    } catch (err) {
      setError(err.response?.data?.message || 'El enlace es inválido o ha expirado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-page__card">
        <div className="auth-page__logo">
          <h1>Cursos de Excel</h1>
          <p>Crea una nueva contraseña</p>
        </div>

        <form className="auth-page__form" onSubmit={handleSubmit}>
          {error && <div className="auth-page__error">{error}</div>}

          <div className="auth-page__group">
            <label htmlFor="password">Nueva contraseña</label>
            <input
              id="password"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Mínimo 6 caracteres"
              minLength={6}
              required
              autoFocus
            />
          </div>

          <div className="auth-page__group">
            <label htmlFor="confirm">Confirmar contraseña</label>
            <input
              id="confirm"
              type="password"
              name="confirm"
              value={form.confirm}
              onChange={handleChange}
              placeholder="Repite la contraseña"
              required
            />
          </div>

          <button type="submit" className="auth-page__btn" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}
