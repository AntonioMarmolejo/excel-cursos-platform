import { useEffect, useRef, useState } from 'react';
import { Upload } from 'tus-js-client';
import api from '../api/client';

const MAX_SIZE_GB = 5;

// Sube un archivo de video directo a la librería de Bunny Stream por TUS
// (subida reanudable). El backend crea el video en Bunny y firma la subida;
// el archivo nunca pasa por nuestro servidor.
export default function BunnyUploader({ courseId, title, onFileChosen, onUploaded }) {
    const [progress, setProgress] = useState(null);   // null = sin subida en curso
    const [error, setError] = useState('');
    const [done, setDone] = useState(false);
    const uploadRef = useRef(null);
    const inputRef = useRef(null);

    // Si se cierra el formulario a mitad de la subida, se cancela
    useEffect(() => () => uploadRef.current?.abort(), []);

    const handleFile = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;

        if (!file.type.startsWith('video/')) return setError('El archivo debe ser un video (MP4, MOV, MKV…)');
        if (file.size > MAX_SIZE_GB * 1024 ** 3) return setError(`El video no puede pesar más de ${MAX_SIZE_GB} GB`);

        setError('');
        setDone(false);
        setProgress(0);
        const videoTitle = title?.trim() || file.name.replace(/\.[^.]+$/, '');
        onFileChosen?.(videoTitle);

        try {
            const { data } = await api.post('/videos/upload-credentials', { courseId, title: videoTitle });

            const upload = new Upload(file, {
                endpoint: 'https://video.bunnycdn.com/tusupload',
                retryDelays: [0, 3000, 5000, 10000, 20000],
                headers: {
                    AuthorizationSignature: data.signature,
                    AuthorizationExpire: String(data.expires),
                    VideoId: data.bunnyVideoId,
                    LibraryId: String(data.libraryId),
                },
                metadata: { filetype: file.type, title: videoTitle },
                onProgress: (sent, total) => setProgress(Math.round((sent / total) * 100)),
                onError: (err) => {
                    setProgress(null);
                    setError(`La subida falló: ${err.message || 'error de red'}. Intenta de nuevo.`);
                },
                onSuccess: () => {
                    setProgress(null);
                    setDone(true);
                    onUploaded(data.bunnyVideoId);
                },
            });
            uploadRef.current = upload;

            // Reanuda una subida previa del mismo archivo si quedó a medias
            const previous = await upload.findPreviousUploads();
            if (previous.length) upload.resumeFromPreviousUpload(previous[0]);
            upload.start();
        } catch (err) {
            setProgress(null);
            setError(err.response?.data?.message || 'No se pudo iniciar la subida');
        }
    };

    const uploading = progress !== null;

    return (
        <div className="bunny-uploader">
            <button
                type="button"
                className="btn btn--outline btn--sm"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
            >
                {uploading ? `Subiendo… ${progress}%` : done ? '🔁 Reemplazar video' : '📤 Subir video desde tu equipo'}
            </button>
            <input ref={inputRef} type="file" accept="video/*" onChange={handleFile} hidden />

            {uploading && (
                <div className="bunny-uploader__bar" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                    <div className="bunny-uploader__fill" style={{ width: `${progress}%` }} />
                </div>
            )}
            {uploading && <p className="admin-form__hint">No cierres esta ventana hasta que termine la subida.</p>}
            {done && <p className="admin-form__hint">✓ Video subido. Bunny lo está procesando; la duración se completará sola en unos minutos.</p>}
            {error && <p className="admin-form__thumbnail-error">{error}</p>}
        </div>
    );
}
