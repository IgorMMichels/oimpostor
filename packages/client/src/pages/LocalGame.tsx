// ============================================
// O IMPOSTOR - Local Game Page
// "Estamos Juntos" mode - Pass & Play
// ============================================

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocalGameStore } from '../store/localGameStore';
import GridBackground from '../components/GridBackground';
import './LocalGame.css';

export default function LocalGame() {
    const navigate = useNavigate();
    const {
        players,
        category,
        word,
        phase,
        votes,
        currentVoterIndex,
        voteResult,
        revealingPlayerId,
        showWord,
        loadCategories,
        addPlayer,
        removePlayer,
        startGame,
        showCategory,
        startReveal,
        revealWord,
        hideReveal,
        startDiscussion,
        startVoting,
        vote,
        nextRound,
        reset
    } = useLocalGameStore();

    const [nameInput, setNameInput] = useState('');
    const [error, setError] = useState('');

    // Load categories on mount
    useEffect(() => {
        loadCategories();
    }, [loadCategories]);

    // Handle adding player
    const handleAddPlayer = (e: React.FormEvent) => {
        e.preventDefault();
        if (!nameInput.trim()) return;

        const success = addPlayer(nameInput);
        if (success) {
            setNameInput('');
            setError('');
        } else {
            setError('Nome já existe ou limite atingido');
            setTimeout(() => setError(''), 2000);
        }
    };

    // Get current voter
    const currentVoter = players[currentVoterIndex];

    // Get currently revealing player
    const revealingPlayer = players.find(p => p.id === revealingPlayerId);

    // Check if all players revealed
    const allRevealed = players.every(p => p.hasRevealed);

    // Handle back/exit
    const handleExit = () => {
        reset();
        navigate('/');
    };

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
                </div>
            </motion.header>

            <main className="local-content">
                <AnimatePresence mode="wait">
                    {/* PHASE: SETUP - Add Players */}
                    {phase === 'setup' && (
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

                            {/* Player Input Form */}
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
                                    {players.map((player, index) => (
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
                                                onClick={() => removePlayer(player.id)}
                                                aria-label="Remover"
                                            >
                                                ×
                                            </button>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>

                            {/* Player Count */}
                            <p className="player-count">
                                {players.length}/10 jogadores
                                {players.length < 3 && (
                                    <span className="count-hint"> • Mínimo 3</span>
                                )}
                            </p>

                            {/* Start Button */}
                            <motion.button
                                className={`start-game-btn ${players.length >= 3 ? 'ready' : ''}`}
                                onClick={startGame}
                                disabled={players.length < 3}
                                whileHover={players.length >= 3 ? { scale: 1.02 } : {}}
                                whileTap={players.length >= 3 ? { scale: 0.98 } : {}}
                            >
                                {players.length >= 3 ? '🎮 Começar Jogo' : 'Adicione mais jogadores'}
                            </motion.button>
                        </motion.div>
                    )}

                    {/* PHASE: CATEGORY - Show category before reveal */}
                    {phase === 'category' && category && (
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
                                <span className="category-icon">{category.icon}</span>
                                <h2>Categoria</h2>
                                <p className="category-name">{category.name}</p>
                            </motion.div>

                            <motion.p
                                className="category-hint"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                            >
                                Todos devem ver a categoria!
                            </motion.p>

                            <motion.button
                                className="continue-btn"
                                onClick={showCategory}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                👀 Ver Papéis
                            </motion.button>
                        </motion.div>
                    )}

                    {/* PHASE: REVEAL - Each player sees their role */}
                    {phase === 'reveal' && !revealingPlayerId && (
                        <motion.div
                            key="reveal-cards"
                            className="phase-reveal"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <div className="reveal-header">
                                <h2>Toque no seu nome</h2>
                                <p>Veja sua palavra secretamente</p>
                            </div>

                            {/* Category reminder */}
                            {category && (
                                <div className="category-reminder">
                                    <span>{category.icon}</span>
                                    <span>{category.name}</span>
                                </div>
                            )}

                            {/* Player Cards Grid */}
                            <div className="reveal-grid">
                                {players.map((player, index) => (
                                    <motion.button
                                        key={player.id}
                                        className={`reveal-card ${player.hasRevealed ? 'revealed' : ''}`}
                                        onClick={() => !player.hasRevealed && startReveal(player.id)}
                                        disabled={player.hasRevealed}
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        whileHover={!player.hasRevealed ? { scale: 1.05, y: -5 } : {}}
                                        whileTap={!player.hasRevealed ? { scale: 0.95 } : {}}
                                    >
                                        <span className="card-icon">
                                            {player.hasRevealed ? '✅' : '🎭'}
                                        </span>
                                        <span className="card-name">{player.name}</span>
                                        {player.hasRevealed && (
                                            <span className="card-status">Visto</span>
                                        )}
                                    </motion.button>
                                ))}
                            </div>

                            {/* Continue when all revealed */}
                            {allRevealed && (
                                <motion.button
                                    className="continue-btn"
                                    onClick={startDiscussion}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    💬 Iniciar Discussão
                                </motion.button>
                            )}
                        </motion.div>
                    )}

                    {/* PHASE: REVEAL - Showing to specific player */}
                    {phase === 'reveal' && revealingPlayerId && revealingPlayer && (
                        <motion.div
                            key="revealing"
                            className={`phase-revealing ${revealingPlayer.isImpostor ? 'impostor' : ''}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            {/* Player name header */}
                            <motion.h2
                                className="revealing-name"
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                {revealingPlayer.name}
                            </motion.h2>

                            {/* The reveal card with flip animation */}
                            <motion.div
                                className="flip-card-container"
                                initial={{ rotateY: 180 }}
                                animate={{ rotateY: 0 }}
                                transition={{ type: 'spring', damping: 20, duration: 0.6 }}
                            >
                                <div className={`flip-card ${showWord ? 'flipped' : ''}`}>
                                    {/* Front - Category */}
                                    <div className="flip-card-front">
                                        {category && (
                                            <>
                                                <span className="reveal-icon">{category.icon}</span>
                                                <p className="reveal-label">Categoria</p>
                                                <h3 className="reveal-category">{category.name}</h3>
                                            </>
                                        )}
                                        <motion.button
                                            className="flip-btn"
                                            onClick={revealWord}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            👁️ Ver minha palavra
                                        </motion.button>
                                    </div>

                                    {/* Back - Word or Impostor */}
                                    <div className="flip-card-back">
                                        {revealingPlayer.isImpostor ? (
                                            <motion.div
                                                className="impostor-reveal"
                                                initial={{ scale: 0.8 }}
                                                animate={{ scale: [1, 1.1, 1] }}
                                                transition={{ duration: 0.5 }}
                                            >
                                                <span className="impostor-icon">🎭</span>
                                                <h3 className="impostor-title">IMPOSTOR!</h3>
                                                <p className="impostor-hint">
                                                    Você NÃO sabe a palavra.<br />
                                                    Finja que sabe!
                                                </p>
                                            </motion.div>
                                        ) : (
                                            <div className="word-reveal">
                                                <span className="word-icon">🔑</span>
                                                <p className="word-label">Sua palavra é:</p>
                                                <motion.h3
                                                    className="word-text"
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ type: 'spring' }}
                                                >
                                                    {word}
                                                </motion.h3>
                                                <p className="word-hint">
                                                    Não deixe o impostor descobrir!
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>

                            {/* Close button (only when word is showing) */}
                            {showWord && (
                                <motion.button
                                    className="close-reveal-btn"
                                    onClick={hideReveal}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    ✓ Entendi, fechar
                                </motion.button>
                            )}
                        </motion.div>
                    )}

                    {/* PHASE: DISCUSSION */}
                    {phase === 'discussion' && (
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

                            {category && (
                                <div className="category-reminder large">
                                    <span>{category.icon}</span>
                                    <span>{category.name}</span>
                                </div>
                            )}

                            <p className="discussion-hint">
                                Deem dicas sobre a palavra sem revelá-la.<br />
                                Descubram quem é o impostor!
                            </p>

                            <div className="players-reminder">
                                {players.map(p => (
                                    <span key={p.id} className="player-tag">{p.name}</span>
                                ))}
                            </div>

                            <motion.button
                                className="vote-btn"
                                onClick={startVoting}
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

                    {/* PHASE: VOTING */}
                    {phase === 'voting' && currentVoter && (
                        <motion.div
                            key={`voting-${currentVoter.id}`}
                            className="phase-voting"
                            initial={{ opacity: 0, x: 100 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -100 }}
                        >
                            <div className="voting-header">
                                <h2>Vez de votar:</h2>
                                <motion.p
                                    className="voter-name"
                                    initial={{ scale: 0.8 }}
                                    animate={{ scale: 1 }}
                                >
                                    {currentVoter.name}
                                </motion.p>
                                <p className="voting-progress">
                                    {currentVoterIndex + 1}/{players.length}
                                </p>
                            </div>

                            <p className="voting-hint">Quem você acha que é o impostor?</p>

                            <div className="voting-grid">
                                {players
                                    .filter(p => p.id !== currentVoter.id)
                                    .map((player, index) => (
                                        <motion.button
                                            key={player.id}
                                            className="vote-card"
                                            onClick={() => vote(player.id)}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            whileHover={{ scale: 1.05, y: -5 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <span className="vote-icon">🎭</span>
                                            <span className="vote-name">{player.name}</span>
                                        </motion.button>
                                    ))}
                            </div>
                        </motion.div>
                    )}

                    {/* PHASE: RESULTS */}
                    {phase === 'results' && voteResult && (
                        <motion.div
                            key="results"
                            className={`phase-results ${voteResult.impostorWin ? 'impostor-win' : 'players-win'}`}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            {/* Result Icon */}
                            <motion.div
                                className="result-icon"
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: 'spring', delay: 0.2 }}
                            >
                                {voteResult.impostorWin ? '🎭' : '🎉'}
                            </motion.div>

                            {/* Winner announcement */}
                            <motion.h2
                                className="result-title"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                {voteResult.impostorWin
                                    ? 'Impostor Venceu!'
                                    : 'Jogadores Venceram!'
                                }
                            </motion.h2>

                            {/* Details */}
                            <motion.div
                                className="result-details"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 }}
                            >
                                <p>
                                    <strong>Mais votado:</strong> {voteResult.mostVotedName}
                                    ({voteResult.voteCount} votos)
                                </p>
                                <p className="impostor-reveal-text">
                                    <strong>O impostor era:</strong>{' '}
                                    <span className="impostor-name">{voteResult.impostorName}</span>
                                </p>
                                {category && word && (
                                    <p className="word-reveal-text">
                                        <strong>A palavra era:</strong>{' '}
                                        <span className="word-name">{word}</span>
                                        <span className="category-small">({category.name})</span>
                                    </p>
                                )}
                            </motion.div>

                            {/* Action buttons */}
                            <motion.div
                                className="result-actions"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8 }}
                            >
                                <button className="play-again-btn" onClick={nextRound}>
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
