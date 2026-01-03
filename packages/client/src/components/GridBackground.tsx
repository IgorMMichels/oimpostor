// ============================================
// ADVINHA - Infinite Grid Background
// Animated background with subtle grid
// ============================================

import { useRef } from 'react';
import {
    motion,
    useMotionValue,
    useAnimationFrame
} from "framer-motion";

interface GridBackgroundProps {
    gridSize?: number;
}

const GridPattern = ({ offsetX, offsetY, size, id }: { offsetX: any; offsetY: any; size: number; id: string }) => {
    return (
        <svg className="w-full h-full">
            <defs>
                <motion.pattern
                    id={id}
                    width={size}
                    height={size}
                    patternUnits="userSpaceOnUse"
                    x={offsetX}
                    y={offsetY}
                >
                    <path
                        d={`M ${size} 0 L 0 0 0 ${size}`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                        className="text-white/30"
                    />
                </motion.pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#${id})`} />
        </svg>
    );
};

export default function GridBackground({ gridSize = 50 }: GridBackgroundProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    // Grid animation
    const gridOffsetX = useMotionValue(0);
    const gridOffsetY = useMotionValue(0);

    useAnimationFrame(() => {
        gridOffsetX.set((gridOffsetX.get() + 0.3) % gridSize);
        gridOffsetY.set((gridOffsetY.get() + 0.3) % gridSize);
    });

    return (
        <div
            ref={containerRef}
            className="absolute inset-0 overflow-hidden pointer-events-none"
        >
            {/* Always visible grid (subtle) */}
            <div className="absolute inset-0 opacity-[0.08]">
                <GridPattern offsetX={gridOffsetX} offsetY={gridOffsetY} size={gridSize} id="grid-base" />
            </div>

            {/* Decorative blur orbs */}
            <div className="absolute inset-0">
                <div className="absolute right-[-15%] top-[-15%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[100px]" />
                <div className="absolute left-[-10%] bottom-[-20%] w-[35%] h-[35%] rounded-full bg-violet-600/15 blur-[120px]" />
                <div className="absolute right-[20%] bottom-[10%] w-[25%] h-[25%] rounded-full bg-fuchsia-600/10 blur-[80px]" />
            </div>
        </div>
    );
}

