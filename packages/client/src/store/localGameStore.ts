// ============================================
// O IMPOSTOR - Local Game Store (Zustand)
// State management for "Estamos Juntos" mode
// ============================================

import { create } from 'zustand';

// Category type matching categories.json
interface Category {
    id: string;
    name: string;
    icon: string;
    words: string[];
}

// Player in local game
interface LocalPlayer {
    id: string;
    name: string;
    hasRevealed: boolean;
    isImpostor: boolean;
}

// Game phases
type LocalPhase = 'setup' | 'category' | 'reveal' | 'discussion' | 'voting' | 'results';

// Vote result
interface VoteResult {
    mostVotedId: string;
    mostVotedName: string;
    voteCount: number;
    isImpostor: boolean;
    impostorName: string;
    impostorWin: boolean;
}

interface LocalGameStore {
    // State
    players: LocalPlayer[];
    categories: Category[];
    category: Category | null;
    word: string | null;
    impostorId: string | null;
    phase: LocalPhase;
    votes: Record<string, string>; // voterId -> targetId
    currentVoterIndex: number;
    voteResult: VoteResult | null;
    revealingPlayerId: string | null;
    showWord: boolean; // false = showing category, true = showing word

    // Actions
    loadCategories: () => Promise<void>;
    addPlayer: (name: string) => boolean;
    removePlayer: (id: string) => void;
    startGame: () => void;
    showCategory: () => void;
    startReveal: (playerId: string) => void;
    revealWord: () => void;
    hideReveal: () => void;
    startDiscussion: () => void;
    startVoting: () => void;
    vote: (targetId: string) => void;
    showResults: () => void;
    nextRound: () => void;
    reset: () => void;
}

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 9);

export const useLocalGameStore = create<LocalGameStore>((set, get) => ({
    // Initial state
    players: [],
    categories: [],
    category: null,
    word: null,
    impostorId: null,
    phase: 'setup',
    votes: {},
    currentVoterIndex: 0,
    voteResult: null,
    revealingPlayerId: null,
    showWord: false,

    // Load categories from JSON
    loadCategories: async () => {
        try {
            const response = await fetch('/data/categories.json');
            const data = await response.json();
            set({ categories: data.categories });
        } catch (error) {
            console.error('Failed to load categories:', error);
            // Fallback with minimal categories
            set({
                categories: [
                    {
                        id: 'animais',
                        name: 'Animais',
                        icon: '🐾',
                        words: ['Cachorro', 'Gato', 'Elefante', 'Leão', 'Macaco', 'Girafa']
                    },
                    {
                        id: 'comidas',
                        name: 'Comidas',
                        icon: '🍕',
                        words: ['Pizza', 'Hambúrguer', 'Sushi', 'Churrasco', 'Sorvete', 'Bolo']
                    }
                ]
            });
        }
    },

    // Add player (returns false if name empty or duplicate)
    addPlayer: (name) => {
        const trimmedName = name.trim();
        if (!trimmedName) return false;

        const { players } = get();

        // Check duplicate
        if (players.some(p => p.name.toLowerCase() === trimmedName.toLowerCase())) {
            return false;
        }

        // Max 10 players
        if (players.length >= 10) return false;

        set({
            players: [
                ...players,
                {
                    id: generateId(),
                    name: trimmedName,
                    hasRevealed: false,
                    isImpostor: false
                }
            ]
        });
        return true;
    },

    // Remove player
    removePlayer: (id) => {
        set({ players: get().players.filter(p => p.id !== id) });
    },

    // Start game - pick category, word, and impostor
    startGame: () => {
        const { players, categories } = get();
        if (players.length < 3 || categories.length === 0) return;

        // Pick random category
        const category = categories[Math.floor(Math.random() * categories.length)];

        // Pick random word from category
        const word = category.words[Math.floor(Math.random() * category.words.length)];

        // Pick random impostor
        const impostorIndex = Math.floor(Math.random() * players.length);
        const impostorId = players[impostorIndex].id;

        // Mark impostor
        const updatedPlayers = players.map(p => ({
            ...p,
            hasRevealed: false,
            isImpostor: p.id === impostorId
        }));

        set({
            category,
            word,
            impostorId,
            players: updatedPlayers,
            phase: 'category',
            votes: {},
            currentVoterIndex: 0,
            voteResult: null
        });
    },

    // Show category phase
    showCategory: () => {
        set({ phase: 'reveal' });
    },

    // Start revealing for a specific player
    startReveal: (playerId) => {
        set({
            revealingPlayerId: playerId,
            showWord: false
        });
    },

    // Show the word (after showing category)
    revealWord: () => {
        set({ showWord: true });
    },

    // Hide reveal and mark player as revealed
    hideReveal: () => {
        const { revealingPlayerId, players } = get();

        set({
            revealingPlayerId: null,
            showWord: false,
            players: players.map(p =>
                p.id === revealingPlayerId
                    ? { ...p, hasRevealed: true }
                    : p
            )
        });
    },

    // Start discussion phase
    startDiscussion: () => {
        set({ phase: 'discussion' });
    },

    // Start voting phase
    startVoting: () => {
        set({
            phase: 'voting',
            votes: {},
            currentVoterIndex: 0
        });
    },

    // Vote for a player
    vote: (targetId) => {
        const { players, currentVoterIndex, votes } = get();
        const voter = players[currentVoterIndex];

        if (!voter) return;

        const newVotes = { ...votes, [voter.id]: targetId };
        const nextIndex = currentVoterIndex + 1;

        set({
            votes: newVotes,
            currentVoterIndex: nextIndex
        });

        // If all voted, show results
        if (nextIndex >= players.length) {
            get().showResults();
        }
    },

    // Calculate and show results
    showResults: () => {
        const { players, votes, impostorId } = get();

        // Count votes
        const voteCounts: Record<string, number> = {};
        Object.values(votes).forEach(targetId => {
            voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
        });

        // Find most voted
        let mostVotedId = '';
        let maxVotes = 0;
        Object.entries(voteCounts).forEach(([id, count]) => {
            if (count > maxVotes) {
                maxVotes = count;
                mostVotedId = id;
            }
        });

        const mostVoted = players.find(p => p.id === mostVotedId);
        const impostor = players.find(p => p.id === impostorId);

        set({
            phase: 'results',
            voteResult: {
                mostVotedId,
                mostVotedName: mostVoted?.name || 'Ninguém',
                voteCount: maxVotes,
                isImpostor: mostVotedId === impostorId,
                impostorName: impostor?.name || '',
                impostorWin: mostVotedId !== impostorId
            }
        });
    },

    // Start next round (keep players, new game)
    nextRound: () => {
        const { players, categories } = get();

        // Pick new category and word
        const category = categories[Math.floor(Math.random() * categories.length)];
        const word = category.words[Math.floor(Math.random() * category.words.length)];

        // Pick new impostor
        const impostorIndex = Math.floor(Math.random() * players.length);
        const impostorId = players[impostorIndex].id;

        const updatedPlayers = players.map(p => ({
            ...p,
            hasRevealed: false,
            isImpostor: p.id === impostorId
        }));

        set({
            category,
            word,
            impostorId,
            players: updatedPlayers,
            phase: 'category',
            votes: {},
            currentVoterIndex: 0,
            voteResult: null,
            revealingPlayerId: null,
            showWord: false
        });
    },

    // Full reset
    reset: () => {
        set({
            players: [],
            category: null,
            word: null,
            impostorId: null,
            phase: 'setup',
            votes: {},
            currentVoterIndex: 0,
            voteResult: null,
            revealingPlayerId: null,
            showWord: false
        });
    }
}));
