// ============================================
// ADVINHA - Category Spinner Component
// Animated category selection
// ============================================

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import './Spinner.css';

// Sample categories for animation
const CATEGORIES = [
    { icon: '🐾', name: 'Animais' },
    { icon: '🍕', name: 'Comidas' },
    { icon: '👔', name: 'Profissões' },
    { icon: '🌍', name: 'Lugares' },
    { icon: '⚽', name: 'Esportes' },
    { icon: '🎬', name: 'Filmes' },
    { icon: '🎵', name: 'Música' },
    { icon: '📦', name: 'Objetos' },
    { icon: '👕', name: 'Roupas' },
    { icon: '🚗', name: 'Veículos' },
    { icon: '🌿', name: 'Natureza' },
    { icon: '💻', name: 'Tecnologia' },
];

export default function CategorySpinner() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [speed, setSpeed] = useState(80);

    useEffect(() => {
        // Slow down over time
        const interval = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % CATEGORIES.length);
        }, speed);

        // Gradually slow down
        const slowDown = setInterval(() => {
            setSpeed(prev => Math.min(prev + 15, 400));
        }, 300);

        return () => {
            clearInterval(interval);
            clearInterval(slowDown);
        };
    }, [speed]);

    const current = CATEGORIES[currentIndex];
    const prev = CATEGORIES[(currentIndex - 1 + CATEGORIES.length) % CATEGORIES.length];
    const next = CATEGORIES[(currentIndex + 1) % CATEGORIES.length];

    return (
        <motion.div
            className="phase-container spinner-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <h2 className="spinner-title">Sorteando categoria...</h2>

            <div className="spinner-track">
                <div className="spinner-item faded">{prev.icon} {prev.name}</div>
                <motion.div
                    className="spinner-item active"
                    key={currentIndex}
                    initial={{ y: -30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.1 }}
                >
                    <span className="spinner-icon">{current.icon}</span>
                    <span className="spinner-name">{current.name}</span>
                </motion.div>
                <div className="spinner-item faded">{next.icon} {next.name}</div>
            </div>

            <div className="spinner-glow"></div>
        </motion.div>
    );
}
