// ============================================
// ADVINHA - RoleReveal Component (Improved)
// Dramatic reveal of player's role
// ============================================

import { motion } from 'framer-motion';
import { useGameStore, useIsHost } from '../store/gameStore';
import type { RoleAssignment } from '../types';
import './RoleReveal.css';

interface RoleRevealProps {
    role: RoleAssignment;
}

export default function RoleReveal({ role }: RoleRevealProps) {
    const { nextPhase } = useGameStore();
    const isHost = useIsHost();
    const isImpostor = role.isImpostor;

    return (
        <motion.div
            className={`role-reveal ${isImpostor ? 'impostor' : 'player'}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Background Pulse Effect */}
            <div className={`role-bg-pulse ${isImpostor ? 'impostor' : ''}`} />

            {/* Main Content */}
            <div className="role-content">
                {/* Icon */}
                <motion.div
                    className="role-icon"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                        type: 'spring',
                        damping: 12,
                        stiffness: 200,
                        delay: 0.2
                    }}
                >
                    {isImpostor ? '🎭' : '👀'}
                </motion.div>

                {/* Role Title */}
                <motion.h1
                    className="role-title"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    {isImpostor ? 'Você é o Impostor!' : 'Você é Jogador'}
                </motion.h1>

                {/* Word or Instructions */}
                <motion.div
                    className="role-message"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    {isImpostor ? (
                        <>
                            <p className="impostor-hint">
                                Você não sabe a palavra secreta.
                            </p>
                            <p className="impostor-tip">
                                Finja que sabe e descubra qual é!
                            </p>
                        </>
                    ) : (
                        <>
                            <p className="word-label">A palavra secreta é:</p>
                            <motion.div
                                className="word-display"
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.8, type: 'spring' }}
                            >
                                {role.word}
                            </motion.div>
                            <p className="player-tip">
                                Não deixe o impostor descobrir!
                            </p>
                        </>
                    )}
                </motion.div>

                {/* Category Badge */}
                <motion.div
                    className="category-badge"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                >
                    📂 Categoria: <strong>{role.category.name}</strong>
                </motion.div>
            </div>

            {/* Host Continue Button */}
            {isHost && (
                <motion.div
                    className="role-action"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 }}
                >
                    <button className="continue-btn" onClick={nextPhase}>
                        ▶️ Iniciar Discussão
                    </button>
                </motion.div>
            )}

            {/* Waiting message for non-hosts */}
            {!isHost && (
                <motion.p
                    className="waiting-text"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                >
                    Aguardando host iniciar...
                </motion.p>
            )}
        </motion.div>
    );
}
