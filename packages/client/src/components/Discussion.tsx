// ============================================
// ADVINHA - Discussion Component
// Chat phase with timer and messages
// ============================================

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameStore, useIsHost } from '../store/gameStore';
import './Discussion.css';

export default function Discussion() {
    const { room, role, sendChat, nextPhase, timerSeconds } = useGameStore();
    const isHost = useIsHost();
    const [message, setMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const chatEnabled = room?.settings.chatEnabled ?? true;
    const messages = room?.gameState?.chatMessages || [];

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim()) {
            sendChat(message.trim());
            setMessage('');
        }
    };

    const formatTime = (seconds: number | null) => {
        if (seconds === null) return '--:--';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <motion.div
            className="discussion-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Header */}
            <div className="discussion-header">
                <div className="phase-info">
                    <h2>💬 Discussão</h2>
                    {role && (
                        <span className={`role-reminder ${role.isImpostor ? 'impostor' : ''}`}>
                            {role.isImpostor ? '🎭 Você é o Impostor' : `📝 ${role.word}`}
                        </span>
                    )}
                </div>

                {room?.settings.timerEnabled && (
                    <div className={`timer ${timerSeconds !== null && timerSeconds <= 10 ? 'urgent' : ''}`}>
                        ⏱️ {formatTime(timerSeconds)}
                    </div>
                )}
            </div>

            {/* Chat Area or Estamos Juntos Mode */}
            {chatEnabled ? (
                <>
                    <div className="messages-container">
                        {messages.length === 0 ? (
                            <div className="empty-chat">
                                <p>Nenhuma mensagem ainda...</p>
                                <p className="hint">Comece a conversa para descobrir o impostor!</p>
                            </div>
                        ) : (
                            messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    className="message"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                >
                                    <span className="message-author">{msg.playerName}:</span>
                                    <span className="message-content">{msg.content}</span>
                                </motion.div>
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form className="chat-input-form" onSubmit={handleSend}>
                        <input
                            type="text"
                            className="input"
                            placeholder="Digite sua mensagem..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            maxLength={200}
                        />
                        <button type="submit" className="btn btn-primary" disabled={!message.trim()}>
                            Enviar
                        </button>
                    </form>
                </>
            ) : (
                <div className="estamos-juntos-mode">
                    <div className="mode-icon">🤝</div>
                    <h3>Modo "Estamos Juntos"</h3>
                    <p>O chat está desabilitado.</p>
                    <p>Conversem pessoalmente para descobrir o impostor!</p>
                </div>
            )}

            {/* Host Controls */}
            {isHost && (
                <div className="host-controls">
                    <button
                        className="btn btn-secondary"
                        onClick={nextPhase}
                    >
                        ⏭️ Ir para Votação
                    </button>
                </div>
            )}
        </motion.div>
    );
}
