// ============================================
// O IMPOSTOR - Local Game Engine
// Pass & Play mode for in-person games
// ============================================

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import type { LocalGameState, LocalPlayer, LocalSettings } from '@advinha/shared/types';

// Types are now imported from shared


interface Category {
    id: string;
    name: string;
    icon: string;
    words: string[];
}

interface CategoriesData {
    categories: Category[];
}

// Load categories data
const __dirname = dirname(fileURLToPath(import.meta.url));
const categoriesPath = join(__dirname, '../../../../data/categories.json');
let categoriesData: CategoriesData;

try {
    categoriesData = JSON.parse(readFileSync(categoriesPath, 'utf-8'));
    console.log(`[LocalGame] Loaded ${categoriesData.categories.length} categories`);
} catch (error) {
    console.error('[LocalGame] Failed to load categories:', error);
    categoriesData = { categories: [] };
}

// Default settings
const defaultLocalSettings: LocalSettings = {
    impostorCount: 1,
    discussionTime: 180, // 3 minutes
    hideCategory: false,
    manualVoting: false, // Default: pass & play voting
    selectedCategories: [], // All categories
};

export class LocalGameEngine {
    private sessions: Map<string, LocalGameState> = new Map();

    // Create a new local session
    createSession(): LocalGameState {
        const sessionId = uuidv4().substring(0, 8).toUpperCase();

        const state: LocalGameState = {
            sessionId,
            phase: 'setup',
            players: [],
            settings: { ...defaultLocalSettings },
            category: null,
            word: null,
            impostorIds: [],
            currentPlayerIndex: 0,
            currentVoterIndex: 0,
            votes: {},
            eliminatedThisRound: null,
            roundNumber: 1,
            winner: null,
            timerEndsAt: null,
        };

        this.sessions.set(sessionId, state);
        console.log(`[LocalGame] Created session ${sessionId}`);
        return state;
    }

    // Get session by ID
    getSession(sessionId: string): LocalGameState | null {
        return this.sessions.get(sessionId) || null;
    }

    // Add player to session
    addPlayer(sessionId: string, name: string): LocalGameState | null {
        const state = this.sessions.get(sessionId);
        if (!state || state.phase !== 'setup') return null;
        if (state.players.length >= 10) return null;

        // Check duplicate name
        if (state.players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
            return null;
        }

        const player: LocalPlayer = {
            id: uuidv4().substring(0, 8),
            name: name.trim(),
            isImpostor: false,
            isEliminated: false,
            hasRevealed: false,
            hasVoted: false,
        };

        state.players.push(player);
        console.log(`[LocalGame] Added player ${name} to session ${sessionId}`);
        return state;
    }

    // Remove player from session
    removePlayer(sessionId: string, playerId: string): LocalGameState | null {
        const state = this.sessions.get(sessionId);
        if (!state || state.phase !== 'setup') return null;

        state.players = state.players.filter(p => p.id !== playerId);
        return state;
    }

    // Shuffle players order
    shufflePlayers(sessionId: string): LocalGameState | null {
        const state = this.sessions.get(sessionId);
        if (!state || state.phase !== 'setup') return null;

        // Fisher-Yates shuffle
        for (let i = state.players.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [state.players[i], state.players[j]] = [state.players[j], state.players[i]];
        }
        return state;
    }

    // Update settings
    updateSettings(sessionId: string, settings: Partial<LocalSettings>): LocalGameState | null {
        const state = this.sessions.get(sessionId);
        if (!state || state.phase !== 'setup') return null;

        state.settings = { ...state.settings, ...settings };
        return state;
    }

