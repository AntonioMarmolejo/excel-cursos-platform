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
            <h3 className="comment-section-title">
                Comentarios {comments.length > 0 && <span className="comment-count">({comments.length})</span>}
            </h3>

            <form className="comment-form" onSubmit={handleSubmit}>
                <div className="comment-avatar">{user?.name?.[0]?.toUpperCase() || '?'}</div>
                <div className="comment-form-body">
                    <textarea
                        placeholder="Escribe un comentario o pregunta sobre este video..."
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        maxLength={1000}
                    />
                    <div className="comment-form-actions">
                        <button type="submit" className="comment-btn comment-btn-primary" disabled={posting || !content.trim()}>
                            {posting ? 'Publicando…' : 'Comentar'}
                        </button>
                    </div>
                </div>
            </form>

            {loading ? (
                <p className="comment-empty">Cargando comentarios...</p>
            ) : comments.length === 0 ? (
                <p className="comment-empty">Sé el primero en comentar este video.</p>
            ) : (
                <ul className="comment-list">
                    {comments.map(c => (
                        <li key={c._id} className="comment-item">
                            <div className="comment-avatar">{c.user?.name?.[0]?.toUpperCase() || '?'}</div>
                            <div className="comment-body">
                                <div className="comment-meta">
                                    <span className="comment-author">{c.user?.name || 'Usuario'}</span>
                                    <span className="comment-date">{fmtDate(c.createdAt)}</span>
                                </div>
                                <p className="comment-text">{c.content}</p>
                                <button
                                    className="comment-reply-btn"
                                    onClick={() => setReplyingTo(replyingTo === c._id ? null : c._id)}
                                >
                                    Responder
                                </button>

                                {c.replies?.length > 0 && (
                                    <ul className="comment-replies">
                                        {c.replies.map((r, i) => (
                                            <li key={r._id || i} className="comment-reply">
                                                <div className="comment-avatar comment-avatar-sm">
                                                    {r.user?.name?.[0]?.toUpperCase() || '?'}
                                                </div>
                                                <div className="comment-body">
                                                    <div className="comment-meta">
                                                        <span className="comment-author">{r.user?.name || 'Usuario'}</span>
                                                        {r.isAdminReply && <span className="comment-badge">Instructor</span>}
                                                        <span className="comment-date">{fmtDate(r.createdAt)}</span>
                                                    </div>
                                                    <p className="comment-text">{r.content}</p>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}

                                {replyingTo === c._id && (
                                    <div className="comment-reply-form">
                                        <textarea
                                            placeholder="Escribe una respuesta..."
                                            value={replyContent}
                                            onChange={e => setReplyContent(e.target.value)}
                                            maxLength={1000}
                                            autoFocus
                                        />
                                        <div className="comment-form-actions">
                                            <button
                                                className="comment-btn comment-btn-outline"
                                                onClick={() => { setReplyingTo(null); setReplyContent(''); }}
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                className="comment-btn comment-btn-primary"
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
