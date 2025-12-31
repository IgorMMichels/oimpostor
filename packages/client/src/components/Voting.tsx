// ============================================
// ADVINHA - Voting Component
// Vote for who you think is the impostor
// ============================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, useIsHost } from '../store/gameStore';
import './Voting.css';

export default function Voting() {
    const { room, vote, nextPhase, playerId } = useGameStore();
    const isHost = useIsHost();

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [hasVoted, setHasVoted] = useState(false);

    if (!room) return null;

    const players = room.players.filter(p => p.isConnected);
    const votedCount = Object.keys(room.gameState?.votes || {}).length;
    const totalPlayers = players.length;

    const handleVote = (targetId: string) => {
        if (hasVoted || targetId === playerId) return;
        setSelectedId(targetId);
    };

    const confirmVote = () => {
        if (selectedId && !hasVoted) {
            vote(selectedId);
            setHasVoted(true);
        }
    };

    return (
        <motion.div
            className="voting-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div className="voting-header">
                <h2>🗳️ Votação</h2>
                <p>Quem você acha que é o impostor?</p>
                <div className="vote-progress">
                    <div className="vote-count">
                        {votedCount}/{totalPlayers} votaram
                    </div>
                    <div className="vote-bar">
                        <motion.div
                            className="vote-bar-fill"
                            initial={{ width: 0 }}
                            animate={{ width: `${(votedCount / totalPlayers) * 100}%` }}
                        />
                    </div>
                </div>
            </div>

            {hasVoted ? (
                <motion.div
                    className="voted-message"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                >
                    <div className="voted-icon">✓</div>
                    <h3>Voto registrado!</h3>
                    <p>Aguardando outros jogadores...</p>
                </motion.div>
            ) : (
                <>
                    <div className="players-voting-grid">
                        <AnimatePresence>
                            {players.map((player, index) => (
                                <motion.div
                                    key={player.id}
                                    className={`voting-player ${player.id === playerId ? 'self' : ''} ${selectedId === player.id ? 'selected' : ''}`}
                                    onClick={() => handleVote(player.id)}
                                    whileHover={player.id !== playerId ? { scale: 1.02 } : {}}
                                    whileTap={player.id !== playerId ? { scale: 0.98 } : {}}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <div className={`avatar ${player.id === playerId ? '' : 'selectable'}`}>
                                        {player.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="player-name">
                                        {player.name}
                                        {player.id === playerId && ' (você)'}
                                    </span>
                                    {selectedId === player.id && (
                                        <motion.div
                                            className="selected-indicator"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                        >
                                            ✓
                                        </motion.div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    <div className="voting-actions">
                        <button
                            className="btn btn-primary btn-lg"
                            onClick={confirmVote}
                            disabled={!selectedId}
                        >
                            {selectedId ? '🗳️ Confirmar Voto' : 'Selecione um jogador'}
                        </button>
                    </div>
                </>
            )}

            {/* Host can force proceed */}
            {isHost && hasVoted && votedCount < totalPlayers && (
                <div className="host-controls" style={{ marginTop: 'var(--space-lg)' }}>
                    <button className="btn btn-ghost" onClick={nextPhase}>
                        ⏭️ Encerrar votação
                    </button>
                </div>
            )}
        </motion.div>
    );
}
