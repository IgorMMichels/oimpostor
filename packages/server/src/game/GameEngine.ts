// ============================================
// ADVINHA - Game Engine
// Core game logic: rounds, hints, impostor, scoring
// ============================================

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
    type Room,
    type GameState,
    type GamePhase,
    type Category,
    type CategoriesData,
    type RoleAssignment,
    type GameResults,
    type ChatMessage,
    type HintEntry,
    TIMERS,
} from '@advinha/shared/types';

// Scoring constants
const scoring = {
    CORRECT_VOTE: 100,
    SURVIVED_INNOCENT: 50,
    IMPOSTOR_SURVIVED: 200,
    IMPOSTOR_CAUGHT: 25,
    GAME_COMPLETED: 10,
};

// Load categories data
const __dirname = dirname(fileURLToPath(import.meta.url));
const categoriesPath = join(__dirname, '../../../../data/categories.json');
let categoriesData: CategoriesData;

try {
    categoriesData = JSON.parse(readFileSync(categoriesPath, 'utf-8'));
    console.log(`[Game] Loaded ${categoriesData.categories.length} categories`);
} catch (error) {
    console.error('[Game] Failed to load categories:', error);
    categoriesData = { categories: [] };
}

export class GameEngine {
    private room: Room;
    private usedCategories: Set<string> = new Set();
    private usedWords: Map<string, Set<string>> = new Map();

    constructor(room: Room) {
        this.room = room;
    }

    // Initialize a new game
    initializeGame(): GameState {
        // Create turn order (shuffle players)
        const playerIds = this.room.players.map(p => p.id);
        const shuffledOrder = this.shuffleArray([...playerIds]);

        const state: GameState = {
            phase: 'spinning_category',
            currentRound: 1,
            totalRounds: this.room.settings.roundsPerGame,
            category: null,
            word: null,
            impostorId: null,
            votes: {},
            roundScores: {},
            totalScores: {},
            chatMessages: [],
            timerEndsAt: null,
            lastCategoryId: null,
            lastWord: null,
            // New hint round fields
            hintRound: 0,
            hints: [],
            turnOrder: shuffledOrder,
            currentTurnIndex: 0,
            decisionVotes: {},
        };

        // Initialize scores for all players
        this.room.players.forEach(player => {
            state.totalScores[player.id] = 0;
            state.roundScores[player.id] = 0;
        });

        return state;
    }

