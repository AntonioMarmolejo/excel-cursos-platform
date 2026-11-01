import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { BRAND_NAME } from '../config/brand';
import '../styles/Instructor.css';

const BENEFITS = [
    { icon: '🎥', title: 'Sube tus videos', text: 'Graba tu curso y súbelo directo desde tu navegador. Nosotros nos encargamos del streaming seguro.' },
    { icon: '💰', title: 'Gana con cada venta', text: 'Tú pones el precio de tu curso y recibes un porcentaje de cada compra.' },
    { icon: '🌎', title: 'Llega a más alumnos', text: `Tu curso aparece en el catálogo de ${BRAND_NAME} junto a tu perfil de instructor.` },
];

export default function BecomeInstructorPage() {
    const { user, updateUser } = useAuth();
    const profile = user?.instructorProfile || {};
    const [form, setForm] = useState({
        headline: profile.headline || '',
        expertise: profile.expertise || '',
        bio: profile.bio || '',
        website: profile.website || '',
        sampleUrl: profile.sampleUrl || '',
    });
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSending(true);
        setError('');
        try {
            const res = await api.post('/instructors/apply', form);
            updateUser(res.data.user);
        } catch (err) {
            setError(err.response?.data?.message || 'No se pudo enviar la solicitud');
        } finally {
            setSending(false);
        }
    };

    const isInstructor = user && ['instructor', 'admin'].includes(user.role);
    const status = profile.status || 'none';

    const renderAction = () => {
        if (!user) {
            return (
                <div className="become__card become__card--center">
                    <h2>Crea tu cuenta para postularte</h2>
                    <p>Necesitas una cuenta de {BRAND_NAME} para enviar tu solicitud de instructor.</p>
                    <div className="become__actions">
                        <Link to="/registro" className="become__btn become__btn--primary">Crear cuenta</Link>
                        <Link to="/login" state={{ from: '/ser-instructor' }} className="become__btn">Ya tengo cuenta</Link>
                    </div>
                </div>
            );
        }

        if (isInstructor) {
            return (
                <div className="become__card become__card--center">
                    <h2>¡Ya eres instructor! 🎉</h2>
                    <p>Crea tus cursos y súbelos desde tu panel.</p>
                    <div className="become__actions">
                        <Link to="/instructor" className="become__btn become__btn--primary">Ir a mi panel de instructor</Link>
                    </div>
                </div>
            );
        }

        if (status === 'pending') {
            return (
                <div className="become__card become__card--center">
                    <h2>Tu solicitud está en revisión ⏳</h2>
                    <p>La revisaremos pronto y te avisaremos por correo a <strong>{user.email}</strong>.</p>
                </div>
            );
        }

        return (
            <form className="become__card become__form" onSubmit={handleSubmit}>
                <h2>Solicitud para ser instructor</h2>

                {status === 'rejected' && (
                    <div className="become__alert">
                        Tu solicitud anterior no fue aprobada.
                        {profile.rejectionReason && <> Motivo: <strong>{profile.rejectionReason}</strong></>}
                        {' '}Puedes corregirla y enviarla de nuevo.
                    </div>
                )}
                {error && <div className="become__alert">{error}</div>}

                <label className="become__field">
                    <span>Título profesional *</span>
                    <input name="headline" value={form.headline} onChange={handleChange} required maxLength={100}
                        placeholder="Ej. Desarrollador Full Stack con 8 años de experiencia" />
                </label>

                <label className="become__field">
                    <span>¿Qué quieres enseñar? *</span>
                    <textarea name="expertise" value={form.expertise} onChange={handleChange} required rows={3}
                        placeholder="Temas y cursos que te gustaría publicar" />
                </label>

                <label className="become__field">
                    <span>Biografía *</span>
                    <textarea name="bio" value={form.bio} onChange={handleChange} required rows={5}
                        placeholder="Cuéntales a tus futuros alumnos quién eres y tu experiencia. Se mostrará en tu perfil público." />
                </label>

                <div className="become__row">
                    <label className="become__field">
                        <span>Sitio web o red profesional</span>
                        <input type="url" name="website" value={form.website} onChange={handleChange} placeholder="https://linkedin.com/in/…" />
                    </label>
                    <label className="become__field">
                        <span>Video o material de muestra</span>
                        <input type="url" name="sampleUrl" value={form.sampleUrl} onChange={handleChange} placeholder="https://youtube.com/…" />
                    </label>
                </div>

                <button type="submit" className="become__btn become__btn--primary" disabled={sending}>
                    {sending ? 'Enviando…' : 'Enviar solicitud'}
                </button>
            </form>
        );
    };

    return (
        <div className="become">
            <Navbar />
            <main className="become__main">
                <section className="become__hero">
                    <h1>Enseña en <span>{BRAND_NAME}</span></h1>
                    <p>Comparte lo que sabes con miles de estudiantes y genera ingresos con tus cursos.</p>
                </section>

                <section className="become__benefits">
                    {BENEFITS.map(b => (
                        <div key={b.title} className="become__benefit">
                            <span className="become__benefit-icon">{b.icon}</span>
                            <h3>{b.title}</h3>
                            <p>{b.text}</p>
                        </div>
                    ))}
                </section>

                {renderAction()}
            </main>
            <Footer />
        </div>
    );
}
