// ============================================
// ADVINHA - Socket.io Event Handlers
// Real-time multiplayer communication
// ============================================

import { Server, Socket } from 'socket.io';
import { RoomManager } from '../rooms/RoomManager.js';
import { GameEngine, getCategories } from '../game/GameEngine.js';
import {
    type ClientToServerEvents,
    type ServerToClientEvents,
    type Room,
    type GameState,
    type GamePhase,
    type RoomResponse,
    type PhaseData,
    TIMERS,
} from '@advinha/shared/types';

// Store game engines per room
const gameEngines: Map<string, GameEngine> = new Map();

// Phase timing (milliseconds)
const PHASE_TIMING = {
    CATEGORY_SPIN: 4000,
    WORD_SPIN: 3000,
    ROLE_REVEAL: 5000,
};

export function setupSocketHandlers(
    io: Server<ClientToServerEvents, ServerToClientEvents>,
    roomManager: RoomManager
): void {
    // Cleanup stale rooms every 5 minutes
    setInterval(() => {
        roomManager.cleanupStaleRooms();
    }, 5 * 60 * 1000);

    io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
        console.log(`[Socket] Client connected: ${socket.id}`);

        // ==========================================
        // ROOM EVENTS
        // ==========================================

        // Create new room
        socket.on('room:create', (playerName, callback) => {
            try {
                const room = roomManager.createRoom(socket.id, playerName);
                socket.join(room.code);

                callback({
                    success: true,
                    room,
                    playerId: socket.id,
                });

                console.log(`[Socket] Room created: ${room.code} by ${playerName}`);
            } catch (error) {
                console.error('[Socket] Error creating room:', error);
                callback({
                    success: false,
                    error: 'Erro ao criar sala. Tente novamente.',
                });
            }
        });

        // Join existing room
        socket.on('room:join', (code, playerName, callback) => {
            try {
                const room = roomManager.joinRoom(code, socket.id, playerName);

                if (!room) {
                    callback({
                        success: false,
                        error: 'Sala não encontrada ou lotada.',
                    });
                    return;
                }

                socket.join(room.code);

                // Notify other players
                const newPlayer = room.players.find(p => p.id === socket.id);
                if (newPlayer) {
                    socket.to(room.code).emit('room:player-joined', newPlayer);
                }

                callback({
                    success: true,
                    room,
                    playerId: socket.id,
                });

                // Send updated room to all
                io.to(room.code).emit('room:updated', room);

                console.log(`[Socket] ${playerName} joined room: ${room.code}`);
            } catch (error) {
                console.error('[Socket] Error joining room:', error);
                callback({
                    success: false,
                    error: 'Erro ao entrar na sala. Tente novamente.',
                });
            }
        });

        // Leave room
        socket.on('room:leave', () => {
            handlePlayerLeave(socket, io, roomManager);
        });

        // Update room settings
        socket.on('room:update-settings', (settings) => {
            const room = roomManager.getRoomByPlayerId(socket.id);
            if (!room) return;

            // Only host can update settings
            const player = room.players.find(p => p.id === socket.id);
            if (!player?.isHost) return;

            const updatedRoom = roomManager.updateSettings(room.code, settings);
            if (updatedRoom) {
                io.to(room.code).emit('room:updated', updatedRoom);
            }
        });

        // Player ready toggle
        socket.on('player:ready', (isReady) => {
            const room = roomManager.getRoomByPlayerId(socket.id);
            if (!room) return;

            const player = room.players.find(p => p.id === socket.id);
            if (player) {
                player.isReady = isReady;
                io.to(room.code).emit('room:updated', room);
            }
        });

        // ==========================================
        // GAME EVENTS
        // ==========================================

        // Start game
        socket.on('game:start', () => {
            const room = roomManager.getRoomByPlayerId(socket.id);
            if (!room) return;

            // Only host can start
            const player = room.players.find(p => p.id === socket.id);
            if (!player?.isHost) return;

            // Need at least 3 players
            if (room.players.length < 3) {
                socket.emit('error', 'Mínimo 3 jogadores para iniciar.');
                return;
            }

            // Initialize game engine
            const engine = new GameEngine(room);
            gameEngines.set(room.code, engine);

            // Initialize game state
            const gameState = engine.initializeGame();
            room.gameState = gameState;
            roomManager.updateGameState(room.code, gameState);

            // Start category spinning phase
            io.to(room.code).emit('game:phase-changed', 'spinning_category', {
                category: undefined,
            });

            // After spin animation, select category and move to word spin
            setTimeout(() => {
                const category = engine.selectCategory(gameState.lastCategoryId);
                gameState.category = category;
                gameState.lastCategoryId = category.id;
                gameState.phase = 'spinning_word';

                io.to(room.code).emit('game:phase-changed', 'spinning_word', {
                    category,
                });

                // After word spin, assign roles
                setTimeout(() => {
                    const playerIds = room.players.map(p => p.id);
                    const assignments = engine.assignRoles(gameState, playerIds);

                    gameState.phase = 'role_reveal';

                    // Send individual role assignments
                    room.players.forEach(p => {
                        const assignment = assignments.get(p.id);
                        if (assignment) {
                            io.to(p.id).emit('game:role-assigned', assignment);
                        }
                    });

                    io.to(room.code).emit('game:phase-changed', 'role_reveal');

                    // Move to HINT ROUND (new flow)
                    setTimeout(() => {
                        startHintRound(io, room, engine, roomManager);
                    }, PHASE_TIMING.ROLE_REVEAL);

                }, PHASE_TIMING.WORD_SPIN);
            }, PHASE_TIMING.CATEGORY_SPIN);

            console.log(`[Socket] Game started in room: ${room.code}`);
        });

        // Submit hint (new)
        socket.on('game:submit-hint', (hint) => {
            const room = roomManager.getRoomByPlayerId(socket.id);
            if (!room?.gameState) return;

            // Only during hint_round phase
            if (room.gameState.phase !== 'hint_round') return;

            const player = room.players.find(p => p.id === socket.id);
            if (!player) return;

            const engine = gameEngines.get(room.code);
            if (!engine) return;

            const hintEntry = engine.submitHint(
                room.gameState,
                socket.id,
                player.name,
                hint
            );

            if (hintEntry) {
                // Broadcast hint to all players
                io.to(room.code).emit('game:hint-received', hintEntry);

                // Check if round complete
                if (engine.isHintRoundComplete(room.gameState)) {
                    // Move to vote decision
                    startVoteDecision(io, room, engine, roomManager);
                } else {
                    // Notify next player's turn
                    const nextPlayerId = engine.getCurrentTurnPlayerId(room.gameState);
                    if (nextPlayerId) {
                        io.to(room.code).emit('game:turn-changed', nextPlayerId);
                    }
                }

                roomManager.updateGameState(room.code, room.gameState);
            }
        });

        // Vote decision (new) - host decides to vote or continue
        socket.on('game:vote-decision', (decision) => {
            const room = roomManager.getRoomByPlayerId(socket.id);
            if (!room?.gameState) return;

            // Only during vote_decision phase
            if (room.gameState.phase !== 'vote_decision') return;

            // Only host can decide
            const player = room.players.find(p => p.id === socket.id);
            if (!player?.isHost) return;

            const engine = gameEngines.get(room.code);
            if (!engine) return;

            if (decision === 'vote') {
                // Start voting phase
                engine.startVoting(room.gameState);
                roomManager.updateGameState(room.code, room.gameState);

                io.to(room.code).emit('game:phase-changed', 'voting', {
                    timerEndsAt: room.gameState.timerEndsAt ?? undefined,
                });

                // Start voting timer
                startVotingTimer(io, room, room.gameState, engine, roomManager);
            } else {
                // Continue with another hint round
                startHintRound(io, room, engine, roomManager);
            }
        });

        // Chat message (now also works during voting)
        socket.on('game:chat', (message) => {
            const room = roomManager.getRoomByPlayerId(socket.id);
            if (!room?.gameState) return;

            // Check if chat is enabled
            if (!room.settings.chatEnabled) return;

            // Only during voting phase (chat during discussion of who is impostor)
            if (room.gameState.phase !== 'voting') return;

            const player = room.players.find(p => p.id === socket.id);
            if (!player) return;

            const engine = gameEngines.get(room.code);
            if (!engine) return;

            const chatMessage = engine.addChatMessage(
                room.gameState,
                socket.id,
                player.name,
                message
            );

            io.to(room.code).emit('game:chat-message', chatMessage);
        });

        // Vote for player
        socket.on('game:vote', (targetId) => {
            const room = roomManager.getRoomByPlayerId(socket.id);
            if (!room?.gameState) return;

            // Only during voting phase
            if (room.gameState.phase !== 'voting') return;

            const engine = gameEngines.get(room.code);
            if (!engine) return;

            const voteRegistered = engine.processVote(room.gameState, socket.id, targetId);
            if (voteRegistered) {
                // Notify all that a vote was received (not who voted for whom)
                io.to(room.code).emit('game:vote-received', socket.id);

                // Check if all votes are in
                const connectedPlayers = room.players.filter(p => p.isConnected).length;
                if (engine.allVotesReceived(room.gameState, connectedPlayers)) {
                    finishVoting(io, room, engine, roomManager);
                }
            }
        });

        // Host advances phase (or auto-advance)
        socket.on('game:next-phase', () => {
            const room = roomManager.getRoomByPlayerId(socket.id);
            if (!room?.gameState) return;

            const player = room.players.find(p => p.id === socket.id);
            if (!player?.isHost) return;

            const engine = gameEngines.get(room.code);
            if (!engine) return;

            advancePhase(io, room, engine, roomManager);
        });

        // ==========================================
        // DISCONNECT
        // ==========================================

        socket.on('disconnect', () => {
            console.log(`[Socket] Client disconnected: ${socket.id}`);
            handlePlayerLeave(socket, io, roomManager);
        });
    });
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function handlePlayerLeave(
    socket: Socket,
    io: Server,
    roomManager: RoomManager
): void {
    const { room, wasHost } = roomManager.leaveRoom(socket.id);

    if (room) {
        socket.to(room.code).emit('room:player-left', socket.id);
        io.to(room.code).emit('room:updated', room);
    }

    socket.leave(socket.id);
}

