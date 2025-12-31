// ============================================
// ADVINHA - Shared Types (Client)
// Re-export types for client usage
// ============================================

// Player & User
export interface Player {
    id: string;
    name: string;
    avatarUrl?: string;
    isHost: boolean;
    isReady: boolean;
    isConnected: boolean;
    cosmetics: PlayerCosmetics;
}

export interface PlayerCosmetics {
    frameId: string;
    nameColorId: string;
    iconId: string;
}

export interface UserProfile {
    id: string;
    name: string;
    points: number;
    gamesPlayed: number;
    gamesWon: number;
    impostorWins: number;
    cosmetics: PlayerCosmetics;
    unlockedCosmetics: string[];
    createdAt: number;
}

// Room
export interface Room {
    id: string;
    code: string;
    hostId: string;
    players: Player[];
    settings: RoomSettings;
    gameState: GameState | null;
    createdAt: number;
}

export interface RoomSettings {
    maxPlayers: number;
    chatEnabled: boolean;
    timerEnabled: boolean;
    timerDuration: number;
    roundsPerGame: number;
}

// Game State
export type GamePhase =
    | 'lobby'
    | 'spinning_category'
    | 'spinning_word'
    | 'role_reveal'
    | 'hint_round'       // NEW: Players give hints one by one
    | 'vote_decision'    // NEW: Host decides to vote or continue
    | 'voting'
    | 'vote_results'
    | 'game_results';

export interface GameState {
    phase: GamePhase;
    currentRound: number;
    totalRounds: number;
    category: Category | null;
    word: string | null;
    impostorId: string | null;
    votes: Record<string, string>;
    roundScores: Record<string, number>;
    totalScores: Record<string, number>;
    chatMessages: ChatMessage[];
    timerEndsAt: number | null;
    lastCategoryId: string | null;
    lastWord: string | null;
    // Hint round data
    hintRound: number;
    hints: HintEntry[];
    turnOrder: string[];
    currentTurnIndex: number;
}

export interface HintEntry {
    playerId: string;
    playerName: string;
    hint: string;
    round: number;
}

export interface ChatMessage {
    id: string;
    playerId: string;
    playerName: string;
    content: string;
    timestamp: number;
}

// Categories
export interface Category {
    id: string;
    name: string;
    icon: string;
    words: string[];
}

// Role Assignment
export interface RoleAssignment {
    isImpostor: boolean;
    category: Category;
    word: string | null;
}

// Game Results
export interface GameResults {
    impostorId: string;
    impostorCaught: boolean;
    roundScores: Record<string, number>;
    totalScores: Record<string, number>;
    isGameOver: boolean;
}

// Phase Data
export interface PhaseData {
    category?: Category;
    word?: string;
    timerEndsAt?: number;
    votes?: Record<string, string>;
    impostorId?: string;
    scores?: Record<string, number>;
    hintRound?: number;
    hints?: HintEntry[];
    currentTurnPlayerId?: string;
}

// Cosmetics
export type CosmeticType = 'frame' | 'nameColor' | 'icon' | 'emote';

export interface Cosmetic {
    id: string;
    type: CosmeticType;
    name: string;
    price: number;
    preview: string;
    isDefault?: boolean;
}

// Timer constants
export const TIMERS = {
    VOTE_DECISION: 15,
    VOTING: 45,
    HINT_TIMEOUT: 60,
} as const;
