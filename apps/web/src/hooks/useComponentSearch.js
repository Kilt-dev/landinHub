import { useMemo, useState, useCallback } from 'react';

/**
 * Custom hook for fuzzy search in component library
 * Features:
 * - Fuzzy matching (e.g., "btn" matches "button")
 * - Search by name, category, tags
 * - Highlight matches
 * - Recent searches
 */

// Simple fuzzy match algorithm
const fuzzyMatch = (searchTerm, text) => {
    if (!searchTerm || !text) return false;

    const search = searchTerm.toLowerCase();
    const target = text.toLowerCase();

    // Exact match gets highest score
    if (target.includes(search)) return true;

    // Check if all letters of search appear in order in target
    let searchIndex = 0;
    for (let i = 0; i < target.length && searchIndex < search.length; i++) {
        if (target[i] === search[searchIndex]) {
            searchIndex++;
        }
    }

    return searchIndex === search.length;
};

// Calculate match score (higher is better)
const getMatchScore = (searchTerm, item) => {
    if (!searchTerm) return 0;

    const search = searchTerm.toLowerCase();
    let score = 0;

    // Exact name match
    if (item.name.toLowerCase() === search) {
        score += 100;
    } else if (item.name.toLowerCase().includes(search)) {
        score += 50;
    } else if (fuzzyMatch(search, item.name)) {
        score += 25;
    }

    // Category match
    if (item.category && fuzzyMatch(search, item.category)) {
        score += 10;
    }

    // Tags match
    if (item.tags && Array.isArray(item.tags)) {
        item.tags.forEach(tag => {
            if (fuzzyMatch(search, tag)) {
                score += 5;
            }
        });
    }

    // Type match
    if (item.json?.type && fuzzyMatch(search, item.json.type)) {
        score += 10;
    }

    return score;
};

export const useComponentSearch = (allComponents = []) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [recentSearches, setRecentSearches] = useState([]);

    /**
     * Search components with fuzzy matching
     */
    const searchResults = useMemo(() => {
        if (!searchTerm.trim()) {
            return allComponents;
        }

        // Get matches with scores
        const matches = allComponents
            .map(item => ({
                ...item,
                score: getMatchScore(searchTerm, item)
            }))
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score); // Sort by score descending

        return matches;
    }, [searchTerm, allComponents]);

    /**
     * Update search term and save to recent
     */
    const updateSearch = useCallback((term) => {
        setSearchTerm(term);

        if (term.trim() && term.length >= 2) {
            setRecentSearches(prev => {
                const updated = [term, ...prev.filter(s => s !== term)];
                return updated.slice(0, 10); // Keep last 10 searches
            });
        }
    }, []);

    /**
     * Clear search
     */
    const clearSearch = useCallback(() => {
        setSearchTerm('');
    }, []);

    /**
     * Get highlighted text for match visualization
     */
    const getHighlightedText = useCallback((text, highlight) => {
        if (!highlight.trim()) return text;

        const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
        return parts.map((part, index) =>
            part.toLowerCase() === highlight.toLowerCase()
                ? `<mark key="${index}">${part}</mark>`
                : part
        ).join('');
    }, []);

    return {
        searchTerm,
        setSearchTerm: updateSearch,
        clearSearch,
        searchResults,
        recentSearches,
        getHighlightedText,
        hasResults: searchResults.length > 0,
        resultCount: searchResults.length
    };
};
