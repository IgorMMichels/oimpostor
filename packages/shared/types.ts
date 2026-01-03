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
    'room:create': (playerName: string, sessionId: string | null, callback: (response: RoomResponse) => void) => void;
    'room:join': (code: string, playerName: string, sessionId: string | null, callback: (response: RoomResponse) => void) => void;
    'room:leave': () => void;
    'room:update-settings': (settings: Partial<RoomSettings>) => void;
    'game:start': () => void;
    'game:chat': (message: string) => void;
    'game:vote': (targetId: string) => void;
    'game:next-phase': () => void;
    'game:submit-hint': (hint: string) => void;
    'game:vote-decision': (decision: 'vote' | 'continue') => void;
    'player:ready': (isReady: boolean) => void;

    // LOCAL MODE EVENTS (Pass & Play)
    'local:create-session': (callback: (response: LocalSessionResponse) => void) => void;
    'local:add-player': (sessionId: string, name: string, callback: (response: LocalSessionResponse) => void) => void;
    'local:remove-player': (sessionId: string, playerId: string, callback: (response: LocalSessionResponse) => void) => void;
    'local:shuffle-players': (sessionId: string, callback: (response: LocalSessionResponse) => void) => void;
    'local:update-settings': (sessionId: string, settings: Partial<LocalSettings>, callback: (response: LocalSessionResponse) => void) => void;
    'local:start-game': (sessionId: string, callback: (response: LocalSessionResponse) => void) => void;
    'local:start-reveal': (sessionId: string, callback: (response: LocalSessionResponse) => void) => void;
    'local:player-ready': (sessionId: string, callback: (response: LocalSessionResponse) => void) => void;
    'local:confirm-reveal': (sessionId: string, callback: (response: LocalSessionResponse) => void) => void;
    'local:start-voting': (sessionId: string, callback: (response: LocalSessionResponse) => void) => void;
    'local:voter-ready': (sessionId: string, callback: (response: LocalSessionResponse) => void) => void;
    'local:submit-vote': (sessionId: string, targetId: string, callback: (response: LocalSessionResponse) => void) => void;
    'local:host-eliminate': (sessionId: string, targetId: string | null, callback: (response: LocalSessionResponse) => void) => void;
    'local:next-turn': (sessionId: string, callback: (response: LocalSessionResponse) => void) => void; // New: Next player hint
    'local:continue-game': (sessionId: string, callback: (response: LocalSessionResponse) => void) => void;
    'local:play-again': (sessionId: string, callback: (response: LocalSessionResponse) => void) => void;
    'local:get-session': (sessionId: string, callback: (response: LocalSessionResponse) => void) => void;
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
    'local:session-updated': (session: LocalGameState) => void; // Sync local session state
}

export interface RoomResponse {
    success: boolean;
    room?: Room;
    playerId?: string;
    error?: string;
    reconnected?: boolean; // True if this was a session reconnection
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

// ============================================
// LOCAL MODE TYPES (Pass & Play)
// ============================================

export interface LocalPlayer {
    id: string;
    name: string;
    isImpostor: boolean;
    isEliminated: boolean;
    hasRevealed: boolean;
    hasVoted: boolean;
}

export interface LocalSettings {
    impostorCount: number;
    discussionTime: number;
    hintTime: number; // New setting
    hideCategory: boolean;
    randomMode: boolean; // Random word from all categories
    manualVoting: boolean; // Custom: manual voting mode
    selectedCategories: string[];
}

export type LocalPhase =
    | 'setup'
    | 'category'
    | 'pass_device'
    | 'local_reveal'
    | 'local_hint'    // New phase
    | 'discussion'
    | 'pass_vote'
    | 'local_vote'
    | 'host_decision' // Custom: Host decides elimination
    | 'round_result'
    | 'game_result';

export interface LocalGameState {
    sessionId: string;
    phase: LocalPhase;
    players: LocalPlayer[];
    settings: LocalSettings;
    category: { id: string; name: string; icon: string } | null;
    word: string | null;
    impostorIds: string[];
    currentPlayerIndex: number;
    currentVoterIndex: number;
    votes: Record<string, string>;
    eliminatedThisRound: string | null;
    roundNumber: number;
    winner: 'impostors' | 'players' | null;
    timerEndsAt: number | null;
}

export interface LocalRoleInfo {
    playerId: string;
    playerName: string;
    isImpostor: boolean;
    word: string | null;
    category: { id: string; name: string; icon: string } | null;
}

export interface LocalSessionResponse {
    success: boolean;
    session?: LocalGameState;
    categories?: { id: string; name: string; icon: string }[];
    roleInfo?: LocalRoleInfo;
    voterName?: string;
    targets?: { id: string; name: string }[];
    error?: string;
}


