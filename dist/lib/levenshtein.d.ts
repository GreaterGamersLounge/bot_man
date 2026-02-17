/**
 * Calculate the Levenshtein distance between two strings
 * Used for fuzzy matching in massmove command
 */
export declare function levenshteinDistance(str1: string, str2: string): number;
/**
 * Calculate similarity ratio between two strings (0-1)
 */
export declare function similarityRatio(str1: string, str2: string): number;
/**
 * Find the best match for a string from a list of candidates
 */
export declare function findBestMatch(target: string, candidates: string[], threshold?: number): {
    match: string | null;
    score: number;
};
//# sourceMappingURL=levenshtein.d.ts.map