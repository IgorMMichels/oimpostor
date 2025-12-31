// ============================================
// ADVINHA - Intro Animation (WOW Moment)
// Dramatic entrance with suspense and mystery
// ============================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './IntroAnimation.css';

interface IntroAnimationProps {
    onComplete: () => void;
}

export default function IntroAnimation({ onComplete }: IntroAnimationProps) {
    const [phase, setPhase] = useState<'silhouettes' | 'scan' | 'title' | 'done'>('silhouettes');

    useEffect(() => {
        const timers = [
            setTimeout(() => setPhase('scan'), 600),
            setTimeout(() => setPhase('title'), 1200),
            setTimeout(() => setPhase('done'), 2800),
            setTimeout(() => onComplete(), 3000),
        ];

        return () => timers.forEach(clearTimeout);
    }, [onComplete]);

    return (
        <AnimatePresence>
            {phase !== 'done' && (
                <motion.div
                    className="intro-overlay"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {/* Silhouettes Background */}
                    <div className="silhouettes-container">
                        {[...Array(6)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="silhouette"
                                initial={{ opacity: 0, y: 50, scale: 0.8 }}
                                animate={{
                                    opacity: [0, 0.6, 0.4],
                                    y: [50, 0, -10],
                                    scale: [0.8, 1, 1.02]
                                }}
                                transition={{
                                    delay: i * 0.08,
                                    duration: 0.6,
                                    ease: 'easeOut'
                                }}
                                style={{
                                    left: `${10 + i * 15}%`,
                                    animationDelay: `${i * 0.1}s`
                                }}
                            >
                                <div className="silhouette-head" />
                                <div className="silhouette-body" />
                                {/* Question mark for impostor mystery */}
                                <motion.span
                                    className="silhouette-question"
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.8 + i * 0.1 }}
                                >
                                    ?
                                </motion.span>
                            </motion.div>
                        ))}
                    </div>

                    {/* Scanning Line Effect */}
                    <motion.div
                        className="scan-line"
                        initial={{ top: '-5%' }}
                        animate={{ top: '105%' }}
                        transition={{
                            duration: 1.2,
                            ease: 'linear',
                            delay: 0.5
                        }}
                    />

                    {/* Title with Glitch */}
                    {(phase === 'title' || phase === 'scan') && (
                        <motion.div
                            className="intro-title-container"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            <motion.h1
                                className="intro-title glitch"
                                data-text="O IMPOSTOR"
                                initial={{ scale: 1.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{
                                    type: 'spring',
                                    damping: 15,
                                    stiffness: 300
                                }}
                            >
                                O IMPOSTOR
                            </motion.h1>

                            <motion.p
                                className="intro-tagline"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                Confie em ninguém.
                            </motion.p>
                        </motion.div>
                    )}

                    {/* Ambient Particles */}
                    <div className="particles">
                        {[...Array(20)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="particle"
                                initial={{
                                    opacity: 0,
                                    x: Math.random() * window.innerWidth,
                                    y: Math.random() * window.innerHeight
                                }}
                                animate={{
                                    opacity: [0, 0.6, 0],
                                    y: [null, Math.random() * -100],
                                }}
                                transition={{
                                    duration: 2 + Math.random() * 2,
                                    delay: Math.random() * 1,
                                    repeat: Infinity,
                                    repeatType: 'loop'
                                }}
                                style={{
                                    left: `${Math.random() * 100}%`,
                                    top: `${Math.random() * 100}%`
                                }}
                            />
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