    // Start game - assign roles and begin reveal flow
    startGame(sessionId: string): LocalGameState | null {
        const state = this.sessions.get(sessionId);
        if (!state || state.phase !== 'setup') return null;
        if (state.players.length < 3) return null;

        // Reset players
        state.players.forEach(p => {
            p.isImpostor = false;
            p.isEliminated = false;
            p.hasRevealed = false;
            p.hasVoted = false;
        });

        // Select category
        const availableCategories = state.settings.selectedCategories.length > 0
            ? categoriesData.categories.filter(c => state.settings.selectedCategories.includes(c.id))
            : categoriesData.categories;

        if (availableCategories.length === 0) {
            return null;
        }

        const category = availableCategories[Math.floor(Math.random() * availableCategories.length)];
        const word = category.words[Math.floor(Math.random() * category.words.length)];

        state.category = { id: category.id, name: category.name, icon: category.icon };
        state.word = word;

        // Assign impostors
        const impostorCount = Math.min(state.settings.impostorCount, Math.floor(state.players.length / 3));
        const shuffledPlayers = [...state.players].sort(() => Math.random() - 0.5);
        const impostors = shuffledPlayers.slice(0, impostorCount);

        state.impostorIds = impostors.map(p => p.id);
        impostors.forEach(imp => {
            const player = state.players.find(p => p.id === imp.id);
            if (player) player.isImpostor = true;
        });

        // Shuffle order for reveal
        state.players = state.players.sort(() => Math.random() - 0.5);
        state.currentPlayerIndex = 0;
        state.phase = 'category';

        console.log(`[LocalGame] Game started in session ${sessionId} - Word: ${word}, Impostors: ${impostors.map(i => i.name).join(', ')}`);
        return state;
    }

    // Move to pass device phase for reveals
    startRevealPhase(sessionId: string): LocalGameState | null {
        const state = this.sessions.get(sessionId);
        if (!state || state.phase !== 'category') return null;

        state.phase = 'pass_device';
        state.currentPlayerIndex = 0;
        return state;
    }

    // Player is ready to see their role
    playerReady(sessionId: string): LocalGameState | null {
        const state = this.sessions.get(sessionId);
        if (!state || state.phase !== 'pass_device') return null;

        state.phase = 'local_reveal';
        return state;
    }

    // Player confirmed they saw their role
    confirmReveal(sessionId: string): LocalGameState | null {
        const state = this.sessions.get(sessionId);
        if (!state || state.phase !== 'local_reveal') return null;

        const currentPlayer = state.players[state.currentPlayerIndex];
        if (currentPlayer) {
            currentPlayer.hasRevealed = true;
        }

        state.currentPlayerIndex++;

        // Check if all players revealed
        if (state.currentPlayerIndex >= state.players.length) {
            // Start discussion
            state.phase = 'discussion';
            if (state.settings.discussionTime > 0) {
                state.timerEndsAt = Date.now() + state.settings.discussionTime * 1000;
            }
        } else {
            state.phase = 'pass_device';
        }

        return state;
    }

    // Start voting phase
    startVoting(sessionId: string): LocalGameState | null {
        const state = this.sessions.get(sessionId);
        if (!state || state.phase !== 'discussion') return null;

        // Check if manual voting is enabled
        if (state.settings.manualVoting) {
            state.phase = 'host_decision';
            state.timerEndsAt = null;
            return state;
        }

        // Pass & Play Voting Logic
        state.votes = {};
        state.currentVoterIndex = 0;

        // Find first non-eliminated player
        while (state.currentVoterIndex < state.players.length &&
            state.players[state.currentVoterIndex].isEliminated) {
            state.currentVoterIndex++;
        }

        state.phase = 'pass_vote';
        state.timerEndsAt = null;
        return state;
    }

    // Voter is ready to vote
    voterReady(sessionId: string): LocalGameState | null {
        const state = this.sessions.get(sessionId);
        if (!state || state.phase !== 'pass_vote') return null;

        state.phase = 'local_vote';
        return state;
    }

    // Submit vote
    submitVote(sessionId: string, targetId: string): LocalGameState | null {
        const state = this.sessions.get(sessionId);
        if (!state || state.phase !== 'local_vote') return null;

        const voter = state.players[state.currentVoterIndex];
        if (!voter || voter.isEliminated) return null;

        state.votes[voter.id] = targetId;
        voter.hasVoted = true;

        // Move to next voter
        state.currentVoterIndex++;
        while (state.currentVoterIndex < state.players.length &&
            state.players[state.currentVoterIndex].isEliminated) {
            state.currentVoterIndex++;
        }

        // Check if all voted
        if (state.currentVoterIndex >= state.players.length) {
            return this.calculateRoundResult(sessionId);
        } else {
            state.phase = 'pass_vote';
        }

        return state;
    }