    // Shuffle array (Fisher-Yates)
    private shuffleArray<T>(array: T[]): T[] {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // Select random category (avoiding last used)
    selectCategory(lastCategoryId: string | null): Category {
        const available = categoriesData.categories.filter(
            cat => cat.id !== lastCategoryId
        );

        if (available.length === 0) {
            return categoriesData.categories[0];
        }

        const randomIndex = Math.floor(Math.random() * available.length);
        return available[randomIndex];
    }

    // Select random word from category (avoiding last used)
    selectWord(category: Category, lastWord: string | null): string {
        const usedInCategory = this.usedWords.get(category.id) || new Set();

        let available = category.words.filter(
            word => word !== lastWord && !usedInCategory.has(word)
        );

        if (available.length < 5) {
            this.usedWords.set(category.id, new Set());
            available = category.words.filter(word => word !== lastWord);
        }

        const randomIndex = Math.floor(Math.random() * available.length);
        const selectedWord = available[randomIndex];

        if (!this.usedWords.has(category.id)) {
            this.usedWords.set(category.id, new Set());
        }
        this.usedWords.get(category.id)!.add(selectedWord);

        return selectedWord;
    }

    // Select random impostor
    selectImpostor(playerIds: string[]): string {
        const randomIndex = Math.floor(Math.random() * playerIds.length);
        return playerIds[randomIndex];
    }

    // Generate role assignments for all players
    assignRoles(
        state: GameState,
        playerIds: string[]
    ): Map<string, RoleAssignment> {
        const category = this.selectCategory(state.lastCategoryId);
        const word = this.selectWord(category, state.lastWord);
        const impostorId = this.selectImpostor(playerIds);

        state.category = category;
        state.word = word;
        state.impostorId = impostorId;
        state.lastCategoryId = category.id;
        state.lastWord = word;

        const assignments = new Map<string, RoleAssignment>();

        playerIds.forEach(playerId => {
            const isImpostor = playerId === impostorId;
            assignments.set(playerId, {
                isImpostor,
                category,
                word: isImpostor ? null : word,
            });
        });

        return assignments;
    }

    // Start hint round
    startHintRound(state: GameState): void {
        state.phase = 'hint_round';
        state.hintRound++;
        state.currentTurnIndex = 0;
        // Shuffle turn order each hint round for fairness
        state.turnOrder = this.shuffleArray([...state.turnOrder]);
    }

    // Get current player's turn
    getCurrentTurnPlayerId(state: GameState): string | null {
        if (state.currentTurnIndex >= state.turnOrder.length) {
            return null;
        }
        return state.turnOrder[state.currentTurnIndex];
    }

    // Submit a hint
    submitHint(
        state: GameState,
        playerId: string,
        playerName: string,
        hint: string
    ): HintEntry | null {
        // Verify it's this player's turn
        if (this.getCurrentTurnPlayerId(state) !== playerId) {
            return null;
        }

        // Filter out the secret word from hint
        const filteredHint = this.filterSecretWord(hint, state.word);

        const entry: HintEntry = {
            playerId,
            playerName,
            hint: filteredHint.substring(0, 100), // Limit length
            round: state.hintRound,
        };

        state.hints.push(entry);
        state.currentTurnIndex++;

        return entry;
    }

    // Check if hint round is complete
    isHintRoundComplete(state: GameState): boolean {
        return state.currentTurnIndex >= state.turnOrder.length;
    }

    // Start vote decision phase (15 seconds)
    startVoteDecision(state: GameState): void {
        state.phase = 'vote_decision';
        state.timerEndsAt = this.calculateTimerEnd(TIMERS.VOTE_DECISION);
        state.decisionVotes = {}; // Reset votes
    }

    // Submit a vote decision (vote vs continue)
    submitVoteDecision(
        state: GameState,
        playerId: string,
        decision: 'vote' | 'continue'
    ): boolean {
        // Initialize if missing
        if (!state.decisionVotes) {
            state.decisionVotes = {};
        }

        // Record vote
        state.decisionVotes[playerId] = decision;
        return true;
    }

    // Check if decision voting is complete
    checkVoteDecisionCompletion(state: GameState, playerCount: number): 'vote' | 'continue' | null {
        const votes = state.decisionVotes || {};
        const voteCount = Object.keys(votes).length;

        // If not everyone voted, wait (unless timer handles force end)
        if (voteCount < playerCount) {
            return null;
        }

        // Tally votes
        let voteNowCount = 0;
        let continueCount = 0;

        Object.values(votes).forEach(decision => {
            if (decision === 'vote') voteNowCount++;
            else continueCount++;
        });

        // Majority rules. Tie = Continue (more hints is safer/default)
        if (voteNowCount > continueCount) {
            return 'vote';
        } else {
            return 'continue';
        }
    }

    // Filter out secret word from text
    filterSecretWord(text: string, secretWord: string | null): string {
        if (!secretWord) return text;

        // Create regex that matches the word (case insensitive)
        const regex = new RegExp(
            secretWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
            'gi'
        );

        return text.replace(regex, '***');
    }

    // Process a vote
    processVote(state: GameState, voterId: string, targetId: string): boolean {
        if (voterId === targetId) return false;
        if (state.votes[voterId]) return false;

        state.votes[voterId] = targetId;
        return true;
    }

    // Check if all votes are in
    allVotesReceived(state: GameState, playerCount: number): boolean {
        return Object.keys(state.votes).length >= playerCount;
    }

    // Calculate round results
    calculateResults(state: GameState): GameResults {
        const impostorId = state.impostorId!;

        const voteCounts: Record<string, number> = {};
        Object.values(state.votes).forEach(targetId => {
            voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
        });

        const maxVotes = Math.max(...Object.values(voteCounts), 0);
        const mostVotedPlayers = Object.entries(voteCounts)
            .filter(([_, count]) => count === maxVotes)
            .map(([playerId]) => playerId);

        const impostorCaught =
            mostVotedPlayers.length === 1 && mostVotedPlayers[0] === impostorId;

        const roundScores: Record<string, number> = {};

        Object.keys(state.totalScores).forEach(playerId => {
            let points = scoring.GAME_COMPLETED;

            if (playerId === impostorId) {
                points += impostorCaught ? scoring.IMPOSTOR_CAUGHT : scoring.IMPOSTOR_SURVIVED;
            } else {
                if (state.votes[playerId] === impostorId) {
                    points += scoring.CORRECT_VOTE;
                }
                if (!Object.values(state.votes).includes(playerId)) {
                    points += scoring.SURVIVED_INNOCENT;
                }
            }

            roundScores[playerId] = points;
            state.roundScores[playerId] = points;
            state.totalScores[playerId] += points;
        });

        const isGameOver = state.currentRound >= state.totalRounds;

        return {
            impostorId,
            impostorCaught,
            roundScores,
            totalScores: state.totalScores,
            isGameOver,
        };
    }

    // Start next round
    startNextRound(state: GameState): GameState {
        state.currentRound++;
        state.phase = 'spinning_category';
        state.category = null;
        state.word = null;
        state.impostorId = null;
        state.votes = {};
        state.roundScores = {};
        state.chatMessages = [];
        state.timerEndsAt = null;
        // Reset hint data
        state.hintRound = 0;
        state.hints = [];
        state.currentTurnIndex = 0;
        // Re-shuffle turn order
        state.turnOrder = this.shuffleArray([...state.turnOrder]);

        return state;
    }

    // Add chat message (with word filter)
    addChatMessage(
        state: GameState,
        playerId: string,
        playerName: string,
        content: string
    ): ChatMessage {
        // Filter secret word from chat
        const filteredContent = this.filterSecretWord(content, state.word);

        const message: ChatMessage = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            playerId,
            playerName,
            content: filteredContent.substring(0, 500),
            timestamp: Date.now(),
        };

        state.chatMessages.push(message);

        if (state.chatMessages.length > 100) {
            state.chatMessages = state.chatMessages.slice(-100);
        }

        return message;
    }

    // Get timer end time
    calculateTimerEnd(durationSeconds: number): number {
        return Date.now() + durationSeconds * 1000;
    }

    // Start voting phase
    startVoting(state: GameState): void {
        state.phase = 'voting';
        state.timerEndsAt = this.calculateTimerEnd(TIMERS.VOTING);
        state.votes = {};
    }
}

// Export categories for spinner animation
export function getCategories(): Category[] {
    return categoriesData.categories;
}

export function getCategoryById(id: string): Category | undefined {
    return categoriesData.categories.find(cat => cat.id === id);
}
