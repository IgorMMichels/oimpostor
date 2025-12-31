// ============================================
// ADVINHA - PlayerCard Component (Improved)
// Better visual design and animations
// ============================================

import { motion } from 'framer-motion';
import type { Player } from '../types';
import './PlayerCard.css';

interface PlayerCardProps {
    player: Player;
    isCurrentPlayer?: boolean;
    index?: number;
}

export default function PlayerCard({
    player,
    isCurrentPlayer = false,
    index = 0
}: PlayerCardProps) {
    const getAvatarColor = (name: string) => {
        const colors = [
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        ];
        const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[hash % colors.length];
    };

    return (
        <motion.div
            className={`player-card-v2 ${isCurrentPlayer ? 'current' : ''} ${!player.isConnected ? 'disconnected' : ''}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ delay: index * 0.05 }}
            layout
        >
            {/* Avatar */}
            <div
                className="pc-avatar"
                style={{ background: getAvatarColor(player.name) }}
            >
                <span className="pc-avatar-letter">
                    {player.name.charAt(0).toUpperCase()}
                </span>
                {player.isHost && (
                    <span className="pc-crown">👑</span>
                )}
            </div>

            {/* Info */}
            <div className="pc-info">
                <span className="pc-name">
                    {player.name}
                    {isCurrentPlayer && <span className="pc-you">(você)</span>}
                </span>
            </div>

            {/* Status */}
            <div className="pc-status">
                {!player.isConnected ? (
                    <span className="status-badge offline">Offline</span>
                ) : player.isReady ? (
                    <span className="status-badge ready">✓ Pronto</span>
                ) : (
                    <span className="status-badge waiting">Aguardando</span>
                )}
            </div>
        </motion.div>
    );
}
