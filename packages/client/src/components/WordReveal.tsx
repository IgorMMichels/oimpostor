// ============================================
// ADVINHA - Word Reveal Component
// Shows category and spinning/revealed word
// ============================================

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { Category } from '../types';
import './Spinner.css';

interface WordRevealProps {
    category: Category | null;
    isSpinning?: boolean;
}

// Sample words for animation
const SAMPLE_WORDS = [
    'Cachorro', 'Pizza', 'Médico', 'Praia', 'Futebol',
    'Batman', 'Guitarra', 'Celular', 'Camiseta', 'Carro'
];

export default function WordReveal({ category, isSpinning = false }: WordRevealProps) {
    const [currentWord, setCurrentWord] = useState(SAMPLE_WORDS[0]);
    const [wordIndex, setWordIndex] = useState(0);

    useEffect(() => {
        if (!isSpinning) return;

        const wordsToUse = category?.words?.length ? category.words : SAMPLE_WORDS;

        const interval = setInterval(() => {
            setWordIndex(prev => (prev + 1) % wordsToUse.length);
            setCurrentWord(wordsToUse[(wordIndex + 1) % wordsToUse.length]);
        }, 80);

        return () => clearInterval(interval);
    }, [isSpinning, wordIndex]);

    if (!category) return null;

    return (
        <motion.div
            className="phase-container word-reveal-container"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
        >
            <div className="category-badge">
                <span>{category.icon}</span>
                <span>{category.name}</span>
            </div>

            <motion.div
                className={`word-display ${isSpinning ? 'spinning' : ''}`}
                key={isSpinning ? currentWord : 'final'}
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
            >
                {isSpinning ? currentWord : '???'}
            </motion.div>

            {isSpinning && (
                <p className="role-hint" style={{ marginTop: 'var(--space-xl)' }}>
                    Sorteando palavra...
                </p>
            )}
        </motion.div>
    );
}
