import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { resolveFileUrl } from '../api/client';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CourseCard from '../components/CourseCard';
import '../styles/Instructor.css';

const safeUrl = (url) => /^https?:\/\//i.test(url || '') ? url : null;

// Perfil público de un instructor con sus cursos publicados
export default function InstructorProfilePage() {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        api.get(`/instructors/${id}`)
            .then(res => { setData(res.data); setError(''); })
            .catch(() => setError('Instructor no encontrado'));
    }, [id]);

    const instructor = data?.instructor;
    const profile = instructor?.instructorProfile || {};
    const website = safeUrl(profile.website);

    return (
        <div className="become">
            <Navbar />
            <main className="become__main">
                {error ? (
                    <div className="become__card become__card--center">
                        <h2>{error}</h2>
                        <div className="become__actions">
                            <Link to="/" className="become__btn become__btn--primary">Ver catálogo</Link>
                        </div>
                    </div>
                ) : !data ? (
                    <div className="home-page__loading"><div className="home-page__spinner" /></div>
                ) : (
                    <>
                        <section className="instructor-profile">
                            <div className="instructor-profile__avatar">
                                {instructor.avatar
                                    ? <img src={resolveFileUrl(instructor.avatar)} alt={instructor.name} />
                                    : instructor.name?.[0]?.toUpperCase()}
                            </div>
                            <div className="instructor-profile__info">
                                <span className="instructor-profile__label">Instructor</span>
                                <h1>{instructor.name}</h1>
                                {profile.headline && <p className="instructor-profile__headline">{profile.headline}</p>}
                                <div className="instructor-profile__stats">
                                    <span><strong>{data.courses.length}</strong> {data.courses.length === 1 ? 'curso' : 'cursos'}</span>
                                    {website && <a href={website} target="_blank" rel="noopener noreferrer">🔗 Sitio web</a>}
                                </div>
                            </div>
                        </section>

                        {profile.bio && (
                            <section>
                                <h2 className="home-page__section-title">Sobre mí</h2>
                                <p className="instructor-profile__bio">{profile.bio}</p>
                            </section>
                        )}

                        <section>
                            <h2 className="home-page__section-title">Cursos de {instructor.name.split(' ')[0]}</h2>
                            {data.courses.length === 0 ? (
                                <p className="instructor-profile__bio">Este instructor aún no tiene cursos publicados.</p>
                            ) : (
                                <div className="home-page__courses-grid">
                                    {data.courses.map(c => <CourseCard key={c._id} course={c} showInstructor={false} />)}
                                </div>
                            )}
                        </section>
                    </>
                )}
            </main>
            <Footer />
        </div>
    );
}
