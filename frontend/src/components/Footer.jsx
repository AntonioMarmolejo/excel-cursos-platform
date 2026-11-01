import { Link } from 'react-router-dom';
import '../styles/Footer.css';
import { BRAND_NAME, BRAND_DOMAIN } from '../config/brand';

const YEAR = new Date().getFullYear();

export default function Footer() {
    return (
        <footer className="footer">
            <div className="footer__inner">
                <div className="footer__top">
                    <Link to="/" className="footer__brand">
                        <span className="footer__brand-icon">🎓</span>
                        {BRAND_NAME}
                    </Link>

                    <div className="footer__columns">
                        <div className="footer__column">
                            <h2 className="footer__column-title">Plataforma</h2>
                            <ul className="footer__link-list">
                                <li><Link to="/">Inicio</Link></li>
                                <li><Link to="/perfil">Mi Perfil</Link></li>
                                <li><Link to="/ser-instructor">Enseña en {BRAND_NAME}</Link></li>
                            </ul>
                        </div>

                        <div className="footer__column">
                            <h2 className="footer__column-title">Síguenos</h2>
                            <ul className="footer__link-list">
                                <li><a href="#" target="_blank" rel="noopener noreferrer">Facebook</a></li>
                                <li><a href="#" target="_blank" rel="noopener noreferrer">YouTube</a></li>
                            </ul>
                        </div>

                        <div className="footer__column">
                            <h2 className="footer__column-title">Legal</h2>
                            <ul className="footer__link-list">
                                <li><a href="#">Política de privacidad</a></li>
                                <li><a href="#">Términos y condiciones</a></li>
                            </ul>
                        </div>
                    </div>
                </div>

                <hr className="footer__divider" />

                <div className="footer__bottom">
                    <span className="footer__copyright">
                        © {YEAR} <Link to="/">{BRAND_DOMAIN}</Link>. Todos los derechos reservados.
                    </span>

                    <div className="footer__socials">
                        <a href="#" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M13.397 20.997v-8.196h2.765l.411-3.209h-3.176V7.548c0-.926.258-1.56 1.587-1.56h1.684V3.127A22.336 22.336 0 0 0 14.201 3c-2.444 0-4.122 1.492-4.122 4.231v2.361H7.332v3.209h2.753v8.196h3.312Z" />
                            </svg>
                        </a>
                        <a href="#" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M21.593 7.203a2.506 2.506 0 0 0-1.762-1.766C18.265 5.007 12 5 12 5s-6.264-.007-7.831.404a2.56 2.56 0 0 0-1.766 1.778c-.413 1.566-.417 4.814-.417 4.814s-.004 3.264.406 4.814c.23.857.905 1.534 1.763 1.765 1.582.43 7.83.437 7.83.437s6.265.007 7.831-.403a2.515 2.515 0 0 0 1.767-1.763c.414-1.565.417-4.812.417-4.812s.02-3.265-.407-4.831ZM9.996 15.005l.005-6 5.207 3.005-5.212 2.995Z" />
                            </svg>
                        </a>
                        <a href="#" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path fillRule="evenodd" clipRule="evenodd" d="M3 8a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8Zm5-3a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H8Zm4 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm-2 4a2 2 0 1 1 4 0 2 2 0 0 1-4 0Zm6.5-4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" />
                            </svg>
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
