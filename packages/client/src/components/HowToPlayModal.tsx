// ============================================
// How To Play Modal - Interactive Tutorial
// Animated visual examples showing gameplay
// ============================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './HowToPlayModal.css';

interface HowToPlayModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// Simulated players for demo
const DEMO_PLAYERS = [
    { name: 'Ana', emoji: '👩' },
    { name: 'Bruno', emoji: '🧔' },
    { name: 'Carol', emoji: '👧' },
    { name: 'Diego', emoji: '👨' },
];

// Tutorial steps with content
const TUTORIAL_STEPS = [
    {
        id: 'roles',
        title: 'Distribuição dos Papéis',
        subtitle: 'Cada jogador recebe um papel secreto',
        description: 'Um jogador será escolhido aleatoriamente como o IMPOSTOR. Os outros jogadores são inocentes e conhecem a palavra secreta.',
    },
    {
        id: 'hints',
        title: 'Rodada de Dicas',
        subtitle: 'Cada um dá uma pista sobre a palavra',
        description: 'Os inocentes devem dar dicas sobre a palavra sem revelá-la. O impostor precisa fingir que sabe!',
    },
    {
        id: 'discussion',
        title: 'Discussão',
        subtitle: 'Debatam sobre quem é o impostor',
        description: 'Conversem sobre as dicas. As dicas do impostor podem não fazer sentido!',
    },
    {
        id: 'vote',
        title: 'Votação',
        subtitle: 'Votem em quem acham que é o impostor',
        description: 'Se a maioria acertar, os inocentes vencem! Se errarem, o impostor escapa!',
    },
];

