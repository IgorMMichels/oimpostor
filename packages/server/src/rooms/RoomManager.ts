// ============================================
// ADVINHA - Room Manager
// Manages game rooms, players, and lifecycle
// ============================================

import { v4 as uuidv4 } from 'uuid';
import type {
    Room,
    Player,
    RoomSettings,
    GameState,
    PlayerCosmetics,
} from '@advinha/shared/types';

// Default settings inline to avoid import issues
const defaultSettings: RoomSettings = {
    maxPlayers: 10,
    chatEnabled: true,
    timerEnabled: true,
    timerDuration: 120,
    roundsPerGame: 3,
};

// Default cosmetics for new players
const defaultCosmetics: PlayerCosmetics = {
    frameId: 'default',
    nameColorId: 'white',
    iconId: 'default',
};

export class RoomManager {
    private rooms: Map<string, Room> = new Map();
    private playerRooms: Map<string, string> = new Map(); // playerId -> roomCode

    // Generate unique 6-character room code
    private generateRoomCode(): string {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars
        let code: string;
        do {
            code = '';
            for (let i = 0; i < 6; i++) {
                code += chars[Math.floor(Math.random() * chars.length)];
            }
        } while (this.rooms.has(code));
        return code;
    }

    // Create a new room
    createRoom(hostId: string, hostName: string): Room {
        const code = this.generateRoomCode();
        const host: Player = {
            id: hostId,
            name: hostName,
            isHost: true,
            isReady: true,
            isConnected: true,
            cosmetics: defaultCosmetics,
        };

        const room: Room = {
            id: uuidv4(),
            code,
            hostId,
            players: [host],
            settings: { ...defaultSettings },
            gameState: null,
            createdAt: Date.now(),
        };

        this.rooms.set(code, room);
        this.playerRooms.set(hostId, code);

        console.log(`[Room] Created room ${code} by ${hostName}`);
        return room;
    }

    // Join an existing room
    joinRoom(code: string, playerId: string, playerName: string): Room | null {
        const room = this.rooms.get(code.toUpperCase());
        if (!room) {
            return null;
        }

        if (room.players.length >= room.settings.maxPlayers) {
            return null;
        }

        // Check if player already in room
        const existingPlayer = room.players.find(p => p.id === playerId);
        if (existingPlayer) {
            existingPlayer.isConnected = true;
            return room;
        }

        const newPlayer: Player = {
            id: playerId,
            name: playerName,
            isHost: false,
            isReady: false,
            isConnected: true,
            cosmetics: defaultCosmetics,
        };

        room.players.push(newPlayer);
        this.playerRooms.set(playerId, code);

        console.log(`[Room] ${playerName} joined room ${code}`);
        return room;
    }

    // Remove player from room
    leaveRoom(playerId: string): { room: Room | null; wasHost: boolean } {
        const code = this.playerRooms.get(playerId);
        if (!code) {
            return { room: null, wasHost: false };
        }

        const room = this.rooms.get(code);
        if (!room) {
            this.playerRooms.delete(playerId);
            return { room: null, wasHost: false };
        }

        const playerIndex = room.players.findIndex(p => p.id === playerId);
        if (playerIndex === -1) {
            return { room, wasHost: false };
        }

        const wasHost = room.players[playerIndex].isHost;
        const playerName = room.players[playerIndex].name;
        room.players.splice(playerIndex, 1);
        this.playerRooms.delete(playerId);

        console.log(`[Room] ${playerName} left room ${code}`);

        // Delete room if empty
        if (room.players.length === 0) {
            this.rooms.delete(code);
            console.log(`[Room] Deleted empty room ${code}`);
            return { room: null, wasHost };
        }

        // Transfer host if needed
        if (wasHost && room.players.length > 0) {
            room.players[0].isHost = true;
            room.hostId = room.players[0].id;
            console.log(`[Room] Transferred host to ${room.players[0].name}`);
        }

        return { room, wasHost };
    }

    // Mark player as disconnected (but don't remove yet)
    disconnectPlayer(playerId: string): Room | null {
        const code = this.playerRooms.get(playerId);
        if (!code) return null;

        const room = this.rooms.get(code);
        if (!room) return null;

        const player = room.players.find(p => p.id === playerId);
        if (player) {
            player.isConnected = false;
        }

        return room;
    }

    // Get room by code
    getRoomByCode(code: string): Room | null {
        return this.rooms.get(code.toUpperCase()) || null;
    }

    // Get room by player ID
    getRoomByPlayerId(playerId: string): Room | null {
        const code = this.playerRooms.get(playerId);
        if (!code) return null;
        return this.rooms.get(code) || null;
    }

    // Update room settings
    updateSettings(code: string, settings: Partial<RoomSettings>): Room | null {
        const room = this.rooms.get(code);
        if (!room) return null;

        room.settings = { ...room.settings, ...settings };
        return room;
    }

    // Update game state
    updateGameState(code: string, gameState: GameState | null): Room | null {
        const room = this.rooms.get(code);
        if (!room) return null;

        room.gameState = gameState;
        return room;
    }

    // Get statistics
    getRoomCount(): number {
        return this.rooms.size;
    }

    getTotalPlayerCount(): number {
        let count = 0;
        this.rooms.forEach(room => {
            count += room.players.filter(p => p.isConnected).length;
        });
        return count;
    }

    // Clean up stale rooms (no activity for 30 minutes)
    cleanupStaleRooms(): number {
        const staleThreshold = 30 * 60 * 1000; // 30 minutes
        const now = Date.now();
        let cleaned = 0;

        this.rooms.forEach((room, code) => {
            const hasConnectedPlayers = room.players.some(p => p.isConnected);
            const isStale = now - room.createdAt > staleThreshold;

            if (!hasConnectedPlayers || (isStale && !room.gameState)) {
                this.rooms.delete(code);
                room.players.forEach(p => this.playerRooms.delete(p.id));
                cleaned++;
                console.log(`[Room] Cleaned up stale room ${code}`);
            }
        });

        return cleaned;
    }
}
