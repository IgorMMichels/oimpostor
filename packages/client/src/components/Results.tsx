// ============================================
// ADVINHA - Results Component
// Show game/round results with impostor reveal
// ============================================

import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameStore, useIsHost } from '../store/gameStore';
import type { GameResults } from '../types';
import './Results.css';

interface ResultsProps {
    results: GameResults;
    isGameOver: boolean;
}

export default function Results({ results, isGameOver }: ResultsProps) {
    const navigate = useNavigate();
    const { room, nextPhase, leaveRoom } = useGameStore();
    const isHost = useIsHost();

    if (!room) return null;

    const impostor = room.players.find(p => p.id === results.impostorId);
    const sortedPlayers = [...room.players].sort(
        (a, b) => (results.totalScores[b.id] || 0) - (results.totalScores[a.id] || 0)
    );

    const handleNextRound = () => {
        nextPhase();
    };

    const handleBackToLobby = () => {
        nextPhase();
    };

    const handleLeave = () => {
        leaveRoom();
        navigate('/');
    };

    return (
        <motion.div
            className="results-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Impostor Reveal */}
            <motion.div
                className="impostor-reveal"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', duration: 0.6 }}
            >
                <div className="reveal-icon">🎭</div>
                <h2>O Impostor era...</h2>
                <motion.div
                    className="impostor-name"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    {impostor?.name || 'Desconhecido'}
                </motion.div>
                <motion.div
                    className={`verdict ${results.impostorCaught ? 'caught' : 'escaped'}`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: 'spring' }}
                >
                    {results.impostorCaught ? '🎉 Descoberto!' : '😈 Escapou!'}
                </motion.div>
            </motion.div>

            {/* Scoreboard */}
            <motion.div
                className="scoreboard"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
            >
                <h3>{isGameOver ? '🏆 Placar Final' : '📊 Placar da Rodada'}</h3>

                <div className="scores-list">
                    {sortedPlayers.map((player, index) => (
                        <motion.div
                            key={player.id}
                            className={`score-row ${player.id === results.impostorId ? 'impostor' : ''}`}
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.8 + index * 0.1 }}
                        >
                            <div className="score-rank">
                                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}º`}
                            </div>
                            <div className="score-player">
                                <span className="score-name">{player.name}</span>
                                {player.id === results.impostorId && (
                                    <span className="impostor-badge">🎭</span>
                                )}
                            </div>
                            <div className="score-points">
                                <span className="round-score">
                                    +{results.roundScores[player.id] || 0}
                                </span>
                                <span className="total-score">
                                    {results.totalScores[player.id] || 0} pts
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* Actions */}
            {isHost && (
                <motion.div
                    className="results-actions"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                >
                    {isGameOver ? (
                        <>
                            <button className="btn btn-primary btn-lg" onClick={handleBackToLobby}>
                                🔄 Jogar Novamente
                            </button>
                            <button className="btn btn-ghost" onClick={handleLeave}>
                                🚪 Sair
                            </button>
                        </>
                    ) : (
                        <button className="btn btn-primary btn-lg animate-glow" onClick={handleNextRound}>
                            ➡️ Próxima Rodada
                        </button>
                    )}
                </motion.div>
            )}

            {!isHost && (
                <motion.p
                    className="waiting-host"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                >
                    Aguardando o host continuar...
                </motion.p>
            )}
        </motion.div>
    );
}
