// ============================================
// ADVINHA - Home Page (Redesigned)
// Hero section with strong CTA and better UX
// ============================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import GridBackground from '../components/GridBackground';
import './Home.css';

type Mode = 'initial' | 'create' | 'join';

export default function Home() {
    const navigate = useNavigate();
    const { createRoom, joinRoom, isConnected, error, clearError, playerName } = useGameStore();

    const [mode, setMode] = useState<Mode>('initial');
    const [name, setName] = useState(playerName);
    const [roomCode, setRoomCode] = useState('');
    const [loading, setLoading] = useState(false);

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

    return (
        <div className="home-page">
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
                                ADVINHA
                            </motion.h1>

                            <motion.p
                                className="hero-tagline"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                Descubra quem está blefando<br />antes que seja tarde.
                            </motion.p>

                            <motion.div
                                className="hero-description"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                            >
                                <span className="feature-tag">🎯 3-10 jogadores</span>
                                <span className="feature-tag">⚡ Partidas rápidas</span>
                                <span className="feature-tag">🔥 100% online</span>
                            </motion.div>

                            {/* Primary CTA */}
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
                                    <span className="cta-icon">▶️</span>
                                    <span className="cta-text">Jogar Agora</span>
                                </motion.button>

                                <motion.button
                                    className="cta-secondary"
                                    onClick={() => setMode('join')}
                                    disabled={!isConnected}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    Tenho um código
                                </motion.button>
                            </motion.div>

                            {/* How it works */}
                            <motion.div
                                className="how-it-works"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.7 }}
                            >
                                <h3>Como funciona?</h3>
                                <div className="steps">
                                    <div className="step">
                                        <span className="step-number">1</span>
                                        <span className="step-text">Todos recebem uma palavra secreta</span>
                                    </div>
                                    <div className="step">
                                        <span className="step-number">2</span>
                                        <span className="step-text">Exceto o impostor, que não sabe nada</span>
                                    </div>
                                    <div className="step">
                                        <span className="step-number">3</span>
                                        <span className="step-text">Descubra quem está blefando!</span>
                                    </div>
                                </div>
                            </motion.div>
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
                                <span className="form-icon">✨</span>
                                <h2>Criar Sala</h2>
                                <p>Convide seus amigos para jogar</p>
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
                                    <>🎮 Criar e Jogar</>
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
                                <span className="form-icon">🚀</span>
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
        </div>
    );
}
