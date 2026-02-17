/**
 * Calculate the Levenshtein distance between two strings
 * Used for fuzzy matching in massmove command
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;

  // Create a 2D array to store distances
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0) as number[]);

  // Initialize base cases
  for (let i = 0; i <= m; i++) {
    dp[i]![0] = i;
  }
  for (let j = 0; j <= n; j++) {
    dp[0]![j] = j;
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i]![j] = dp[i - 1]![j - 1]!;
      } else {
        dp[i]![j] = 1 + Math.min(
          dp[i - 1]![j]!,      // deletion
          dp[i]![j - 1]!,      // insertion
          dp[i - 1]![j - 1]!   // substitution
        );
      }
    }
  }

  return dp[m]![n]!;
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
