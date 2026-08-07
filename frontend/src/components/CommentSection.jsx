import { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import '../styles/CommentSection.css';

export default function CommentSection({ videoId, courseId }) {
    const { user } = useAuth();
    const [comments, setComments] = useState([]);
    const [loading, setLoading]   = useState(true);
    const [content, setContent]   = useState('');
    const [posting, setPosting]   = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyContent, setReplyContent] = useState('');
    const [replying, setReplying] = useState(false);

    useEffect(() => {
        if (!videoId) return;
        setLoading(true);
        api.get(`/comments/${videoId}`)
            .then(res => setComments(res.data.comments))
            .catch(() => setComments([]))
            .finally(() => setLoading(false));
        setReplyingTo(null);
        setContent('');
    }, [videoId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim()) return;
        setPosting(true);
        try {
            const res = await api.post('/comments', { videoId, courseId, content });
            setComments(prev => [res.data.comment, ...prev]);
            setContent('');
        } catch {
            // silencioso: si falla, el usuario puede reintentar
        } finally {
            setPosting(false);
        }
    };

    const handleReply = async (commentId) => {
        if (!replyContent.trim()) return;
        setReplying(true);
        try {
            const res = await api.post(`/comments/${commentId}/reply`, { content: replyContent });
            setComments(prev => prev.map(c => c._id === commentId ? res.data.comment : c));
            setReplyContent('');
            setReplyingTo(null);
        } catch {
            // silencioso
        } finally {
            setReplying(false);
        }
    };

    const fmtDate = (d) => new Date(d).toLocaleDateString('es', { day: 'numeric', month: 'short' });

    return (
        <div className="comment-section">
            <h3 className="comment-section__title">
                Comentarios {comments.length > 0 && <span className="comment-section__count">({comments.length})</span>}
            </h3>

            <form className="comment-section__form" onSubmit={handleSubmit}>
                <div className="comment__avatar">{user?.name?.[0]?.toUpperCase() || '?'}</div>
                <div className="comment-section__form-body">
                    <textarea
                        className="comment-section__textarea"
                        placeholder="Escribe un comentario o pregunta sobre este video..."
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        maxLength={1000}
                    />
                    <div className="comment-section__form-actions">
                        <button type="submit" className="comment-btn comment-btn--primary" disabled={posting || !content.trim()}>
                            {posting ? 'Publicando…' : 'Comentar'}
                        </button>
                    </div>
                </div>
            </form>

            {loading ? (
                <p className="comment-section__empty">Cargando comentarios...</p>
            ) : comments.length === 0 ? (
                <p className="comment-section__empty">Sé el primero en comentar este video.</p>
            ) : (
                <ul className="comment-section__list">
                    {comments.map(c => (
                        <li key={c._id} className="comment">
                            <div className="comment__avatar">{c.user?.name?.[0]?.toUpperCase() || '?'}</div>
                            <div className="comment__body">
                                <div className="comment__meta">
                                    <span className="comment__author">{c.user?.name || 'Usuario'}</span>
                                    <span className="comment__date">{fmtDate(c.createdAt)}</span>
                                </div>
                                <p className="comment__text">{c.content}</p>
                                <button
                                    className="comment__reply-btn"
                                    onClick={() => setReplyingTo(replyingTo === c._id ? null : c._id)}
                                >
                                    Responder
                                </button>

                                {c.replies?.length > 0 && (
                                    <ul className="comment__replies">
                                        {c.replies.map((r, i) => (
                                            <li key={r._id || i} className="comment comment--reply">
                                                <div className="comment__avatar comment__avatar--sm">
                                                    {r.user?.name?.[0]?.toUpperCase() || '?'}
                                                </div>
                                                <div className="comment__body">
                                                    <div className="comment__meta">
                                                        <span className="comment__author">{r.user?.name || 'Usuario'}</span>
                                                        {r.isAdminReply && <span className="comment__badge">Instructor</span>}
                                                        <span className="comment__date">{fmtDate(r.createdAt)}</span>
                                                    </div>
                                                    <p className="comment__text">{r.content}</p>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}

                                {replyingTo === c._id && (
                                    <div className="comment__reply-form">
                                        <textarea
                                            className="comment-section__textarea"
                                            placeholder="Escribe una respuesta..."
                                            value={replyContent}
                                            onChange={e => setReplyContent(e.target.value)}
                                            maxLength={1000}
                                            autoFocus
                                        />
                                        <div className="comment__reply-actions">
                                            <button
                                                className="comment-btn comment-btn--outline"
                                                onClick={() => { setReplyingTo(null); setReplyContent(''); }}
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                className="comment-btn comment-btn--primary"
                                                disabled={replying || !replyContent.trim()}
                                                onClick={() => handleReply(c._id)}
                                            >
                                                {replying ? 'Enviando…' : 'Responder'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
