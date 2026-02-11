import { useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import { Check, X, AlertTriangle } from 'lucide-react';
import type { Post } from '../../types/index';
import { StatusBadge } from './StatusBadge';

interface SwipeablePostCardProps {
    post: Post;
    pillarName: string;
    visualDate?: Date;
    isStale?: boolean;
    onApprove: () => void;
    onReject: (feedback: string) => void;
    onTap: () => void;
    canApprove: boolean;
}

export function SwipeablePostCard({
    post,
    pillarName,
    visualDate,
    isStale,
    onApprove,
    onReject,
    onTap,
    canApprove
}: SwipeablePostCardProps) {
    const [swipeOffset, setSwipeOffset] = useState(0);
    const [isRevealed, setIsRevealed] = useState<'approve' | 'reject' | null>(null);
    const [showRejectInput, setShowRejectInput] = useState(false);
    const [rejectFeedback, setRejectFeedback] = useState('');


    const SWIPE_THRESHOLD = 80;
    const MAX_SWIPE = 120;

    // Only allow swiping for posts in pending_approval status
    const canSwipe = canApprove && post.status === 'pending_approval';

    const handlers = useSwipeable({
        onSwiping: (e) => {
            if (!canSwipe) return;
            const offset = Math.min(Math.max(e.deltaX, -MAX_SWIPE), MAX_SWIPE);
            setSwipeOffset(offset);
        },
        onSwipedLeft: (e) => {
            if (!canSwipe) return;
            if (Math.abs(e.deltaX) > SWIPE_THRESHOLD) {
                setIsRevealed('reject');
                setShowRejectInput(true);
            }
            setSwipeOffset(0);
        },
        onSwipedRight: (e) => {
            if (!canSwipe) return;
            if (Math.abs(e.deltaX) > SWIPE_THRESHOLD) {
                setIsRevealed('approve');
                // Auto-approve after brief delay
                setTimeout(() => {
                    onApprove();
                    setIsRevealed(null);
                }, 300);
            }
            setSwipeOffset(0);
        },
        onSwiped: () => {
            if (!isRevealed) {
                setSwipeOffset(0);
            }
        },
        trackMouse: false,
        trackTouch: true,
        preventScrollOnSwipe: true,
    });

    const handleRejectSubmit = () => {
        if (rejectFeedback.trim().length >= 10) {
            onReject(rejectFeedback.trim());
            setShowRejectInput(false);
            setRejectFeedback('');
            setIsRevealed(null);
        }
    };

    const handleCancelReject = () => {
        setShowRejectInput(false);
        setRejectFeedback('');
        setIsRevealed(null);
    };

    // Calculate background color based on swipe direction
    const getBackgroundStyle = () => {
        if (swipeOffset > 20) {
            const opacity = Math.min(swipeOffset / MAX_SWIPE, 0.8);
            return `rgba(34, 197, 94, ${opacity})`; // Green for approve
        } else if (swipeOffset < -20) {
            const opacity = Math.min(Math.abs(swipeOffset) / MAX_SWIPE, 0.8);
            return `rgba(239, 68, 68, ${opacity})`; // Red for reject
        }
        return 'transparent';
    };

    if (showRejectInput) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-red-200 p-4 space-y-3">
                <div className="flex items-center gap-2 text-red-600">
                    <X className="w-5 h-5" />
                    <span className="font-semibold">Motivo del rechazo</span>
                </div>
                <textarea
                    value={rejectFeedback}
                    onChange={(e) => setRejectFeedback(e.target.value)}
                    placeholder="Describe el motivo del rechazo (mín. 10 caracteres)..."
                    className="w-full p-3 border border-gray-200 rounded-lg resize-none h-24 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    autoFocus
                />
                <div className="flex gap-2">
                    <button
                        onClick={handleCancelReject}
                        className="flex-1 py-2 px-4 text-gray-600 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleRejectSubmit}
                        disabled={rejectFeedback.trim().length < 10}
                        className="flex-1 py-2 px-4 text-white bg-red-500 rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Rechazar
                    </button>
                </div>
                <p className="text-xs text-gray-500 text-center">
                    {rejectFeedback.trim().length}/10 caracteres mínimo
                </p>
            </div>
        );
    }

    return (
        <div className="relative overflow-hidden rounded-xl">
            {/* Background action indicators */}
            <div
                className="absolute inset-0 flex items-center justify-between px-6 transition-colors"
                style={{ backgroundColor: getBackgroundStyle() }}
            >
                <div className={`flex items-center gap-2 text-white transition-opacity ${swipeOffset < -20 ? 'opacity-100' : 'opacity-0'}`}>
                    <X className="w-6 h-6" />
                    <span className="font-semibold">Rechazar</span>
                </div>
                <div className={`flex items-center gap-2 text-white transition-opacity ${swipeOffset > 20 ? 'opacity-100' : 'opacity-0'}`}>
                    <span className="font-semibold">Aprobar</span>
                    <Check className="w-6 h-6" />
                </div>
            </div>

            {/* Swipeable card */}
            <div
                {...handlers}
                onClick={() => !swipeOffset && onTap()}
                className={`relative bg-white rounded-xl shadow-sm border border-gray-100 p-4 transition-transform cursor-pointer active:cursor-grabbing ${isRevealed === 'approve' ? 'translate-x-full' : ''
                    } ${isStale ? 'border-l-4 border-l-amber-400' : ''}`}
                style={{
                    transform: `translateX(${swipeOffset}px)`,
                    transition: swipeOffset === 0 ? 'transform 0.3s ease-out' : 'none'
                }}
            >
                {/* Swipe hint for pending posts */}
                {canSwipe && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 text-xs text-gray-400">
                        <span>← →</span>
                    </div>
                )}

                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        {/* Post type indicator */}
                        <div className="flex items-center gap-2 mb-2">
                            {post.type === 'pinned' ? (
                                <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                                    📌 Fijo
                                </span>
                            ) : (
                                <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                                    🌊 Flow
                                </span>
                            )}
                            <StatusBadge status={post.status} size="sm" />
                        </div>

                        {/* Pillar */}
                        <p className="font-medium text-gray-900 truncate">{pillarName}</p>

                        {/* Content preview */}
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {post.content.script || post.content.caption || 'Sin contenido'}
                        </p>

                        {/* Visual date */}
                        {visualDate && (
                            <p className="text-xs text-gray-400 mt-2">
                                📅 {visualDate.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                            </p>
                        )}
                    </div>

                    {/* Stale indicator */}
                    {isStale && (
                        <div className="flex-shrink-0">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