// Start a new hint round
function startHintRound(
    io: Server,
    room: Room,
    engine: GameEngine,
    roomManager: RoomManager
): void {
    if (!room.gameState) return;

    engine.startHintRound(room.gameState);
    roomManager.updateGameState(room.code, room.gameState);

    const firstPlayerId = engine.getCurrentTurnPlayerId(room.gameState);

    io.to(room.code).emit('game:phase-changed', 'hint_round', {
        hintRound: room.gameState.hintRound,
        hints: room.gameState.hints,
        currentTurnPlayerId: firstPlayerId || undefined,
    });

    if (firstPlayerId) {
        io.to(room.code).emit('game:turn-changed', firstPlayerId);
    }
}

// Start vote decision phase
function startVoteDecision(
    io: Server,
    room: Room,
    engine: GameEngine,
    roomManager: RoomManager
): void {
    if (!room.gameState) return;

    engine.startVoteDecision(room.gameState);
    roomManager.updateGameState(room.code, room.gameState);

    io.to(room.code).emit('game:phase-changed', 'vote_decision', {
        timerEndsAt: room.gameState.timerEndsAt,
        hintRound: room.gameState.hintRound,
    });

    // Start 15 second timer
    startVoteDecisionTimer(io, room, room.gameState, engine, roomManager);
}

