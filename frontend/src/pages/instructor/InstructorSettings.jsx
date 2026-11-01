import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

// Edición del perfil público del instructor (título, biografía y sitio web)
export default function InstructorSettings() {
    const { user, updateUser } = useAuth();
    const profile = user?.instructorProfile || {};
    const [form, setForm] = useState({
        headline: profile.headline || '',
        bio: profile.bio || '',
        website: profile.website || '',
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [saved, setSaved] = useState(false);

    const handleChange = (e) => {
        setSaved(false);
        setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            const res = await api.put('/instructors/me', form);
            updateUser(res.data.user);
            setSaved(true);
        } catch (err) {
            setError(err.response?.data?.message || 'No se pudo guardar');
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <div className="admin-page__header">
                <h1 className="admin-page__title">Mi perfil público</h1>
                <Link to={`/instructores/${user._id}`} target="_blank" className="btn btn--outline btn--sm">Ver mi perfil ↗</Link>
            </div>

            <form className="admin-form admin-form--narrow" onSubmit={handleSubmit}>
                {error && <div className="admin-form__error">{error}</div>}
                {saved && <div className="admin-notice">✓ Perfil actualizado</div>}

                <div className="admin-form__field">
                    <label>Título profesional</label>
                    <input name="headline" value={form.headline} onChange={handleChange} maxLength={100}
                        placeholder="Ej. Diseñadora UX/UI en Mercado Libre" />
                </div>

                <div className="admin-form__field">
                    <label>Biografía</label>
                    <textarea name="bio" value={form.bio} onChange={handleChange} rows={8}
                        placeholder="Se muestra en tu perfil y en la pestaña Instructor de tus cursos" />
                </div>

                <div className="admin-form__field">
                    <label>Sitio web o red profesional</label>
                    <input type="url" name="website" value={form.website} onChange={handleChange} placeholder="https://…" />
                </div>

                <p className="admin-form__hint">Tu nombre y foto se cambian desde <Link to="/perfil">Mi Perfil</Link>.</p>

                <div className="admin-form__actions">
                    <button type="submit" className="btn btn--primary" disabled={saving}>
                        {saving ? 'Guardando…' : 'Guardar cambios'}
                    </button>
                </div>
            </form>
        </>
    );
}
