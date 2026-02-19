/**
 * Levenshtein Distance Utility Tests
 */

import { describe, expect, it } from 'vitest';
import { findBestMatch, levenshteinDistance, similarityRatio } from './levenshtein.js';

describe('levenshteinDistance', () => {
  it('should return 0 for identical strings', () => {
    expect(levenshteinDistance('hello', 'hello')).toBe(0);
    expect(levenshteinDistance('', '')).toBe(0);
    expect(levenshteinDistance('test', 'test')).toBe(0);
  });

  it('should return correct distance for insertions', () => {
    expect(levenshteinDistance('', 'abc')).toBe(3);
    expect(levenshteinDistance('a', 'ab')).toBe(1);
    expect(levenshteinDistance('cat', 'cats')).toBe(1);
  });

  it('should return correct distance for deletions', () => {
    expect(levenshteinDistance('abc', '')).toBe(3);
    expect(levenshteinDistance('ab', 'a')).toBe(1);
    expect(levenshteinDistance('cats', 'cat')).toBe(1);
  });

  it('should return correct distance for substitutions', () => {
    expect(levenshteinDistance('cat', 'bat')).toBe(1);
    expect(levenshteinDistance('hello', 'hallo')).toBe(1);
    expect(levenshteinDistance('abc', 'xyz')).toBe(3);
  });

  it('should return correct distance for complex edits', () => {
    expect(levenshteinDistance('kitten', 'sitting')).toBe(3);
    expect(levenshteinDistance('saturday', 'sunday')).toBe(3);
    expect(levenshteinDistance('intention', 'execution')).toBe(5);
  });

  it('should handle single character strings', () => {
    expect(levenshteinDistance('a', 'b')).toBe(1);
    expect(levenshteinDistance('a', 'a')).toBe(0);
    expect(levenshteinDistance('a', '')).toBe(1);
    expect(levenshteinDistance('', 'a')).toBe(1);
  });
});

describe('similarityRatio', () => {
  it('should return 1 for identical strings', () => {
    expect(similarityRatio('hello', 'hello')).toBe(1);
    expect(similarityRatio('test', 'test')).toBe(1);
  });

  it('should return 1 for two empty strings', () => {
    expect(similarityRatio('', '')).toBe(1);
  });

  it('should return 0 for completely different strings of same length', () => {
    expect(similarityRatio('abc', 'xyz')).toBe(0);
  });

  it('should return a ratio between 0 and 1 for partially similar strings', () => {
    const ratio = similarityRatio('hello', 'hallo');
    expect(ratio).toBeGreaterThan(0);
    expect(ratio).toBeLessThan(1);
    expect(ratio).toBe(0.8); // 1 edit out of 5 characters
  });

  it('should be case-insensitive', () => {
    expect(similarityRatio('Hello', 'hello')).toBe(1);
    expect(similarityRatio('HELLO', 'hello')).toBe(1);
    expect(similarityRatio('HeLLo', 'hEllO')).toBe(1);
  });

  it('should handle empty string comparison', () => {
    expect(similarityRatio('hello', '')).toBe(0);
    expect(similarityRatio('', 'hello')).toBe(0);
  });
});

describe('findBestMatch', () => {
  const candidates = ['General', 'Gaming', 'Music', 'Study', 'AFK'];

  it('should find exact match', () => {
    const result = findBestMatch('General', candidates);
    expect(result.match).toBe('General');
    expect(result.score).toBe(1);
  });

  it('should find case-insensitive match', () => {
    const result = findBestMatch('general', candidates);
    expect(result.match).toBe('General');
    expect(result.score).toBe(1);
  });

  it('should find best fuzzy match', () => {
    const result = findBestMatch('Generl', candidates);
    expect(result.match).toBe('General');
    expect(result.score).toBeGreaterThan(0.8);
  });

  it('should return null if no match above threshold', () => {
    const result = findBestMatch('XYZ123', candidates);
    expect(result.match).toBeNull();
    expect(result.score).toBe(0);
  });

  it('should respect custom threshold', () => {
    const result = findBestMatch('Gen', candidates, 0.9);
    expect(result.match).toBeNull(); // Not above 90% similarity

    const resultLower = findBestMatch('Gen', candidates, 0.3);
    expect(resultLower.match).toBe('General'); // Above 30% similarity
  });

  it('should handle empty candidates array', () => {
    const result = findBestMatch('test', []);
    expect(result.match).toBeNull();
    expect(result.score).toBe(0);
  });

  it('should find best match among multiple similar options', () => {
    const voiceChannels = ['General Voice', 'General Chat', 'General Gaming'];
    const result = findBestMatch('General Voice', voiceChannels);
    expect(result.match).toBe('General Voice');
    expect(result.score).toBe(1);
  });

  it('should return the most similar when multiple partial matches exist', () => {
    const voiceChannels = ['Voice 1', 'Voice 2', 'Voice 10', 'Voice 11'];
    const result = findBestMatch('Voice 1', voiceChannels);
    expect(result.match).toBe('Voice 1');
  });
});
