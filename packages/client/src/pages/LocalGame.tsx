// ============================================
// O IMPOSTOR - Local Game Page (Refactored)
// "Estamos Juntos" mode - Pass & Play with Socket
// ============================================

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import GridBackground from '../components/GridBackground';
import type { LocalGameState, LocalRoleInfo, LocalSettings, LocalSessionResponse } from '@advinha/shared/types';
import './LocalGame.css';

export default function LocalGame() {
    const navigate = useNavigate();
    const { socket, isConnected } = useGameStore();

    // Session state
    const [session, setSession] = useState<LocalGameState | null>(null);
    const [roleInfo, setRoleInfo] = useState<LocalRoleInfo | null>(null);
    const [voterTargets, setVoterTargets] = useState<{ id: string; name: string }[]>([]);

    // UI state
    const [nameInput, setNameInput] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    // Create session on mount
    useEffect(() => {
        if (!socket || !isConnected) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (socket as any).emit('local:create-session', (response: LocalSessionResponse) => {
            if (response.success && response.session) {
                setSession(response.session);
            } else {
                setError(response.error || 'Erro ao criar sessão');
            }
        });
    }, [socket, isConnected]);

    // Handle adding player
    const handleAddPlayer = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (!socket || !session || !nameInput.trim()) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (socket as any).emit('local:add-player', session.sessionId, nameInput.trim(), (response: LocalSessionResponse) => {
            if (response.success && response.session) {
                setSession(response.session);
                setNameInput('');
                setError('');
            } else {
                setError(response.error || 'Erro ao adicionar');
                setTimeout(() => setError(''), 2000);
            }
        });
    }, [socket, session, nameInput]);

    // Remove player
    const handleRemovePlayer = useCallback((playerId: string) => {
        if (!socket || !session) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (socket as any).emit('local:remove-player', session.sessionId, playerId, (response: LocalSessionResponse) => {
            if (response.success && response.session) {
                setSession(response.session);
            }
        });
    }, [socket, session]);

    // Shuffle players
    const handleShuffle = useCallback(() => {
        if (!socket || !session) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (socket as any).emit('local:shuffle-players', session.sessionId, (response: LocalSessionResponse) => {
            if (response.success && response.session) {
                setSession(response.session);
            }
        });
    }, [socket, session]);

    // Update settings
    const handleUpdateSettings = useCallback((settings: Partial<LocalSettings>) => {
        if (!socket || !session) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (socket as any).emit('local:update-settings', session.sessionId, settings, (response: LocalSessionResponse) => {
            if (response.success && response.session) {
                setSession(response.session);
            }
        });
    }, [socket, session]);

    // Start game
    const handleStartGame = useCallback(() => {
        if (!socket || !session) return;
        setIsLoading(true);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (socket as any).emit('local:start-game', session.sessionId, (response: LocalSessionResponse) => {
            setIsLoading(false);
            if (response.success && response.session) {
                setSession(response.session);
            } else {
                setError(response.error || 'Erro ao iniciar');
            }
        });
    }, [socket, session]);

    // Start reveal phase
    const handleStartReveal = useCallback(() => {
        if (!socket || !session) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (socket as any).emit('local:start-reveal', session.sessionId, (response: LocalSessionResponse) => {
            if (response.success && response.session) {
                setSession(response.session);
            }
        });
    }, [socket, session]);

    // Player ready to see role
    const handlePlayerReady = useCallback(() => {
        if (!socket || !session) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (socket as any).emit('local:player-ready', session.sessionId, (response: LocalSessionResponse) => {
            if (response.success && response.session) {
                setSession(response.session);
                if (response.roleInfo) {
                    setRoleInfo(response.roleInfo);
                }
            }
        });
    }, [socket, session]);

    // Confirm reveal
    const handleConfirmReveal = useCallback(() => {
        if (!socket || !session) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (socket as any).emit('local:confirm-reveal', session.sessionId, (response: LocalSessionResponse) => {
            if (response.success && response.session) {
                setSession(response.session);
                setRoleInfo(null);
            }
        });
    }, [socket, session]);

    // Start voting
    const handleStartVoting = useCallback(() => {
        if (!socket || !session) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (socket as any).emit('local:start-voting', session.sessionId, (response: LocalSessionResponse) => {
            if (response.success && response.session) {
                setSession(response.session);
            }
        });
    }, [socket, session]);

    // Voter ready
    const handleVoterReady = useCallback(() => {
        if (!socket || !session) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (socket as any).emit('local:voter-ready', session.sessionId, (response: LocalSessionResponse) => {
            if (response.success && response.session) {
                setSession(response.session);
                if (response.targets) {
                    setVoterTargets(response.targets);
                }
            }
        });
    }, [socket, session]);

    // Submit vote
    const handleVote = useCallback((targetId: string) => {
        if (!socket || !session) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (socket as any).emit('local:submit-vote', session.sessionId, targetId, (response: LocalSessionResponse) => {
            if (response.success && response.session) {
                setSession(response.session);
                setVoterTargets([]);
            }
        });
    }, [socket, session]);

    // Continue game (next round)
    const handleContinue = useCallback(() => {
        if (!socket || !session) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (socket as any).emit('local:continue-game', session.sessionId, (response: LocalSessionResponse) => {
            if (response.success && response.session) {
                setSession(response.session);
            }
        });
    }, [socket, session]);

    // Play again
    const handlePlayAgain = useCallback(() => {
        if (!socket || !session) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (socket as any).emit('local:play-again', session.sessionId, (response: LocalSessionResponse) => {
            if (response.success && response.session) {
                setSession(response.session);
            }
        });
    }, [socket, session]);

    // Exit
    const handleExit = () => {
        navigate('/');
    };

    // Helper: get current player name
    const getCurrentPlayerName = () => {
        if (!session) return '';
        const player = session.players[session.currentPlayerIndex];
        return player?.name || '';
    };

    // Helper: get current voter name
    const getCurrentVoterName = () => {
        if (!session) return '';
        const player = session.players[session.currentVoterIndex];
        return player?.name || '';
    };

    // Helper: get eliminated player
    const getEliminatedPlayer = () => {
        if (!session || !session.eliminatedThisRound) return null;
        return session.players.find(p => p.id === session.eliminatedThisRound);
    };

    // Helper: get alive players count
    const getAlivePlayers = () => {
        if (!session) return { impostors: 0, innocents: 0 };
        const alive = session.players.filter(p => !p.isEliminated);
        return {
            impostors: alive.filter(p => p.isImpostor).length,
            innocents: alive.filter(p => !p.isImpostor).length,
        };
    };

    // Loading state
    if (!isConnected || !session) {
        return (
            <div className="local-game-page">
                <GridBackground gridSize={60} />
                <div className="local-content">
                    <motion.div
                        className="loading-state"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <span className="loader-icon">🎭</span>
                        <p>Conectando...</p>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="local-game-page">
            <GridBackground gridSize={60} />

            {/* Header */}
            <motion.header
                className="local-header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <button className="exit-btn" onClick={handleExit}>
                    ← Sair
                </button>
                <div className="mode-badge">
                    🤝 Estamos Juntos
                    <span className="session-id">#{session.sessionId}</span>
                </div>
            </motion.header>

            <main className="local-content">
                <AnimatePresence mode="wait">
                    {/* PHASE: SETUP */}
                    {session.phase === 'setup' && (
                        <motion.div
                            key="setup"
                            className="phase-setup"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <div className="setup-header">
                                <motion.span
                                    className="setup-icon"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', delay: 0.1 }}
                                >
                                    👥
                                </motion.span>
                                <h1>Quem vai jogar?</h1>
                                <p>Adicione os nomes de todos os jogadores</p>
                            </div>

                            {/* Player Input */}
                            <form onSubmit={handleAddPlayer} className="player-form">
                                <input
                                    type="text"
                                    value={nameInput}
                                    onChange={(e) => setNameInput(e.target.value)}
                                    placeholder="Nome do jogador..."
                                    maxLength={15}
                                    autoFocus
                                    className="player-input"
                                />
                                <motion.button
                                    type="submit"
                                    className="add-btn"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    disabled={!nameInput.trim()}
                                >
                                    + Adicionar
                                </motion.button>
                            </form>

                            {/* Error */}
                            <AnimatePresence>
                                {error && (
                                    <motion.p
                                        className="error-text"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                    >
                                        ⚠️ {error}
                                    </motion.p>
                                )}
                            </AnimatePresence>

                            {/* Players List */}
                            <div className="players-list">
                                <AnimatePresence>
                                    {session.players.map((player, index) => (
                                        <motion.div
                                            key={player.id}
                                            className="player-chip"
                                            initial={{ opacity: 0, x: -20, scale: 0.8 }}
                                            animate={{ opacity: 1, x: 0, scale: 1 }}
                                            exit={{ opacity: 0, x: 20, scale: 0.8 }}
                                            transition={{ delay: index * 0.05 }}
                                            layout
                                        >
                                            <span className="player-number">{index + 1}</span>
                                            <span className="player-name">{player.name}</span>
                                            <button
                                                className="remove-btn"
                                                onClick={() => handleRemovePlayer(player.id)}
                                                aria-label="Remover"
                                            >
                                                ×
                                            </button>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>

                            {/* Actions */}
                            <div className="setup-actions">
                                <p className="player-count">
                                    {session.players.length}/10 jogadores
                                    {session.players.length < 3 && (
                                        <span className="count-hint"> • Mínimo 3</span>
                                    )}
                                </p>

                                {session.players.length >= 2 && (
                                    <button className="shuffle-btn" onClick={handleShuffle}>
                                        🔀 Embaralhar
                                    </button>
                                )}
                            </div>

                            {/* Settings Toggle */}
                            <button
                                className="settings-toggle"
                                onClick={() => setShowSettings(!showSettings)}
                            >
                                ⚙️ Configurações {showSettings ? '▲' : '▼'}
                            </button>

                            {/* Settings Panel */}
                            <AnimatePresence>
                                {showSettings && (
                                    <motion.div
                                        className="settings-panel"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                    >
                                        <div className="setting-row">
                                            <label>Impostores:</label>
                                            <select
                                                value={session.settings.impostorCount}
                                                onChange={(e) => handleUpdateSettings({
                                                    impostorCount: parseInt(e.target.value)
                                                })}
                                            >
                                                <option value={1}>1</option>
                                                <option value={2}>2</option>
                                                <option value={3}>3</option>
                                            </select>
                                        </div>
                                        <div className="setting-row">
                                            <label>Tempo de discussão:</label>
                                            <select
                                                value={session.settings.discussionTime}
                                                onChange={(e) => handleUpdateSettings({
                                                    discussionTime: parseInt(e.target.value)
                                                })}
                                            >
                                                <option value={0}>Desativado</option>
                                                <option value={60}>1 minuto</option>
                                                <option value={120}>2 minutos</option>
                                                <option value={180}>3 minutos</option>
                                                <option value={300}>5 minutos</option>
                                            </select>
                                        </div>
                                        <div className="setting-row">
                                            <label>Esconder categoria do impostor:</label>
                                            <input
                                                type="checkbox"
                                                checked={session.settings.hideCategory}
                                                onChange={(e) => handleUpdateSettings({
                                                    hideCategory: e.target.checked
                                                })}
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Start Button */}
                            <motion.button
                                className={`start-game-btn ${session.players.length >= 3 ? 'ready' : ''}`}
                                onClick={handleStartGame}
                                disabled={session.players.length < 3 || isLoading}
                                whileHover={session.players.length >= 3 ? { scale: 1.02 } : {}}
                                whileTap={session.players.length >= 3 ? { scale: 0.98 } : {}}
                            >
                                {isLoading ? '⏳ Iniciando...' :
                                    session.players.length >= 3 ? '🎮 Começar Jogo' : 'Adicione mais jogadores'}
                            </motion.button>
                        </motion.div>
                    )}

                    {/* PHASE: CATEGORY */}
                    {session.phase === 'category' && session.category && (
                        <motion.div
                            key="category"
                            className="phase-category"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.1 }}
                        >
                            <motion.div
                                className="category-reveal"
                                initial={{ rotateY: 90 }}
                                animate={{ rotateY: 0 }}
                                transition={{ type: 'spring', damping: 15 }}
                            >
                                <span className="category-icon">{session.category.icon}</span>
                                <h2>Categoria</h2>
                                <p className="category-name">{session.category.name}</p>
                            </motion.div>

                            <motion.p
                                className="category-hint"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                            >
                                Todos viram a categoria!<br />
                                Agora cada um verá seu papel em segredo.
                            </motion.p>

                            <motion.button
                                className="continue-btn"
                                onClick={handleStartReveal}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                👀 Começar Revelação
                            </motion.button>
                        </motion.div>
                    )}

                    {/* PHASE: PASS_DEVICE - Protection screen */}
                    {session.phase === 'pass_device' && (
                        <motion.div
                            key="pass-device"
                            className="phase-protection"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <motion.div className="protection-alert">
                                <motion.span
                                    className="alert-icon"
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                >
                                    🙈
                                </motion.span>
                                <h2 className="dont-look">NÃO OLHE!</h2>
                            </motion.div>

                            <div className="pass-instruction">
                                <p>Passe o dispositivo para:</p>
                                <motion.h1
                                    className="player-name-large"
                                    initial={{ scale: 0.8 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring' }}
                                >
                                    {getCurrentPlayerName()}
                                </motion.h1>
                            </div>

                            <motion.button
                                className="ready-btn"
                                onClick={handlePlayerReady}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                ✋ Estou Pronto
                            </motion.button>
                        </motion.div>
                    )}

                    {/* PHASE: LOCAL_REVEAL - Show role */}
                    {session.phase === 'local_reveal' && roleInfo && (
                        <motion.div
                            key="local-reveal"
                            className={`phase-revealing ${roleInfo.isImpostor ? 'impostor' : ''}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <h2 className="revealing-name">{roleInfo.playerName}</h2>

                            {roleInfo.category && (
                                <div className="category-reminder">
                                    <span>{roleInfo.category.icon}</span>
                                    <span>{roleInfo.category.name}</span>
                                </div>
                            )}

                            <motion.div
                                className={`role-card ${roleInfo.isImpostor ? 'impostor' : 'innocent'}`}
                                initial={{ scale: 0, rotateY: 180 }}
                                animate={{ scale: 1, rotateY: 0 }}
                                transition={{ type: 'spring', delay: 0.3 }}
                            >
                                {roleInfo.isImpostor ? (
                                    <div className="impostor-reveal">
                                        <motion.span
                                            className="impostor-icon"
                                            animate={{ rotate: [0, -10, 10, 0] }}
                                            transition={{ repeat: 2, duration: 0.3 }}
                                        >
                                            🎭
                                        </motion.span>
                                        <h3 className="impostor-title">IMPOSTOR!</h3>
                                        <p className="impostor-hint">
                                            Você NÃO sabe a palavra.<br />
                                            Finja que sabe!
                                        </p>
                                    </div>
                                ) : (
                                    <div className="word-reveal">
                                        <span className="word-icon">🔑</span>
                                        <p className="word-label">Sua palavra é:</p>
                                        <motion.h3
                                            className="word-text"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: 'spring', delay: 0.5 }}
                                        >
                                            {roleInfo.word}
                                        </motion.h3>
                                        <p className="word-hint">Não deixe o impostor descobrir!</p>
                                    </div>
                                )}
                            </motion.div>

                            <motion.button
                                className="close-reveal-btn"
                                onClick={handleConfirmReveal}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                ✓ Entendi, passar adiante
                            </motion.button>
                        </motion.div>
                    )}

                    {/* PHASE: DISCUSSION */}
                    {session.phase === 'discussion' && (
                        <motion.div
                            key="discussion"
                            className="phase-discussion"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <motion.span
                                className="discussion-icon"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring' }}
                            >
                                💬
                            </motion.span>

                            <h2>Hora de Discutir!</h2>

                            {session.category && (
                                <div className="category-reminder large">
                                    <span>{session.category.icon}</span>
                                    <span>{session.category.name}</span>
                                </div>
                            )}

                            <p className="discussion-hint">
                                Deem dicas sobre a palavra sem revelá-la.<br />
                                Descubram quem é o impostor!
                            </p>

                            <div className="players-reminder">
                                {session.players
                                    .filter(p => !p.isEliminated)
                                    .map(p => (
                                        <span key={p.id} className="player-tag">{p.name}</span>
                                    ))
                                }
                            </div>

                            <div className="round-info">
                                Rodada {session.roundNumber}
                            </div>

                            <motion.button
                                className="vote-btn"
                                onClick={handleStartVoting}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                🗳️ Hora de Votar
                            </motion.button>
                        </motion.div>
                    )}

                    {/* PHASE: PASS_VOTE */}
                    {session.phase === 'pass_vote' && (
                        <motion.div
                            key="pass-vote"
                            className="phase-protection voting"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <motion.div className="protection-alert">
                                <motion.span
                                    className="alert-icon"
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                >
                                    🗳️
                                </motion.span>
                                <h2 className="dont-look">VOTO SECRETO!</h2>
                            </motion.div>

                            <div className="pass-instruction">
                                <p>Passe o dispositivo para:</p>
                                <motion.h1
                                    className="player-name-large"
                                    initial={{ scale: 0.8 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring' }}
                                >
                                    {getCurrentVoterName()}
                                </motion.h1>
                            </div>

                            <motion.button
                                className="ready-btn"
                                onClick={handleVoterReady}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                ✋ Estou Pronto para Votar
                            </motion.button>
                        </motion.div>
                    )}

                    {/* PHASE: LOCAL_VOTE */}
                    {session.phase === 'local_vote' && voterTargets.length > 0 && (
                        <motion.div
                            key="local-vote"
                            className="phase-voting"
                            initial={{ opacity: 0, x: 100 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -100 }}
                        >
                            <div className="voting-header">
                                <h2>Quem é o impostor?</h2>
                                <p className="voting-hint">
                                    Toque para votar. Seu voto é secreto.
                                </p>
                            </div>

                            <div className="voting-grid">
                                {voterTargets.map((target, index) => (
                                    <motion.button
                                        key={target.id}
                                        className="vote-card"
                                        onClick={() => handleVote(target.id)}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        whileHover={{ scale: 1.05, y: -5 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <span className="vote-icon">🎭</span>
                                        <span className="vote-name">{target.name}</span>
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* PHASE: ROUND_RESULT */}
                    {session.phase === 'round_result' && (
                        <motion.div
                            key="round-result"
                            className="phase-round-result"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <motion.span
                                className="result-icon"
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: 'spring' }}
                            >
                                ⚖️
                            </motion.span>

                            <h2>Resultado da Votação</h2>

                            {getEliminatedPlayer() && (
                                <motion.div
                                    className={`eliminated-player ${getEliminatedPlayer()?.isImpostor ? 'was-impostor' : ''}`}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <span className="eliminated-name">
                                        {getEliminatedPlayer()?.name}
                                    </span>
                                    <span className="eliminated-role">
                                        foi eliminado e era{' '}
                                        {getEliminatedPlayer()?.isImpostor ? (
                                            <strong className="was-imp">IMPOSTOR! 🎭</strong>
                                        ) : (
                                            <strong className="was-innocent">inocente 😇</strong>
                                        )}
                                    </span>
                                </motion.div>
                            )}

                            <div className="alive-count">
                                Restam: {getAlivePlayers().innocents} inocentes, {getAlivePlayers().impostors} impostor(es)
                            </div>

                            <motion.button
                                className="continue-btn"
                                onClick={handleContinue}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                ▶️ Continuar
                            </motion.button>
                        </motion.div>
                    )}

                    {/* PHASE: GAME_RESULT */}
                    {session.phase === 'game_result' && (
                        <motion.div
                            key="game-result"
                            className={`phase-results ${session.winner === 'impostors' ? 'impostor-win' : 'players-win'}`}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <motion.div
                                className="result-icon"
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: 'spring', delay: 0.2 }}
                            >
                                {session.winner === 'impostors' ? '🎭' : '🎉'}
                            </motion.div>

                            <motion.h2
                                className="result-title"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                {session.winner === 'impostors'
                                    ? 'Impostor(es) Venceu!'
                                    : 'Jogadores Venceram!'
                                }
                            </motion.h2>

                            <motion.div
                                className="result-details"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 }}
                            >
                                <p>
                                    <strong>Impostor(es):</strong>{' '}
                                    {session.players
                                        .filter(p => p.isImpostor)
                                        .map(p => p.name)
                                        .join(', ')}
                                </p>
                                {session.category && session.word && (
                                    <p>
                                        <strong>A palavra era:</strong>{' '}
                                        <span className="word-name">{session.word}</span>
                                        <span className="category-small">({session.category.name})</span>
                                    </p>
                                )}
                            </motion.div>

                            <motion.div
                                className="result-actions"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8 }}
                            >
                                <button className="play-again-btn" onClick={handlePlayAgain}>
                                    🔄 Jogar Novamente
                                </button>
                                <button className="exit-result-btn" onClick={handleExit}>
                                    🏠 Sair
                                </button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