export default function HowToPlayModal({ isOpen, onClose }: HowToPlayModalProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [animationPhase, setAnimationPhase] = useState(0);

    // Auto-advance animation phases within each step
    useEffect(() => {
        if (!isOpen) return;

        const timer = setInterval(() => {
            setAnimationPhase((prev) => (prev + 1) % 4);
        }, 1500);

        return () => clearInterval(timer);
    }, [isOpen, currentStep]);

    // Reset animation phase when step changes
    useEffect(() => {
        setAnimationPhase(0);
    }, [currentStep]);

    const handleNextStep = () => {
        if (currentStep < TUTORIAL_STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onClose();
        }
    };

    const handlePrevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    // Render the visual demo for each step
    const renderStepDemo = (stepId: string) => {
        switch (stepId) {
            case 'roles':
                return (
                    <div className="demo-roles">
                        <div className="demo-players-grid">
                            {DEMO_PLAYERS.map((player, index) => (
                                <motion.div
                                    key={player.name}
                                    className={`demo-player-card ${index === 2 ? 'impostor' : 'innocent'}`}
                                    initial={{ opacity: 0, y: 20, rotateY: 180 }}
                                    animate={{
                                        opacity: 1,
                                        y: 0,
                                        rotateY: animationPhase >= index ? 0 : 180,
                                    }}
                                    transition={{ delay: index * 0.15, duration: 0.5 }}
                                >
                                    <div className="card-front">
                                        <span className="player-emoji">{player.emoji}</span>
                                        <span className="player-name">{player.name}</span>
                                        <motion.div
                                            className={`role-badge ${index === 2 ? 'impostor' : 'innocent'}`}
                                            initial={{ scale: 0 }}
                                            animate={{ scale: animationPhase >= index ? 1 : 0 }}
                                            transition={{ delay: index * 0.15 + 0.3 }}
                                        >
                                            {index === 2 ? '🎭 Impostor' : '✓ Banana'}
                                        </motion.div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                        <motion.div
                            className="demo-secret-word"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: animationPhase >= 3 ? 1 : 0 }}
                        >
                            <span className="word-label">Palavra secreta:</span>
                            <span className="word-value">🍌 Banana</span>
                        </motion.div>
                    </div>
                );

            case 'hints':
                const hints = [
                    { player: DEMO_PLAYERS[0], hint: 'É amarela', isImpostor: false },
                    { player: DEMO_PLAYERS[1], hint: 'Macacos gostam', isImpostor: false },
                    { player: DEMO_PLAYERS[2], hint: 'Tem na cozinha...?', isImpostor: true },
                    { player: DEMO_PLAYERS[3], hint: 'É uma fruta', isImpostor: false },
                ];
                return (
                    <div className="demo-hints">
                        <div className="hints-list">
                            {hints.map((item, index) => (
                                <motion.div
                                    key={index}
                                    className={`hint-bubble ${item.isImpostor ? 'suspicious' : ''}`}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{
                                        opacity: animationPhase >= index ? 1 : 0,
                                        x: animationPhase >= index ? 0 : -20,
                                    }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <span className="hint-player">
                                        {item.player.emoji} {item.player.name}:
                                    </span>
                                    <span className="hint-text">"{item.hint}"</span>
                                    {item.isImpostor && animationPhase >= 3 && (
                                        <motion.span
                                            className="suspicious-badge"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                        >
                                            🤔 Vaga?
                                        </motion.span>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </div>
                );

            case 'discussion':
                return (
                    <div className="demo-discussion">
                        <motion.div
                            className="discussion-bubble"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: animationPhase >= 0 ? 1 : 0 }}
                        >
                            <span className="speaker">{DEMO_PLAYERS[0].emoji} Ana:</span>
                            <span className="message">"A dica da Carol foi estranha..."</span>
                        </motion.div>
                        <motion.div
                            className="discussion-bubble defense"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: animationPhase >= 1 ? 1 : 0 }}
                        >
                            <span className="speaker">{DEMO_PLAYERS[2].emoji} Carol:</span>
                            <span className="message">"Eu só não queria dar spoiler!"</span>
                        </motion.div>
                        <motion.div
                            className="discussion-bubble"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: animationPhase >= 2 ? 1 : 0 }}
                        >
                            <span className="speaker">{DEMO_PLAYERS[3].emoji} Diego:</span>
                            <span className="message">"Mas 'tem na cozinha' serve pra qualquer coisa..."</span>
                        </motion.div>
                        <motion.div
                            className="thinking-emoji"
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{
                                opacity: animationPhase >= 3 ? 1 : 0,
                                scale: animationPhase >= 3 ? 1 : 0,
                            }}
                        >
                            🤔💭
                        </motion.div>
                    </div>
                );

            case 'vote':
                return (
                    <div className="demo-vote">
                        <div className="vote-cards">
                            {DEMO_PLAYERS.map((player, index) => (
                                <motion.div
                                    key={player.name}
                                    className={`vote-card ${index === 2 ? 'target' : ''}`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <span className="vote-emoji">{player.emoji}</span>
                                    <span className="vote-name">{player.name}</span>
                                    {index === 2 && (
                                        <motion.div
                                            className="vote-count"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: animationPhase >= 2 ? 1 : 0 }}
                                        >
                                            3 votos
                                        </motion.div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                        <AnimatePresence>
                            {animationPhase >= 3 && (
                                <motion.div
                                    className="vote-result"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <span className="result-emoji">🎉</span>
                                    <span className="result-text">Impostor descoberto!</span>
                                    <span className="result-subtitle">Inocentes vencem!</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                );

            default:
                return null;
        }
    };

    if (!isOpen) return null;

    return (
        <motion.div
            className="how-to-play-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className="how-to-play-modal"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="modal-header">
                    <button className="close-button" onClick={onClose}>
                        ✕
                    </button>
                    <h2>🎮 Como Jogar</h2>
                    <div className="step-indicator">
                        {TUTORIAL_STEPS.map((_, index) => (
                            <button
                                key={index}
                                className={`step-dot ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
                                onClick={() => setCurrentStep(index)}
                            />
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="modal-content">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            className="step-content"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="step-header">
                                <span className="step-number">{currentStep + 1}</span>
                                <div className="step-titles">
                                    <h3>{TUTORIAL_STEPS[currentStep].title}</h3>
                                    <p className="step-subtitle">{TUTORIAL_STEPS[currentStep].subtitle}</p>
                                </div>
                            </div>

                            {/* Visual Demo Area */}
                            <div className="demo-area">
                                {renderStepDemo(TUTORIAL_STEPS[currentStep].id)}
                            </div>

                            <p className="step-description">{TUTORIAL_STEPS[currentStep].description}</p>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Navigation */}
                <div className="modal-footer">
                    <button
                        className="nav-button prev"
                        onClick={handlePrevStep}
                        disabled={currentStep === 0}
                    >
                        ← Anterior
                    </button>
                    <button className="nav-button next" onClick={handleNextStep}>
                        {currentStep === TUTORIAL_STEPS.length - 1 ? 'Entendi! 🎮' : 'Próximo →'}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
