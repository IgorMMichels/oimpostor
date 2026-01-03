// ============================================
// ADVINHA - Infinite Grid Background
// Optimized with CSS animation (no JS frame loop)
// ============================================

import './GridBackground.css';

interface GridBackgroundProps {
    gridSize?: number;
}

export default function GridBackground({ gridSize = 50 }: GridBackgroundProps) {
    return (
        <div className="grid-background">
            {/* Animated SVG grid using CSS animation */}
            <svg
                className="grid-svg"
                style={{ '--grid-size': `${gridSize}px` } as React.CSSProperties}
            >
                <defs>
                    <pattern
                        id="grid-pattern"
                        width={gridSize}
                        height={gridSize}
                        patternUnits="userSpaceOnUse"
                    >
                        <path
                            d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1"
                        />
                    </pattern>
                </defs>
                <rect width="200%" height="200%" fill="url(#grid-pattern)" />
            </svg>

            {/* Decorative blur orbs - static, no animation */}
            <div className="grid-orbs">
                <div className="orb orb-1" />
                <div className="orb orb-2" />
                <div className="orb orb-3" />
            </div>
        </div>
    );
}
