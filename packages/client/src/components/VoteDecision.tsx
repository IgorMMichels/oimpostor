// ============================================
// ADVINHA - VoteDecision Component
// Host decides to vote or continue with hints
// ============================================

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameStore, useIsHost } from '../store/gameStore';
import './VoteDecision.css';

interface VoteDecisionProps {
    timerEndsAt?: number;
}

export default function VoteDecision({ timerEndsAt }: VoteDecisionProps) {
    const { voteDecision, room } = useGameStore();
    const { voteDecision, room, playerId } = useGameStore();

    const [secondsLeft, setSecondsLeft] = useState(15);
    const [deciding, setDeciding] = useState(false);

    const hintRound = room?.gameState?.hintRound || 1;
    const hints = room?.gameState?.hints || [];

    // Decision voting state
    const votes = room?.gameState?.decisionVotes || {};
    const myVote = playerId ? votes[playerId] : undefined;
    const hasVoted = !!myVote;

    const voteCounts = {
        vote: 0,
        continue: 0
    };

    if (votes) {
        Object.values(votes).forEach(v => {
            if (v === 'vote') voteCounts.vote++;
            else if (v === 'continue') voteCounts.continue++;
        });
    }

    // Timer countdown
    useEffect(() => {
        if (!timerEndsAt) return;

        const interval = setInterval(() => {
            const remaining = Math.max(0, Math.ceil((timerEndsAt - Date.now()) / 1000));
            setSecondsLeft(remaining);
        }, 100);

        return () => clearInterval(interval);
    }, [timerEndsAt]);

    const handleDecision = (decision: 'vote' | 'continue') => {
        if (hasVoted || deciding) return;
        setDeciding(true);
        voteDecision(decision);
    };

    return (
        <motion.div
            className="vote-decision"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
        >
            {/* Timer */}
            <motion.div
                className={`decision-timer ${secondsLeft <= 5 ? 'urgent' : ''}`}
                animate={{ scale: secondsLeft <= 5 ? [1, 1.1, 1] : 1 }}
                transition={{ repeat: secondsLeft <= 5 ? Infinity : 0, duration: 0.5 }}
            >
                <span className="timer-value">{secondsLeft}</span>
                <span className="timer-label">segundos</span>
            </motion.div>

            {/* Question */}
            <div className="decision-header">
                <h2>Hora de votar?</h2>
                <p>Foram {hintRound} rodada(s) de dicas com {hints.length} dicas no total.</p>
            </div>

            {/* Decision Buttons (Host only) */}
            {/* Vote Decision UI */}
            <div className="decision-actions">
                {!hasVoted ? (
                    <>
                        <motion.button
                            className="decision-btn vote"
                            onClick={() => handleDecision('vote')}
                            disabled={deciding}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <span className="btn-icon">🗳️</span>
                            <span className="btn-text">Votar Agora</span>
                            <span className="btn-hint">Descobrir o impostor</span>
                        </motion.button>

                        <motion.button
                            className="decision-btn continue"
                            onClick={() => handleDecision('continue')}
                            disabled={deciding}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <span className="btn-icon">🔄</span>
                            <span className="btn-text">Mais Dicas</span>
                            <span className="btn-hint">Continuar investigando</span>
                        </motion.button>
                    </>
                ) : (
                    <div className="waiting-host">
                        <span className="waiting-icon">⏳</span>
                        <p>Aguardando outros jogadores...</p>
                        <p className="waiting-note">
                            Você votou em: <strong>{myVote === 'vote' ? 'Votar Agora' : 'Mais Dicas'}</strong>
                        </p>
                    </div>
                )}
            </div>

            {/* Vote Tally */}
            <div className="vote-tally">
                <div className="tally-item">
                    <span className="tally-label">Votar:</span>
                    <span className="tally-count">{voteCounts.vote}</span>
                </div>
                <div className="tally-mid">vs</div>
                <div className="tally-item">
                    <span className="tally-label">Mais Dicas:</span>
                    <span className="tally-count">{voteCounts.continue}</span>
                </div>
            </div>

            {/* Hint Summary */}
            <div className="hint-summary">
                <h3>Últimas dicas:</h3>
                <div className="summary-list">
                    {hints.slice(-4).map((h, i) => (
                        <div key={i} className="summary-item">
                            <strong>{h.playerName}:</strong> "{h.hint}"
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
