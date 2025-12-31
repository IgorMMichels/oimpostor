// ============================================
// ADVINHA - Game Page (Enhanced Visual States)
// Color-coded phases, clear feedback, tension
// ============================================

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import GridBackground from '../components/GridBackground';
import CategorySpinner from '../components/CategorySpinner';
import WordReveal from '../components/WordReveal';
import RoleReveal from '../components/RoleReveal';
import HintRound from '../components/HintRound';
import VoteDecision from '../components/VoteDecision';
import Voting from '../components/Voting';
import Results from '../components/Results';
import './Game.css';

// Phase color mapping for visual states
const PHASE_COLORS = {
    spinning_category: { bg: 'phase-mystery', label: '🎰 Sorteando categoria...' },
    spinning_word: { bg: 'phase-mystery', label: '✨ Sorteando palavra...' },
    role_reveal: { bg: 'phase-reveal', label: '👀 Revelação' },
    hint_round: { bg: 'phase-investigation', label: '🔍 Dicas' },
    vote_decision: { bg: 'phase-decision', label: '⚡ Decisão' },
    voting: { bg: 'phase-tension', label: '🗳️ Votação' },
    vote_results: { bg: 'phase-results', label: '📊 Resultado' },
    game_results: { bg: 'phase-final', label: '🏆 Fim de Jogo' },
} as const;

export default function Game() {
    const navigate = useNavigate();
    const { room, role, gameResults, currentTurnPlayerId } = useGameStore();

    // Redirect if not in room or game hasn't started
    useEffect(() => {
        if (!room) {
            navigate('/');
            return;
        }
        if (!room.gameState || room.gameState.phase === 'lobby') {
            navigate(`/sala/${room.code}`);
        }
    }, [room, navigate]);

    if (!room?.gameState) return null;

    const { phase, currentRound, totalRounds, category, timerEndsAt, hintRound } = room.gameState;
    const phaseConfig = PHASE_COLORS[phase as keyof typeof PHASE_COLORS] || { bg: '', label: '' };

    const renderPhase = () => {
        switch (phase) {
            case 'spinning_category':
                return <CategorySpinner />;

            case 'spinning_word':
                return <WordReveal category={category} isSpinning />;

            case 'role_reveal':
                return role ? <RoleReveal role={role} /> : null;

            case 'hint_round':
                return (
                    <HintRound
                        currentTurnPlayerId={currentTurnPlayerId || undefined}
                    />
                );

            case 'vote_decision':
                return (
                    <VoteDecision
                        timerEndsAt={timerEndsAt || undefined}
                    />
                );

            case 'voting':
                return <Voting />;

            case 'vote_results':
            case 'game_results':
                return gameResults ? (
                    <Results
                        results={gameResults}
                        isGameOver={phase === 'game_results'}
                    />
                ) : null;

            default:
                return null;
        }
    };

    return (
        <motion.div
            className={`game-page ${phaseConfig.bg}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            key={phase}
        >
            <GridBackground gridSize={80} />

            {/* Header with Phase Indicator */}
            <motion.header
                className="game-header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="round-badge">
                    <span className="round-label">Rodada</span>
                    <span className="round-number">{currentRound}/{totalRounds}</span>
                </div>

                {/* PROMINENT PHASE BADGE */}
                <motion.div
                    className={`phase-badge ${phaseConfig.bg}`}
                    key={phase}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', damping: 15 }}
                >
                    {phase === 'hint_round' ? `🔍 Dicas #${hintRound}` : phaseConfig.label}
                </motion.div>

                <div className="room-code-mini">{room.code}</div>
            </motion.header>

            {/* Game Content */}
            <main className="game-content">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={phase}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {renderPhase()}
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Phase Transition Overlay */}
            <AnimatePresence>
                {(phase === 'voting' || phase === 'vote_decision') && (
                    <motion.div
                        className="tension-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
}
