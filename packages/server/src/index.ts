// ============================================
// ADVINHA - Main Server Entry Point
// Express + Socket.io server for multiplayer
// ============================================

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { setupSocketHandlers } from './socket/handlers.js';
import { RoomManager } from './rooms/RoomManager.js';

const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Create Express app
const app = express();
app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

// Create HTTP server
const httpServer = createServer(app);

// Create Socket.io server
const io = new Server(httpServer, {
    cors: {
        origin: CLIENT_URL,
        methods: ['GET', 'POST'],
    },
});

// Initialize room manager
const roomManager = new RoomManager();

// Health check endpoint
app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        rooms: roomManager.getRoomCount(),
        players: roomManager.getTotalPlayerCount(),
        uptime: process.uptime(),
    });
});

// API endpoint to check room exists
app.get('/api/rooms/:code', (req, res) => {
    const room = roomManager.getRoomByCode(req.params.code.toUpperCase());
    if (room) {
        res.json({
            exists: true,
            playerCount: room.players.length,
            maxPlayers: room.settings.maxPlayers,
        });
    } else {
        res.json({ exists: false });
    }
});

// Setup socket handlers
setupSocketHandlers(io, roomManager);

// Start server
httpServer.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║   🎭  ADVINHA - Quem é o Impostor?               ║
║                                                   ║
║   Server running on port ${PORT}                    ║
║   Accepting connections from ${CLIENT_URL}   ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    httpServer.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});
