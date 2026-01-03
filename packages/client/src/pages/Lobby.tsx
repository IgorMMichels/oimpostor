// ============================================
// ADVINHA - Lobby Page (Improved Social UX)
// Better invite experience and visual polish
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
    const whatsappMessage = `Bora jogar O IMPOSTOR! 🎭

Entra na sala: ${inviteLink}

Código: *${room.code}*`;
    const whatsappLink = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

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
    const allReady = canStart && readyCount === room.players.length;

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
                {/* INVITE SECTION - PRIORITY */}
                <motion.section
                    className="invite-section"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="invite-header">
                        <h2>🎉 Chame a galera!</h2>
                        <p>Compartilhe o link ou código com seus amigos</p>
                    </div>

                    {/* PROMINENT SOCIAL BUTTONS */}
                    <div className="invite-actions-grid">
                        <motion.a
                            href={whatsappLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="invite-btn whatsapp-btn"
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                            <span>Compartilhar no WhatsApp</span>
                        </motion.a>

                        <motion.button
                            className={`invite-btn copy-btn ${copied ? 'copied' : ''}`}
                            onClick={copyInviteLink}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {copied ? (
                                <>
                                    <span className="copy-icon">✅</span>
                                    <span>Link copiado!</span>
                                </>
                            ) : (
                                <>
                                    <span className="copy-icon">📋</span>
                                    <span>Copiar link</span>
                                </>
                            )}
                        </motion.button>
                    </div>

                    {/* CODE DISPLAY */}
                    <div className="code-display">
                        <span className="code-label">Código da sala:</span>
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

                    {/* CLEAR WAITING STATE */}
                    {!canStart && (
                        <motion.div
                            className="waiting-message"
                            animate={{ opacity: [0.7, 1, 0.7] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                        >
                            <span className="waiting-icon">⏳</span>
                            <span>Aguardando mais {playersNeeded} {playersNeeded === 1 ? 'jogador' : 'jogadores'} para começar</span>
                        </motion.div>
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
                                            🤝 Modo presencial - conversem pessoalmente!
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
                {/* All Ready Indicator */}
                {allReady && (
                    <div className="all-ready-banner">
                        ✨ Todos prontos! O host pode iniciar o jogo.
                    </div>
                )}

                {/* Ready Button - for everyone including host */}
                <button
                    className={`ready-btn ${currentPlayer?.isReady ? 'is-ready' : ''}`}
                    onClick={() => setReady(!currentPlayer?.isReady)}
                >
                    {currentPlayer?.isReady ? '✅ Pronto!' : '👍 Estou pronto'}
                </button>

                {/* Start Button - only for host */}
                {isHost && (
                    <button
                        className={`start-btn ${canStart ? 'ready' : ''} ${allReady ? 'all-ready' : ''}`}
                        onClick={handleStart}
                        disabled={!canStart}
                    >
                        {!canStart
                            ? `Mínimo 3 jogadores`
                            : allReady
                                ? '🚀 Iniciar Agora!'
                                : '🎮 Iniciar Jogo'}
                    </button>
                )}
            </motion.div>
        </div>
    );
}
