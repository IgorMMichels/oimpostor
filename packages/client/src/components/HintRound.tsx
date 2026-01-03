// ============================================
// ADVINHA - HintRound Component
// Players give hints one by one
// ============================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, useCurrentPlayer } from '../store/gameStore';
import './HintRound.css';

interface HintRoundProps {
    currentTurnPlayerId?: string;
}

export default function HintRound({ currentTurnPlayerId }: HintRoundProps) {
    const { room, submitHint, role } = useGameStore();
    const currentPlayer = useCurrentPlayer();

    const [hint, setHint] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const isMyTurn = currentTurnPlayerId === currentPlayer?.id;
    const hints = room?.gameState?.hints || [];
    const hintRound = room?.gameState?.hintRound || 1;
    const category = room?.gameState?.category;
    const word = role?.word;
    const isImpostor = role?.isImpostor;

    // Find who's turn it is
    const turnPlayer = room?.players.find(p => p.id === currentTurnPlayerId);

    // Filter hints for current round
    const currentRoundHints = hints.filter(h => h.round === hintRound);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!hint.trim() || submitting || !isMyTurn) return;

        setSubmitting(true);
        submitHint(hint.trim());
        setHint('');
        setSubmitting(false);
    };

    return (
        <motion.div
            className="hint-round"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
        >
            {/* Header */}
            <div className="hint-header">
                <span className="hint-badge">Rodada de Dicas #{hintRound}</span>
                <h2>Dê uma dica sobre a palavra</h2>
                <p>Cada jogador dá uma dica. O impostor precisa blefar!</p>
            </div>

            {/* Word/Category Reminder */}
            <div className={`word-reminder ${isImpostor ? 'impostor' : ''}`}>
                {category && (
                    <div className="reminder-category">
                        <span className="reminder-icon">{category.icon}</span>
                        <span className="reminder-text">{category.name}</span>
                    </div>
                )}
                <div className="reminder-word">
                    <span className="reminder-label">{isImpostor ? '🎭 Você é o Impostor' : '🔑 Sua palavra'}</span>
                    <span className="reminder-value">{isImpostor ? '???' : word || '...'}</span>
                </div>
            </div>

            {/* Turn Indicator */}
            <motion.div
                className={`turn-indicator ${isMyTurn ? 'my-turn' : ''}`}
                animate={{ scale: isMyTurn ? [1, 1.02, 1] : 1 }}
                transition={{ repeat: isMyTurn ? Infinity : 0, duration: 2 }}
            >
                {isMyTurn ? (
                    <>
                        <span className="turn-icon">🎤</span>
                        <span>Sua vez de dar uma dica!</span>
                    </>
                ) : (
                    <>
                        <span className="turn-icon">⏳</span>
                        <span>Vez de <strong>{turnPlayer?.name || '...'}</strong></span>
                    </>
                )}
            </motion.div>

            {/* Hint Input (only for current player) */}
            <AnimatePresence>
                {isMyTurn && (
                    <motion.form
                        className="hint-form"
                        onSubmit={handleSubmit}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        <input
                            type="text"
                            className="hint-input"
                            placeholder="Digite sua dica..."
                            value={hint}
                            onChange={(e) => setHint(e.target.value)}
                            maxLength={50}
                            autoFocus
                        />
                        <button
                            type="submit"
                            className="hint-submit"
                            disabled={!hint.trim() || submitting}
                        >
                            {submitting ? '⏳' : '📤'} Enviar
                        </button>
                    </motion.form>
                )}
            </AnimatePresence>

            {/* Hints List */}
            <div className="hints-list">
                <h3>Dicas desta rodada</h3>
                <AnimatePresence>
                    {currentRoundHints.length === 0 ? (
                        <p className="no-hints">Aguardando dicas...</p>
                    ) : (
                        currentRoundHints.map((h, index) => (
                            <motion.div
                                key={`${h.playerId}-${h.round}`}
                                className={`hint-item ${h.playerId === currentPlayer?.id ? 'mine' : ''}`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <span className="hint-author">{h.playerName}:</span>
                                <span className="hint-text">"{h.hint}"</span>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* Progress */}
            <div className="hint-progress">
                <div className="progress-bar">
                    <motion.div
                        className="progress-fill"
                        initial={{ width: 0 }}
                        animate={{
                            width: `${(currentRoundHints.length / (room?.players.length || 1)) * 100}%`
                        }}
                    />
                </div>
                <span className="progress-text">
                    {currentRoundHints.length} / {room?.players.length} dicas
                </span>
            </div>
        </motion.div>
    );
}
