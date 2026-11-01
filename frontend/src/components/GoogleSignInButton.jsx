import { useEffect, useRef, useState } from 'react';
import api from '../api/client';

const GSI_SRC = 'https://accounts.google.com/gsi/client';

// Carga el script de Google Identity Services una sola vez
let gsiPromise = null;
const loadGsi = () => {
    gsiPromise ??= new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = GSI_SRC;
        script.async = true;
        script.onload = resolve;
        script.onerror = () => { gsiPromise = null; reject(new Error('No se pudo cargar Google')); };
        document.head.appendChild(script);
    });
    return gsiPromise;
};

// Botón oficial "Continuar con Google". Si el backend no tiene GOOGLE_CLIENT_ID
// configurado, no se muestra nada.
export default function GoogleSignInButton({ onSuccess, onError, text = 'continue_with' }) {
    const containerRef = useRef(null);
    const [enabled, setEnabled] = useState(false);
    // Las props pueden cambiar entre renders; el callback de Google usa siempre la última
    const handlersRef = useRef({ onSuccess, onError });
    useEffect(() => { handlersRef.current = { onSuccess, onError }; });

    useEffect(() => {
        let cancelled = false;

        api.get('/auth/google/config')
            .then(async ({ data }) => {
                if (!data.clientId || cancelled) return;
                await loadGsi();
                if (cancelled || !containerRef.current) return;
                setEnabled(true);

                window.google.accounts.id.initialize({
                    client_id: data.clientId,
                    callback: async ({ credential }) => {
                        try {
                            const res = await api.post('/auth/google', { credential });
                            handlersRef.current.onSuccess(res.data);
                        } catch (err) {
                            handlersRef.current.onError?.(err.response?.data?.message || 'No se pudo iniciar sesión con Google');
                        }
                    },
                });
                window.google.accounts.id.renderButton(containerRef.current, {
                    theme: 'filled_black',
                    size: 'large',
                    shape: 'rectangular',
                    text,
                    locale: 'es',
                    width: Math.min(containerRef.current.offsetWidth || 348, 400),
                });
            })
            .catch(() => { /* sin Google: se usa solo email y contraseña */ });

        return () => { cancelled = true; };
    }, [text]);

    return (
        <div className={enabled ? 'google-signin' : 'google-signin google-signin--hidden'}>
            <div className="google-signin__divider"><span>o</span></div>
            <div ref={containerRef} className="google-signin__button" />
        </div>
    );
}
