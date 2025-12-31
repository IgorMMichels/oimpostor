// ============================================
// ADVINHA - Game Store (Zustand)
// Global state management with Socket.io
// ============================================

import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import type {
    Room,
    RoomSettings,
    RoleAssignment,
    GameResults,
    HintEntry,
} from '../types';

interface RoomResponse {
    success: boolean;
    room?: Room;
    playerId?: string;
    error?: string;
}

const SOCKET_URL = typeof window !== 'undefined' && window.location.protocol === 'https:'
    ? window.location.origin
    : 'http://localhost:3001';

interface GameStore {
    // Connection
    socket: Socket | null;
    isConnected: boolean;

    // User
    playerId: string | null;
    playerName: string;

    // Room
    room: Room | null;
    error: string | null;

    // Game
    role: RoleAssignment | null;
    gameResults: GameResults | null;
    timerSeconds: number | null;
    currentTurnPlayerId: string | null;

    // Actions
    connect: () => void;
    disconnect: () => void;
    setPlayerName: (name: string) => void;
    createRoom: (name: string) => Promise<boolean>;
    joinRoom: (code: string, name: string) => Promise<boolean>;
    leaveRoom: () => void;
    updateSettings: (settings: Partial<RoomSettings>) => void;
    setReady: (isReady: boolean) => void;
    startGame: () => void;
    sendChat: (message: string) => void;
    vote: (targetId: string) => void;
    nextPhase: () => void;
    submitHint: (hint: string) => void;
    voteDecision: (decision: 'vote' | 'continue') => void;
    clearError: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
    // Initial state
    socket: null,
    isConnected: false,
    playerId: null,
    playerName: localStorage.getItem('advinha_name') || '',
    room: null,
    error: null,
    role: null,
    gameResults: null,
    timerSeconds: null,
    currentTurnPlayerId: null,

    // Connect to socket server
    connect: () => {
        if (get().socket?.connected) return;

        const socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socket.on('connect', () => {
            console.log('[Socket] Connected:', socket.id);
            set({ isConnected: true, playerId: socket.id });
        });

        socket.on('disconnect', () => {
            console.log('[Socket] Disconnected');
            set({ isConnected: false });
        });

        socket.on('connect_error', (err) => {
            console.error('[Socket] Connection error:', err);
            set({ error: 'Erro de conexão com o servidor.' });
        });

        // Room events
        socket.on('room:updated', (room) => {
            set({ room });
        });

        socket.on('room:player-joined', (player) => {
            const currentRoom = get().room;
            if (currentRoom) {
                set({
                    room: {
                        ...currentRoom,
                        players: [...currentRoom.players, player],
                    },
                });
            }
        });

        socket.on('room:player-left', (playerId) => {
            const currentRoom = get().room;
            if (currentRoom) {
                set({
                    room: {
                        ...currentRoom,
                        players: currentRoom.players.filter(p => p.id !== playerId),
                    },
                });
            }
        });

        // Game events
        socket.on('game:phase-changed', (phase, data) => {
            const currentRoom = get().room;
            if (currentRoom?.gameState) {
                set({
                    room: {
                        ...currentRoom,
                        gameState: {
                            ...currentRoom.gameState,
                            phase,
                            category: data?.category || currentRoom.gameState.category,
                            timerEndsAt: data?.timerEndsAt || null,
                            hintRound: data?.hintRound ?? currentRoom.gameState.hintRound,
                            hints: data?.hints ?? currentRoom.gameState.hints,
                        },
                    },
                    currentTurnPlayerId: data?.currentTurnPlayerId || null,
                });
            } else if (currentRoom && phase !== 'lobby') {
                // Initialize game state if not present
                set({
                    room: {
                        ...currentRoom,
                        gameState: {
                            phase,
                            currentRound: 1,
                            totalRounds: currentRoom.settings.roundsPerGame,
                            category: data?.category || null,
                            word: null,
                            impostorId: null,
                            votes: {},
                            roundScores: {},
                            totalScores: {},
                            chatMessages: [],
                            timerEndsAt: data?.timerEndsAt || null,
                            lastCategoryId: null,
                            lastWord: null,
                            hintRound: data?.hintRound || 0,
                            hints: data?.hints || [],
                            turnOrder: [],
                            currentTurnIndex: 0,
                        },
                    },
                    currentTurnPlayerId: data?.currentTurnPlayerId || null,
                });
            }

            // Reset role on new round
            if (phase === 'spinning_category') {
                set({ role: null, gameResults: null });
            }

            // Back to lobby
            if (phase === 'lobby') {
                set({
                    role: null,
                    gameResults: null,
                    currentTurnPlayerId: null,
                    room: currentRoom ? { ...currentRoom, gameState: null } : null,
                });
            }
        });

        socket.on('game:role-assigned', (role) => {
            set({ role });
        });

        socket.on('game:chat-message', (message) => {
            const currentRoom = get().room;
            if (currentRoom?.gameState) {
                set({
                    room: {
                        ...currentRoom,
                        gameState: {
                            ...currentRoom.gameState,
                            chatMessages: [...currentRoom.gameState.chatMessages, message],
                        },
                    },
                });
            }
        });

        // Hint events
        socket.on('game:hint-received', (hint: HintEntry) => {
            const currentRoom = get().room;
            if (currentRoom?.gameState) {
                set({
                    room: {
                        ...currentRoom,
                        gameState: {
                            ...currentRoom.gameState,
                            hints: [...currentRoom.gameState.hints, hint],
                        },
                    },
                });
            }
        });

        socket.on('game:turn-changed', (playerId: string) => {
            set({ currentTurnPlayerId: playerId });
        });

        socket.on('game:vote-received', (voterId) => {
            const currentRoom = get().room;
            if (currentRoom?.gameState) {
                set({
                    room: {
                        ...currentRoom,
                        gameState: {
                            ...currentRoom.gameState,
                            votes: {
                                ...currentRoom.gameState.votes,
                                [voterId]: 'voted', // Mark as voted without revealing target
                            },
                        },
                    },
                });
            }
        });

        socket.on('game:timer-update', (seconds) => {
            set({ timerSeconds: seconds });
        });

        socket.on('game:results', (results) => {
            set({ gameResults: results });
        });

        socket.on('error', (message) => {
            set({ error: message });
            setTimeout(() => set({ error: null }), 5000);
        });

        set({ socket });
    },

