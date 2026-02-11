import { useEffect, useState, useRef } from 'react';
import { useCommentStore, extractMentions } from '@stores/commentStore';
import { useAuthStore } from '@stores/authStore';
import { useUserStore } from '@stores/userStore';
import { createNotification } from '@stores/notificationStore';
import { Send, Trash2, MessageCircle, AtSign } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { PostComment } from '../../types/index';

interface CommentSectionProps {
    postId: string;
    clientId?: string;
}

export function CommentSection({ postId }: CommentSectionProps) {
    const { user } = useAuthStore();
    const { users } = useUserStore();
    const { comments, isLoading, fetchComments, addComment, deleteComment, clearComments } = useCommentStore();

    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showMentions, setShowMentions] = useState(false);
    const [mentionSearch, setMentionSearch] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const commentsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const unsub = fetchComments(postId);
        return () => {
            unsub();
            clearComments();
        };
    }, [postId, fetchComments, clearComments]);

    // Auto-scroll to bottom when new comments arrive
    useEffect(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [comments.length]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || !user || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const mentions = extractMentions(message);
            await addComment(
                postId,
                user.id,
                user.name,
                user.role,
                message.trim(),
                mentions
            );

            // Send notifications to mentioned users
            for (const mentionedName of mentions) {
                const mentionedUser = users.find(u =>
                    u.name.toLowerCase().includes(mentionedName.toLowerCase())
                );
                if (mentionedUser && mentionedUser.id !== user.id) {
                    await createNotification(
                        mentionedUser.id,
                        'general',
                        `${user.name} te mencionó`,
                        message.slice(0, 100),
                        { postId, url: `/posts/${postId}/edit` }
                    );
                }
            }

            setMessage('');
        } catch (error) {
            console.error('Error adding comment:', error);
        }
        setIsSubmitting(false);
    };

    const handleDelete = async (commentId: string) => {
        if (!confirm('¿Eliminar este comentario?')) return;
        try {
            await deleteComment(postId, commentId);
        } catch (error) {
            console.error('Error deleting comment:', error);
        }
    };

    const handleMentionClick = (userName: string) => {
        const words = message.split(' ');
        words[words.length - 1] = `@${userName.split(' ')[0]} `;
        setMessage(words.join(' '));
        setShowMentions(false);
        inputRef.current?.focus();
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setMessage(value);

        // Check if user is typing an @mention
        const lastWord = value.split(' ').pop() || '';
        if (lastWord.startsWith('@') && lastWord.length > 1) {
            setMentionSearch(lastWord.slice(1));
            setShowMentions(true);
        } else {
            setShowMentions(false);
        }
    };

    const filteredUsers = users.filter(u =>
        u.id !== user?.id &&
        u.name.toLowerCase().includes(mentionSearch.toLowerCase())
    ).slice(0, 5);

    const getRoleColor = (role: PostComment['user_role']) => {
        switch (role) {
            case 'admin': return 'bg-purple-100 text-purple-700';
            case 'manager': return 'bg-blue-100 text-blue-700';
            case 'creative': return 'bg-green-100 text-green-700';
            case 'production': return 'bg-orange-100 text-orange-700';
            case 'client': return 'bg-pink-100 text-pink-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getRoleName = (role: PostComment['user_role']) => {
        switch (role) {
            case 'admin': return 'Admin';
            case 'manager': return 'Manager';
            case 'creative': return 'Creativo';
            case 'production': return 'Producción';
            case 'client': return 'Cliente';
            default: return role;
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
                <MessageCircle className="w-5 h-5 text-gray-500" />
                <h3 className="font-semibold text-gray-900">
                    Comentarios {comments.length > 0 && `(${comments.length})`}
                </h3>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full" />
                    </div>
                ) : comments.length === 0 ? (
                    <div className="text-center py-8">
                        <MessageCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No hay comentarios aún</p>
                        <p className="text-xs text-gray-400 mt-1">Sé el primero en comentar</p>
                    </div>
                ) : (
                    comments.map((comment) => (
                        <div
                            key={comment.id}
                            className={`group flex gap-3 ${comment.user_id === user?.id ? 'flex-row-reverse' : ''
                                }`}
                        >
                            {/* Avatar */}
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                                    {comment.user_name.charAt(0).toUpperCase()}
                                </div>
                            </div>

                            {/* Message Bubble */}
                            <div className={`flex-1 max-w-[80%] ${comment.user_id === user?.id ? 'text-right' : ''
                                }`}>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-medium text-gray-900">
                                        {comment.user_name}
                                    </span>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${getRoleColor(comment.user_role)}`}>
                                        {getRoleName(comment.user_role)}
                                    </span>
                                </div>
                                <div className={`inline-block px-3 py-2 rounded-2xl text-sm ${comment.user_id === user?.id
                                    ? 'bg-primary-500 text-white rounded-tr-md'
                                    : 'bg-gray-100 text-gray-800 rounded-tl-md'
                                    }`}>
                                    {/* Highlight @mentions */}
                                    {comment.message.split(/(@\w+)/g).map((part, i) =>
                                        part.startsWith('@') ? (
                                            <span key={i} className="font-medium text-primary-300">
                                                {part}
                                            </span>
                                        ) : part
                                    )}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-gray-400">
                                        {formatDistanceToNow(comment.createdAt, { addSuffix: true, locale: es })}
                                    </span>
                                    {(comment.user_id === user?.id || user?.role === 'admin') && (
                                        <button
                                            onClick={() => handleDelete(comment.id)}
                                            className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
                <div ref={commentsEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-100 p-4 relative">
                {/* Mention Suggestions */}
                {showMentions && filteredUsers.length > 0 && (
                    <div className="absolute bottom-full left-4 right-4 mb-2 bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden">
                        {filteredUsers.map(u => (
                            <button
                                key={u.id}
                                onClick={() => handleMentionClick(u.name)}
                                className="w-full px-4 py-2 flex items-center gap-2 hover:bg-gray-50 text-left"
                            >
                                <AtSign className="w-4 h-4 text-gray-400" />
                                <span className="text-sm font-medium">{u.name}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${getRoleColor(u.role)}`}>
                                    {getRoleName(u.role)}
                                </span>
                            </button>
                        ))}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex items-center gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={message}
                        onChange={handleInputChange}
                        placeholder="Escribe un comentario... (@menciona usuarios)"
                        className="flex-1 px-4 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                        disabled={isSubmitting}
                    />
                    <button
                        type="submit"
                        disabled={!message.trim() || isSubmitting}
                        className="p-2.5 bg-primary-500 text-white rounded-full hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </div>
    );
}
