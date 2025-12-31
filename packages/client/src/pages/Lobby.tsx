// ============================================
// ADVINHA - Lobby Page (Improved UX)
// Better social features and visual polish
// ============================================

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, useIsHost, useCurrentPlayer } from '../store/gameStore';
import PlayerCard from '../components/PlayerCard';
import GridBackground from '../components/GridBackground';
import './Lobby.css';

export default function Lobby() {
    const navigate = useNavigate();
    const { room, leaveRoom, startGame, updateSettings, setReady, error } = useGameStore();
    const isHost = useIsHost();
    const currentPlayer = useCurrentPlayer();

    const [copied, setCopied] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    // Redirect if not in room
    useEffect(() => {
        if (!room) {
            navigate('/');
        }
    }, [room, navigate]);

    // Navigate to game when it starts
    useEffect(() => {
        if (room?.gameState && room.gameState.phase !== 'lobby') {
            navigate(`/jogo/${room.code}`);
        }
    }, [room?.gameState?.phase, room?.code, navigate]);

    if (!room) return null;

    const inviteLink = `${window.location.origin}/sala/${room.code}`;
    const whatsappLink = `https://wa.me/?text=${encodeURIComponent(`🎭 Vem jogar Advinha comigo!\n\nDescubra quem é o impostor:\n${inviteLink}`)}`;

    const copyInviteLink = async () => {
        try {
            await navigator.clipboard.writeText(inviteLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        } catch {
            const input = document.createElement('input');
            input.value = inviteLink;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        }
    };

    const handleLeave = () => {
        leaveRoom();
        navigate('/');
    };

    const handleStart = () => {
        if (room.players.length >= 3) {
            startGame();
        }
    };

    const toggleSetting = (key: 'chatEnabled' | 'timerEnabled') => {
        updateSettings({ [key]: !room.settings[key] });
    };

    const canStart = room.players.length >= 3;
    const playersNeeded = 3 - room.players.length;
    const readyCount = room.players.filter(p => p.isReady).length;

    return (
        <div className="lobby-page">
            <GridBackground gridSize={70} />

            {/* Header */}
            <motion.header
                className="lobby-header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <button className="back-btn" onClick={handleLeave}>
                    ← Sair
                </button>
                <div className="room-code-badge">
                    <span className="label">Sala</span>
                    <span className="code">{room.code}</span>
                </div>
            </motion.header>

            <div className="lobby-content">
                {/* Invite Section - Priority */}
                <motion.section
                    className="invite-section"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="invite-header">
                        <h2>🎉 Convide seus amigos!</h2>
                        <p>Compartilhe o link para eles entrarem</p>
                    </div>

                    <div className="invite-actions">
                        <motion.button
                            className={`copy-btn ${copied ? 'copied' : ''}`}
                            onClick={copyInviteLink}
                            whileTap={{ scale: 0.98 }}
                        >
                            {copied ? '✅ Link copiado!' : '📋 Copiar link'}
                        </motion.button>

                        <motion.a
                            href={whatsappLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="whatsapp-btn"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            💬 WhatsApp
                        </motion.a>
                    </div>

                    <div className="code-display">
                        <span className="code-label">Ou digite o código:</span>
                        <span className="code-value">{room.code}</span>
                    </div>
                </motion.section>

                {/* Players Section */}
                <motion.section
                    className="players-section"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="section-header">
                        <h3>Jogadores</h3>
                        <span className="player-count">
                            {room.players.length}/{room.settings.maxPlayers}
                            {readyCount > 0 && ` • ${readyCount} prontos`}
                        </span>
                    </div>

                    <div className="players-grid">
                        <AnimatePresence>
                            {room.players.map((player, index) => (
                                <PlayerCard
                                    key={player.id}
                                    player={player}
                                    isCurrentPlayer={player.id === currentPlayer?.id}
                                    index={index}
                                />
                            ))}
                        </AnimatePresence>

                        {/* Empty slots */}
                        {playersNeeded > 0 && Array.from({ length: playersNeeded }).map((_, i) => (
                            <motion.div
                                key={`empty-${i}`}
                                className="player-slot empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 + i * 0.1 }}
                            >
                                <div className="slot-avatar">?</div>
                                <span className="slot-text">Aguardando...</span>
                            </motion.div>
                        ))}
                    </div>

                    {!canStart && (
                        <div className="waiting-message">
                            ⏳ Aguardando mais {playersNeeded} {playersNeeded === 1 ? 'jogador' : 'jogadores'}
                        </div>
                    )}
                </motion.section>

                {/* Settings (Host only) */}
                {isHost && (
                    <motion.section
                        className="settings-section"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <button
                            className="settings-toggle"
                            onClick={() => setShowSettings(!showSettings)}
                        >
                            ⚙️ Configurações
                            <span className={`toggle-icon ${showSettings ? 'open' : ''}`}>▼</span>
                        </button>

                        <AnimatePresence>
                            {showSettings && (
                                <motion.div
                                    className="settings-panel"
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                >
                                    <label className="setting-row">
                                        <span>💬 Chat durante discussão</span>
                                        <button
                                            className={`toggle-switch ${room.settings.chatEnabled ? 'on' : ''}`}
                                            onClick={() => toggleSetting('chatEnabled')}
                                        >
                                            <span className="toggle-thumb"></span>
                                        </button>
                                    </label>

                                    <label className="setting-row">
                                        <span>⏱️ Timer de discussão</span>
                                        <button
                                            className={`toggle-switch ${room.settings.timerEnabled ? 'on' : ''}`}
                                            onClick={() => toggleSetting('timerEnabled')}
                                        >
                                            <span className="toggle-thumb"></span>
                                        </button>
                                    </label>

                                    {!room.settings.chatEnabled && (
                                        <div className="setting-note">
                                            🤝 Modo "Estamos Juntos" - conversa presencial!
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.section>
                )}

                {/* Error */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            className="error-banner"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                        >
                            ⚠️ {error}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Fixed Bottom Action */}
            <motion.div
                className="lobby-footer"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                {isHost ? (
                    <button
                        className={`start-btn ${canStart ? 'ready' : ''}`}
                        onClick={handleStart}
                        disabled={!canStart}
                    >
                        {canStart ? '🎮 Iniciar Jogo' : `Mínimo 3 jogadores`}
                    </button>
                ) : (
                    <button
                        className={`ready-btn ${currentPlayer?.isReady ? 'is-ready' : ''}`}
                        onClick={() => setReady(!currentPlayer?.isReady)}
                    >
                        {currentPlayer?.isReady ? '✅ Pronto!' : '👍 Estou pronto'}
                    </button>
                )}
            </motion.div>
        </div>
    );
}
