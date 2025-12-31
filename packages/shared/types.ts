// ============================================
// ADVINHA - Shared Types
// Tipos compartilhados entre frontend e backend
// ============================================

// ============================================
// PLAYER & USER
// ============================================

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

// ============================================
// ROOM
// ============================================

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
    chatEnabled: boolean; // false = "Estamos Juntos" mode (presencial)
    timerEnabled: boolean;
    timerDuration: number; // seconds
    roundsPerGame: number;
}

export const DEFAULT_ROOM_SETTINGS: RoomSettings = {
    maxPlayers: 10,
    chatEnabled: true,
    timerEnabled: true,
    timerDuration: 120,
    roundsPerGame: 3,
};

// ============================================
// GAME STATE
// ============================================

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
    votes: Record<string, string>; // voterId -> targetId
    roundScores: Record<string, number>; // playerId -> points this round
    totalScores: Record<string, number>; // playerId -> total points
    chatMessages: ChatMessage[];
    timerEndsAt: number | null;
    lastCategoryId: string | null; // avoid repeating
    lastWord: string | null; // avoid repeating

    // NEW: Hint round data
    hintRound: number;              // Current hint round (1, 2, 3...)
    hints: HintEntry[];             // All hints given
    turnOrder: string[];            // Player IDs in turn order
    currentTurnIndex: number;       // Index of current player's turn
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

// ============================================
// CATEGORIES & WORDS
// ============================================

export interface Category {
    id: string;
    name: string;
    icon: string;
    words: string[];
}

export interface CategoriesData {
    categories: Category[];
}

// ============================================
// COSMETICS
// ============================================

export type CosmeticType = 'frame' | 'nameColor' | 'icon' | 'emote';

export interface Cosmetic {
    id: string;
    type: CosmeticType;
    name: string;
    price: number;
    preview: string; // CSS value, emoji, or image URL
    isDefault?: boolean;
}

// ============================================
// SOCKET EVENTS
// ============================================

// Client -> Server
export interface ClientToServerEvents {
    'room:create': (playerName: string, callback: (response: RoomResponse) => void) => void;
    'room:join': (code: string, playerName: string, callback: (response: RoomResponse) => void) => void;
    'room:leave': () => void;
    'room:update-settings': (settings: Partial<RoomSettings>) => void;
    'game:start': () => void;
    'game:chat': (message: string) => void;
    'game:vote': (targetId: string) => void;
    'game:next-phase': () => void;
    'game:submit-hint': (hint: string) => void;          // NEW: Submit hint
    'game:vote-decision': (decision: 'vote' | 'continue') => void; // NEW: Host decision
    'player:ready': (isReady: boolean) => void;
}

// Server -> Client
export interface ServerToClientEvents {
    'room:updated': (room: Room) => void;
    'room:player-joined': (player: Player) => void;
    'room:player-left': (playerId: string) => void;
    'game:phase-changed': (phase: GamePhase, data?: PhaseData) => void;
    'game:role-assigned': (role: RoleAssignment) => void;
    'game:chat-message': (message: ChatMessage) => void;
    'game:vote-received': (voterId: string) => void;
    'game:timer-update': (secondsLeft: number) => void;
    'game:results': (results: GameResults) => void;
    'game:hint-received': (hint: HintEntry) => void;     // NEW: Hint broadcast
    'game:turn-changed': (playerId: string) => void;     // NEW: Turn changed
    'error': (message: string) => void;
}

export interface RoomResponse {
    success: boolean;
    room?: Room;
    playerId?: string;
    error?: string;
}

export interface PhaseData {
    category?: Category;
    word?: string;
    timerEndsAt?: number;
    votes?: Record<string, string>;
    impostorId?: string;
    scores?: Record<string, number>;
    hintRound?: number;           // NEW
    hints?: HintEntry[];          // NEW
    currentTurnPlayerId?: string; // NEW
}

export interface RoleAssignment {
    isImpostor: boolean;
    category: Category;
    word: string | null; // null for impostor
}

export interface GameResults {
    impostorId: string;
    impostorCaught: boolean;
    roundScores: Record<string, number>;
    totalScores: Record<string, number>;
    isGameOver: boolean;
}

// ============================================
// SCORING CONSTANTS
// ============================================

export const SCORING = {
    CORRECT_VOTE: 100,        // Voted for impostor
    SURVIVED_INNOCENT: 50,    // Wasn't voted (innocent)
    IMPOSTOR_SURVIVED: 200,   // Impostor not caught
    IMPOSTOR_CAUGHT: 25,      // Consolation for caught impostor
    GAME_COMPLETED: 10,       // Participation bonus
} as const;

// ============================================
// TIMER CONSTANTS
// ============================================

export const TIMERS = {
    VOTE_DECISION: 15,        // 15 seconds to decide vote/continue
    VOTING: 45,               // 45 seconds to vote
    HINT_TIMEOUT: 60,         // 60 seconds per hint (optional)
} as const;
