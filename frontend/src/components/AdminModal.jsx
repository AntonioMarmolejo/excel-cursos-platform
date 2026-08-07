import { useEffect } from 'react';

export default function AdminModal({ title, onClose, children, wide = false }) {
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    return (
        <div className="modal" onClick={onClose}>
            <div className={`modal__box${wide ? ' modal__box--wide' : ''}`} onClick={e => e.stopPropagation()}>
                <div className="modal__header">
                    <h3 className="modal__title">{title}</h3>
                    <button className="modal__close" onClick={onClose}>✕</button>
                </div>
                <div className="modal__body">{children}</div>
            </div>
        </div>
    );
}