// Timer for vote decision (15 seconds)
function startVoteDecisionTimer(
    io: Server,
    room: Room,
    gameState: GameState,
    engine: GameEngine,
    roomManager: RoomManager
): void {
    const checkInterval = setInterval(() => {
        if (!gameState.timerEndsAt || gameState.phase !== 'vote_decision') {
            clearInterval(checkInterval);
            return;
        }

        const secondsLeft = Math.max(0, Math.floor((gameState.timerEndsAt - Date.now()) / 1000));

        if (secondsLeft <= 0) {
            clearInterval(checkInterval);
            // Time's up - auto continue with another round
            startHintRound(io, room, engine, roomManager);
        } else {
            io.to(room.code).emit('game:timer-update', secondsLeft);
        }
    }, 1000);
}

// Timer for voting phase
function startVotingTimer(
    io: Server,
    room: Room,
    gameState: GameState,
    engine: GameEngine,
    roomManager: RoomManager
): void {
    const checkInterval = setInterval(() => {
        if (!gameState.timerEndsAt || gameState.phase !== 'voting') {
            clearInterval(checkInterval);
            return;
        }

        const secondsLeft = Math.max(0, Math.floor((gameState.timerEndsAt - Date.now()) / 1000));

        if (secondsLeft <= 0) {
            clearInterval(checkInterval);
            // Time's up - finish voting with current votes
            finishVoting(io, room, engine, roomManager);
        } else if (secondsLeft % 10 === 0 || secondsLeft <= 10) {
            io.to(room.code).emit('game:timer-update', secondsLeft);
        }
    }, 1000);
}

