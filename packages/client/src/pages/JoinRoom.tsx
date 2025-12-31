// ============================================
// ADVINHA - Join Page
// Handle direct room links - /sala/:code
// ============================================

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import GridBackground from '../components/GridBackground';
import './Home.css';

export default function JoinRoom() {
    const { code } = useParams<{ code: string }>();
    const navigate = useNavigate();
    const { joinRoom, isConnected, error, clearError, playerName } = useGameStore();

    const [name, setName] = useState(playerName);
    const [loading, setLoading] = useState(false);

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !code || loading) return;

        setLoading(true);
        await joinRoom(code, name.trim());
        setLoading(false);
    };

    return (
        <div className="home-page">
            <GridBackground gridSize={60} />

            {/* Connection indicator */}
            <div className={`connection-pill ${isConnected ? 'connected' : ''}`}>
                <span className="pulse-dot"></span>
                {isConnected ? 'Online' : 'Conectando...'}
            </div>

            <div className="home-content">
                <motion.div
                    className="form-card"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <button
                        type="button"
                        className="back-button"
                        onClick={() => navigate('/')}
                    >
                        ← Voltar
                    </button>

                    <div className="form-header">
                        <span className="form-icon">🎭</span>
                        <h2>Entrar na Sala</h2>
                        <p>Você foi convidado para jogar!</p>
                    </div>

                    <div className="code-display" style={{ marginBottom: 'var(--space-lg)' }}>
                        <span className="code-label">Sala:</span>
                        <span className="code-value">{code?.toUpperCase()}</span>
                    </div>

                    <form onSubmit={handleJoin}>
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
                                autoFocus
                                required
                            />
                        </div>

                        {error && (
                            <motion.div
                                className="error-box"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                onClick={clearError}
                            >
                                ⚠️ {error}
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            className="submit-button"
                            disabled={!name.trim() || loading || !isConnected}
                            style={{ marginTop: 'var(--space-lg)' }}
                        >
                            {loading ? (
                                <span className="loading-spinner">⏳</span>
                            ) : (
                                <>🚀 Entrar e Jogar</>
                            )}
                        </button>
                    </form>
                </motion.div>
            </div>

            <footer className="home-footer">
                <p>Advinha • Jogo de dedução social</p>
            </footer>
        </div>
    );
}