    // Host manually eliminates a player (or skips)
    hostEliminate(sessionId: string, targetId: string | null): LocalGameState | null {
        const state = this.sessions.get(sessionId);
        if (!state || state.phase !== 'host_decision') return null;

        if (targetId) {
            const eliminated = state.players.find(p => p.id === targetId);
            if (eliminated) {
                eliminated.isEliminated = true;
                state.eliminatedThisRound = targetId;
            }
        } else {
            state.eliminatedThisRound = null; // Skipped / Tie
        }

        state.phase = 'round_result';
        this.checkWinCondition(state);

        return state;
    }

    // Calculate round result
    private calculateRoundResult(sessionId: string): LocalGameState | null {
        const state = this.sessions.get(sessionId);
        if (!state) return null;

        // Count votes
        const voteCounts: Record<string, number> = {};
        Object.values(state.votes).forEach(targetId => {
            voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
        });

        // Find most voted
        let maxVotes = 0;
        let mostVotedId = '';
        Object.entries(voteCounts).forEach(([id, count]) => {
            if (count > maxVotes) {
                maxVotes = count;
                mostVotedId = id;
            }
        });

        // Eliminate most voted
        if (mostVotedId) {
            const eliminated = state.players.find(p => p.id === mostVotedId);
            if (eliminated) {
                eliminated.isEliminated = true;
                state.eliminatedThisRound = mostVotedId;
            }
        }

        state.phase = 'round_result';

        // Check win conditions
        this.checkWinCondition(state);

        return state;
    }

    // Check if game is over
    private checkWinCondition(state: LocalGameState): void {
        const alivePlayers = state.players.filter(p => !p.isEliminated);
        const aliveImpostors = alivePlayers.filter(p => p.isImpostor);
        const aliveInnocents = alivePlayers.filter(p => !p.isImpostor);

        if (aliveImpostors.length === 0) {
            // All impostors eliminated - players win
            state.winner = 'players';
            state.phase = 'game_result';
        } else if (aliveImpostors.length >= aliveInnocents.length) {
            // Impostors equal or outnumber innocents - impostors win
            state.winner = 'impostors';
            state.phase = 'game_result';
        }
    }

    // Continue to next round (or game result)
    continueGame(sessionId: string): LocalGameState | null {
        const state = this.sessions.get(sessionId);
        if (!state || state.phase !== 'round_result') return null;

        if (state.winner) {
            state.phase = 'game_result';
            return state;
        }

        // Reset for next round
        state.roundNumber++;
        state.eliminatedThisRound = null;
        state.votes = {};
        state.currentVoterIndex = 0;
        state.players.forEach(p => {
            if (!p.isEliminated) {
                p.hasVoted = false;
            }
        });

        // Go back to discussion
        state.phase = 'discussion';
        if (state.settings.discussionTime > 0) {
            state.timerEndsAt = Date.now() + state.settings.discussionTime * 1000;
        }

        return state;
    }

    // Play again with same players
    playAgain(sessionId: string): LocalGameState | null {
        const state = this.sessions.get(sessionId);
        if (!state) return null;

        // Reset state but keep players
        const players = state.players.map(p => ({
            ...p,
            isImpostor: false,
            isEliminated: false,
            hasRevealed: false,
            hasVoted: false,
        }));

        state.players = players;
        state.phase = 'setup';
        state.category = null;
        state.word = null;
        state.impostorIds = [];
        state.currentPlayerIndex = 0;
        state.currentVoterIndex = 0;
        state.votes = {};
        state.eliminatedThisRound = null;
        state.roundNumber = 1;
        state.winner = null;
        state.timerEndsAt = null;

        return state;
    }

    // Delete session
    deleteSession(sessionId: string): void {
        this.sessions.delete(sessionId);
        console.log(`[LocalGame] Deleted session ${sessionId}`);
    }

    // Get all categories for settings
    getCategories(): { id: string; name: string; icon: string }[] {
        return categoriesData.categories.map(c => ({
            id: c.id,
            name: c.name,
            icon: c.icon,
        }));
    }
}

// Singleton instance
export const localGameEngine = new LocalGameEngine();