function advancePhase(
    io: Server,
    room: Room,
    engine: GameEngine,
    roomManager: RoomManager
): void {
    if (!room.gameState) return;

    const currentPhase = room.gameState.phase;

    switch (currentPhase) {
        case 'role_reveal':
            // Move to hint round
            startHintRound(io, room, engine, roomManager);
            break;

        case 'hint_round':
            // Host can force vote decision
            startVoteDecision(io, room, engine, roomManager);
            break;

        case 'vote_decision':
            // Force voting
            engine.startVoting(room.gameState);
            roomManager.updateGameState(room.code, room.gameState);
            io.to(room.code).emit('game:phase-changed', 'voting', {
                timerEndsAt: room.gameState.timerEndsAt,
            });
            startVotingTimer(io, room, room.gameState, engine, roomManager);
            break;

        case 'voting':
            finishVoting(io, room, engine, roomManager);
            break;

        case 'vote_results':
        case 'game_results':
            // Start next round or return to lobby
            const results = engine.calculateResults(room.gameState);
            if (results.isGameOver) {
                // End game, return to lobby
                room.gameState = null;
                gameEngines.delete(room.code);
                roomManager.updateGameState(room.code, null);

                // Reset player ready states
                room.players.forEach(p => { p.isReady = false; });

                io.to(room.code).emit('game:phase-changed', 'lobby');
                io.to(room.code).emit('room:updated', room);
            } else {
                // Next round - restart the flow
                engine.startNextRound(room.gameState);
                roomManager.updateGameState(room.code, room.gameState);

                io.to(room.code).emit('game:phase-changed', 'spinning_category');

                // Trigger category spin
                setTimeout(() => {
                    if (!room.gameState) return;

                    const category = engine.selectCategory(room.gameState.lastCategoryId);
                    room.gameState.category = category;
                    room.gameState.lastCategoryId = category.id;
                    room.gameState.phase = 'spinning_word';

                    io.to(room.code).emit('game:phase-changed', 'spinning_word', { category });

                    setTimeout(() => {
                        if (!room.gameState) return;

                        const playerIds = room.players.map(p => p.id);
                        const assignments = engine.assignRoles(room.gameState, playerIds);

                        room.gameState.phase = 'role_reveal';

                        room.players.forEach(p => {
                            const assignment = assignments.get(p.id);
                            if (assignment) {
                                io.to(p.id).emit('game:role-assigned', assignment);
                            }
                        });

                        io.to(room.code).emit('game:phase-changed', 'role_reveal');

                        setTimeout(() => {
                            startHintRound(io, room, engine, roomManager);
                        }, PHASE_TIMING.ROLE_REVEAL);
                    }, PHASE_TIMING.WORD_SPIN);
                }, PHASE_TIMING.CATEGORY_SPIN);
            }
            break;
    }
}

function finishVoting(
    io: Server,
    room: Room,
    engine: GameEngine,
    roomManager: RoomManager
): void {
    if (!room.gameState) return;

    const results = engine.calculateResults(room.gameState);

    room.gameState.phase = results.isGameOver ? 'game_results' : 'vote_results';
    room.gameState.timerEndsAt = null;
    roomManager.updateGameState(room.code, room.gameState);

    io.to(room.code).emit('game:results', results);
    io.to(room.code).emit('game:phase-changed', room.gameState.phase, {
        impostorId: results.impostorId,
        votes: room.gameState.votes,
        scores: results.roundScores,
    });
}
