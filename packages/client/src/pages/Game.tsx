// ============================================
// ADVINHA - Game Page (Updated with new phases)
// Hint rounds, vote decision, and improved flow
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

    // Get phase label for header
    const getPhaseLabel = () => {
        switch (phase) {
            case 'spinning_category':
            case 'spinning_word':
                return 'Sorteando...';
            case 'role_reveal':
                return 'Revelação';
            case 'hint_round':
                return `Dicas #${hintRound}`;
            case 'vote_decision':
                return 'Decisão';
            case 'voting':
                return 'Votação';
            case 'vote_results':
                return 'Resultado';
            case 'game_results':
                return 'Fim de Jogo';
            default:
                return '';
        }
    };

    return (
        <div className="game-page">
            <GridBackground gridSize={80} />

            {/* Header */}
            <motion.header
                className="game-header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="round-badge">
                    <span className="round-label">Rodada</span>
                    <span className="round-number">{currentRound}/{totalRounds}</span>
                </div>

                <div className="phase-badge">
                    {getPhaseLabel()}
                </div>

                <div className="room-code-mini">{room.code}</div>
            </motion.header>

            {/* Game Content */}
            <main className="game-content">
                <AnimatePresence mode="wait">
                    {renderPhase()}
                </AnimatePresence>
            </main>
        </div>
    );
}
