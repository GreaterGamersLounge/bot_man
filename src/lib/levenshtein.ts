/**
 * Calculate the Levenshtein distance between two strings
 * Used for fuzzy matching in massmove command
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;

  // Create a 2D array to store distances - we use (m+1) x (n+1)
  // Using a flat array with helper function for cleaner code
  const dp: number[] = new Array((m + 1) * (n + 1)).fill(0) as number[];

  const get = (i: number, j: number): number => dp[i * (n + 1) + j] ?? 0;
  const set = (i: number, j: number, val: number): void => {
    dp[i * (n + 1) + j] = val;
  };

  // Initialize base cases
  for (let i = 0; i <= m; i++) {
    set(i, 0, i);
  }
  for (let j = 0; j <= n; j++) {
    set(0, j, j);
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        set(i, j, get(i - 1, j - 1));
      } else {
        set(
          i,
          j,
          1 +
            Math.min(
              get(i - 1, j), // deletion
              get(i, j - 1), // insertion
              get(i - 1, j - 1) // substitution
            )
        );
      }
    }
  }

  return get(m, n);
}

/**
 * Calculate similarity ratio between two strings (0-1)
 */
export function similarityRatio(str1: string, str2: string): number {
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) {
    return 1;
  }
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  return 1 - distance / maxLength;
}

/**
 * Find the best match for a string from a list of candidates
 */
export function findBestMatch(
  target: string,
  candidates: string[],
  threshold = 0.6
): { match: string | null; score: number } {
  let bestMatch: string | null = null;
  let bestScore = 0;

  for (const candidate of candidates) {
    const score = similarityRatio(target, candidate);
    if (score > bestScore && score >= threshold) {
      bestScore = score;
      bestMatch = candidate;
    }
  }

  return { match: bestMatch, score: bestScore };
}

/**
 * Alias for levenshteinDistance for backward compatibility
 */
export const levenshtein = levenshteinDistance;