    // Disconnect
    disconnect: () => {
        const { socket } = get();
        if (socket) {
            socket.disconnect();
            set({ socket: null, isConnected: false });
        }
    },

    // Set player name
    setPlayerName: (name) => {
        localStorage.setItem('advinha_name', name);
        set({ playerName: name });
    },

    // Create room
    createRoom: (name) => {
        return new Promise((resolve) => {
            const { socket } = get();
            if (!socket) {
                set({ error: 'Não conectado ao servidor.' });
                resolve(false);
                return;
            }

            get().setPlayerName(name);

            socket.emit('room:create', name, (response: RoomResponse) => {
                if (response.success && response.room) {
                    set({
                        room: response.room,
                        playerId: response.playerId || socket.id,
                        error: null,
                    });
                    resolve(true);
                } else {
                    set({ error: response.error || 'Erro ao criar sala.' });
                    resolve(false);
                }
            });
        });
    },

    // Join room
    joinRoom: (code, name) => {
        return new Promise((resolve) => {
            const { socket } = get();
            if (!socket) {
                set({ error: 'Não conectado ao servidor.' });
                resolve(false);
                return;
            }

            get().setPlayerName(name);

            socket.emit('room:join', code.toUpperCase(), name, (response: RoomResponse) => {
                if (response.success && response.room) {
                    set({
                        room: response.room,
                        playerId: response.playerId || socket.id,
                        error: null,
                    });
                    resolve(true);
                } else {
                    set({ error: response.error || 'Sala não encontrada.' });
                    resolve(false);
                }
            });
        });
    },

    // Leave room
    leaveRoom: () => {
        const { socket } = get();
        if (socket) {
            socket.emit('room:leave');
        }
        set({ room: null, role: null, gameResults: null, currentTurnPlayerId: null });
    },

    // Update settings
    updateSettings: (settings) => {
        const { socket } = get();
        if (socket) {
            socket.emit('room:update-settings', settings);
        }
    },

    // Set ready
    setReady: (isReady) => {
        const { socket } = get();
        if (socket) {
            socket.emit('player:ready', isReady);
        }
    },

    // Start game
    startGame: () => {
        const { socket } = get();
        if (socket) {
            socket.emit('game:start');
        }
    },

    // Send chat message
    sendChat: (message) => {
        const { socket } = get();
        if (socket && message.trim()) {
            socket.emit('game:chat', message.trim());
        }
    },

    // Vote for player
    vote: (targetId) => {
        const { socket } = get();
        if (socket) {
            socket.emit('game:vote', targetId);
        }
    },

    // Advance phase
    nextPhase: () => {
        const { socket } = get();
        if (socket) {
            socket.emit('game:next-phase');
        }
    },

    // Submit hint (new)
    submitHint: (hint) => {
        const { socket } = get();
        if (socket && hint.trim()) {
            socket.emit('game:submit-hint', hint.trim());
        }
    },

    // Vote decision (new)
    voteDecision: (decision) => {
        const { socket } = get();
        if (socket) {
            socket.emit('game:vote-decision', decision);
        }
    },

    // Clear error
    clearError: () => {
        set({ error: null });
    },
}));

// Helper hook to get current player
export const useCurrentPlayer = () => {
    const { room, playerId } = useGameStore();
    return room?.players.find(p => p.id === playerId) || null;
};

// Helper hook to check if current player is host
export const useIsHost = () => {
    const player = useCurrentPlayer();
    return player?.isHost || false;
};
