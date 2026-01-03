// ============================================
// ADVINHA - Home Page (Redesigned with WOW)
// Dramatic entrance, aggressive copy, social CTAs
// ============================================

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import GridBackground from '../components/GridBackground';
import IntroAnimation from '../components/IntroAnimation';
import HowToPlayModal from '../components/HowToPlayModal';
import './Home.css';

type Mode = 'initial' | 'create' | 'join';

export default function Home() {
    const navigate = useNavigate();
    const { createRoom, joinRoom, isConnected, error, clearError, playerName } = useGameStore();

    const [showIntro, setShowIntro] = useState(() => {
        // Only show intro once per session
        const hasSeenIntro = sessionStorage.getItem('advinha_intro_seen');
        return !hasSeenIntro;
    });
    const [mode, setMode] = useState<Mode>('initial');
    const [name, setName] = useState(playerName);
    const [roomCode, setRoomCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [showHowToPlay, setShowHowToPlay] = useState(false);

    const handleIntroComplete = useCallback(() => {
        sessionStorage.setItem('advinha_intro_seen', 'true');
        setShowIntro(false);
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || loading) return;

        setLoading(true);
        const success = await createRoom(name.trim());
        setLoading(false);

        if (success) {
            const { room } = useGameStore.getState();
            if (room) {
                navigate(`/sala/${room.code}`);
            }
        }
    };

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !roomCode.trim() || loading) return;

        setLoading(true);
        const success = await joinRoom(roomCode.trim(), name.trim());
        setLoading(false);

        if (success) {
            navigate(`/sala/${roomCode.toUpperCase()}`);
        }
    };

    // Skip intro on click
    const skipIntro = () => {
        sessionStorage.setItem('advinha_intro_seen', 'true');
        setShowIntro(false);
    };

    return (
        <div className="home-page">
            {/* Intro Animation (WOW Moment) */}
            {showIntro && (
                <div onClick={skipIntro} style={{ cursor: 'pointer' }}>
                    <IntroAnimation onComplete={handleIntroComplete} />
                </div>
            )}

            {/* Animated Grid Background */}
            <GridBackground gridSize={60} />

            {/* Connection indicator */}
            <div className={`connection-pill ${isConnected ? 'connected' : ''}`}>
                <span className="pulse-dot"></span>
                {isConnected ? 'Online' : 'Conectando...'}
            </div>

            <div className="home-content">
                <AnimatePresence mode="wait">
                    {mode === 'initial' && (
                        <motion.div
                            key="hero"
                            className="hero-section"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4 }}
                        >
                            {/* Hero */}
                            <motion.div
                                className="hero-badge"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.1, type: 'spring' }}
                            >
                                🎭
                            </motion.div>

                            <motion.h1
                                className="hero-title"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                O IMPOSTOR
                            </motion.h1>

                            {/* AGGRESSIVE COPY */}
                            <motion.p
                                className="hero-tagline"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                <span className="tagline-main">Não confie em ninguém.</span>
                                <br />
                                <span className="tagline-accent">Um de vocês está mentindo.</span>
                            </motion.p>

                            <motion.div
                                className="hero-description"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                            >
                                <span className="feature-tag">🎭 3-10 jogadores</span>
                                <span className="feature-tag">⚡ 5 min por partida</span>
                                <span className="feature-tag">🔥 Descubra o impostor</span>
                            </motion.div>

                            {/* Primary CTA - STRATEGIC */}
                            <motion.div
                                className="hero-cta"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                <motion.button
                                    className="cta-primary"
                                    onClick={() => setMode('create')}
                                    disabled={!isConnected}
                                    whileHover={{ scale: 1.03, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <span className="cta-icon">🎭</span>
                                    <span className="cta-text">Criar Sala Online</span>
                                </motion.button>

                                <motion.button
                                    className="cta-local"
                                    onClick={() => navigate('/local')}
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <span className="cta-icon">🤝</span>
                                    <span>Estamos Juntos</span>
                                    <span className="cta-badge">Local</span>
                                </motion.button>

                                <motion.button
                                    className="cta-secondary"
                                    onClick={() => setMode('join')}
                                    disabled={!isConnected}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    🔑 Entrar com Código
                                </motion.button>
                            </motion.div>

                            {/* SOCIAL SECTION */}
                            <motion.div
                                className="social-section"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 }}
                            >
                                <p className="social-label">📱 Jogue com amigos</p>
                                <div className="social-buttons">
                                    <a
                                        href="https://wa.me/?text=🎭 Vem jogar O Impostor comigo! Descubra quem está mentindo: https://oimpostor.app"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="social-btn whatsapp"
                                    >
                                        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                        </svg>
                                        WhatsApp
                                    </a>
                                    <a
                                        href="https://discord.com"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="social-btn discord"
                                    >
                                        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                                            <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
                                        </svg>
                                        Discord
                                    </a>
                                </div>
                            </motion.div>

                            {/* How to Play Button */}
                            <motion.button
                                className="how-to-play-button"
                                onClick={() => setShowHowToPlay(true)}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.7 }}
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <span className="htp-icon">❓</span>
                                <span className="htp-text">Como Jogar</span>
                                <span className="htp-hint">Tutorial interativo</span>
                            </motion.button>
                        </motion.div>
                    )}

                    {mode === 'create' && (
                        <motion.form
                            key="create"
                            className="form-card"
                            onSubmit={handleCreate}
                            initial={{ opacity: 0, x: 100 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -100 }}
                            transition={{ type: 'spring', damping: 25 }}
                        >
                            <button
                                type="button"
                                className="back-button"
                                onClick={() => setMode('initial')}
                            >
                                ← Voltar
                            </button>

                            <div className="form-header">
                                <span className="form-icon">🎭</span>
                                <h2>Criar Sala</h2>
                                <p>Convide seus amigos para descobrir o impostor</p>
                            </div>

                            <div className="form-field">
                                <label htmlFor="name">Seu apelido</label>
                                <input
                                    id="name"
                                    type="text"
                                    className="input-large"
                                    placeholder="Como quer ser chamado?"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    maxLength={15}
                                    autoFocus
                                    required
                                />
                            </div>

                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        className="error-box"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        onClick={clearError}
                                    >
                                        ⚠️ {error}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <button
                                type="submit"
                                className="submit-button"
                                disabled={!name.trim() || loading || !isConnected}
                            >
                                {loading ? (
                                    <span className="loading-spinner">⏳</span>
                                ) : (
                                    <>🎮 Criar e Convidar</>
                                )}
                            </button>
                        </motion.form>
                    )}

                    {mode === 'join' && (
                        <motion.form
                            key="join"
                            className="form-card"
                            onSubmit={handleJoin}
                            initial={{ opacity: 0, x: 100 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -100 }}
                            transition={{ type: 'spring', damping: 25 }}
                        >
                            <button
                                type="button"
                                className="back-button"
                                onClick={() => setMode('initial')}
                            >
                                ← Voltar
                            </button>

                            <div className="form-header">
                                <span className="form-icon">🔑</span>
                                <h2>Entrar na Sala</h2>
                                <p>Digite o código que recebeu</p>
                            </div>

                            <div className="form-field">
                                <label htmlFor="join-name">Seu apelido</label>
                                <input
                                    id="join-name"
                                    type="text"
                                    className="input-large"
                                    placeholder="Como quer ser chamado?"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    maxLength={15}
                                    required
                                />
                            </div>

                            <div className="form-field">
                                <label htmlFor="code">Código da sala</label>
                                <input
                                    id="code"
                                    type="text"
                                    className="input-code"
                                    placeholder="ABC123"
                                    value={roomCode}
                                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                                    maxLength={6}
                                    autoComplete="off"
                                    required
                                />
                            </div>

                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        className="error-box"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        onClick={clearError}
                                    >
                                        ⚠️ {error}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <button
                                type="submit"
                                className="submit-button"
                                disabled={!name.trim() || !roomCode.trim() || loading || !isConnected}
                            >
                                {loading ? (
                                    <span className="loading-spinner">⏳</span>
                                ) : (
                                    <>🚀 Entrar</>
                                )}
                            </button>
                        </motion.form>
                    )}
                </AnimatePresence>
            </div>

            {/* Footer */}
            <footer className="home-footer">
                <p>Jogo de dedução social • Grátis para jogar</p>
            </footer>

            {/* How to Play Modal */}
            <AnimatePresence>
                {showHowToPlay && (
                    <HowToPlayModal
                        isOpen={showHowToPlay}
                        onClose={() => setShowHowToPlay(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
