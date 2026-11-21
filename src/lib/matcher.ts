import { BIBLE_VERSES, Verse } from "./bible-data";

export interface MatchResult extends Verse {
  confidence: number;
}

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "if", "because", "as", "until",
  "while", "of", "at", "by", "for", "with", "about", "against", "between",
  "into", "through", "during", "before", "after", "above", "below", "to",
  "from", "up", "down", "in", "out", "on", "off", "over", "under", "again",
  "further", "then", "once", "here", "there", "when", "where", "why", "how",
  "all", "any", "both", "each", "few", "more", "most", "other", "some",
  "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too",
  "very", "s", "t", "can", "will", "just", "don", "should", "now", "be",
  "is", "am", "are", "was", "were", "been", "being", "have", "has", "had",
  "do", "does", "did", "unto", "thee", "thou", "thy", "thine", "ye"
]);

export function cleanWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s']/g, " ")
    .split(/\s+/)
    .map(w => w.replace(/^'+|'+$/g, "")) // trim outer apostrophes
    .filter(w => w.length > 0);
}

// Levenshtein edit distance for fuzzy word matching
export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const val = Math.min(row[j] + 1, prev + 1, row[j - 1] + cost);
      row[j - 1] = prev;
      prev = val;
    }
    row[b.length] = prev;
  }
  return row[b.length];
}

// Check if two words are a fuzzy match
function isWordFuzzyMatch(queryWord: string, targetWord: string): { matches: boolean; weight: number } {
  if (queryWord === targetWord) {
    return { matches: true, weight: 1.0 };
  }

  // Prefix match (e.g. "shepherd" and "shepherds", "love" and "loved")
  if (queryWord.length >= 4 && targetWord.length >= 4) {
    if (queryWord.startsWith(targetWord) || targetWord.startsWith(queryWord)) {
      return { matches: true, weight: 0.9 };
    }
  }

  const maxLen = Math.max(queryWord.length, targetWord.length);
  if (maxLen <= 3) return { matches: false, weight: 0 };

  const dist = levenshteinDistance(queryWord, targetWord);
  const similarity = 1 - dist / maxLen;

  // Allow 1 edit for 4-5 letter words, up to 2 edits for 6+ letters
  const maxAllowedDist = maxLen <= 5 ? 1 : 2;
  if (dist <= maxAllowedDist && similarity >= 0.72) {
    return { matches: true, weight: similarity };
  }

  return { matches: false, weight: 0 };
}

// Compute score between a query and a verse text
export function scoreVerse(queryWords: string[], verseText: string): number {
  const verseWords = cleanWords(verseText);
  if (verseWords.length === 0 || queryWords.length === 0) return 0;

  const verseWordSet = new Set(verseWords);
  let totalMatchWeight = 0;
  let matchedIndices: number[] = [];

  for (const qWord of queryWords) {
    // Exact set match
    if (verseWordSet.has(qWord)) {
      totalMatchWeight += 1.0;
      const idx = verseWords.indexOf(qWord);
      if (idx !== -1) matchedIndices.push(idx);
      continue;
    }

    // Fuzzy match against verse words
    let bestWeight = 0;
    let bestIdx = -1;
    for (let i = 0; i < verseWords.length; i++) {
      const { matches, weight } = isWordFuzzyMatch(qWord, verseWords[i]);
      if (matches && weight > bestWeight) {
        bestWeight = weight;
        bestIdx = i;
      }
    }

    if (bestWeight > 0) {
      totalMatchWeight += bestWeight;
      matchedIndices.push(bestIdx);
    }
  }

  // Base score from query keyword coverage
  let coverageScore = (totalMatchWeight / queryWords.length) * 85;

  // Bonus for consecutive sequence ordering
  let sequenceBonus = 0;
  if (matchedIndices.length >= 2) {
    let orderedPairs = 0;
    for (let i = 0; i < matchedIndices.length - 1; i++) {
      if (matchedIndices[i] < matchedIndices[i + 1] && matchedIndices[i + 1] - matchedIndices[i] <= 3) {
        orderedPairs++;
      }
    }
    sequenceBonus = Math.min(15, (orderedPairs / (queryWords.length - 1)) * 15);
  }

  const finalScore = Math.min(100, Math.round(coverageScore + sequenceBonus));
  return finalScore;
}

// Return top N ranked candidate verses
export function matchVerses(transcript: string, limit: number = 5): MatchResult[] {
  const allQueryWords = cleanWords(transcript);
  if (allQueryWords.length === 0) {
    return [{ ...BIBLE_VERSES[0], confidence: 0 }];
  }

  let filteredQuery = allQueryWords.filter(word => !STOP_WORDS.has(word));
  if (filteredQuery.length === 0) {
    filteredQuery = allQueryWords;
  }

  const scored: MatchResult[] = BIBLE_VERSES.map(verse => {
    const confidence = scoreVerse(filteredQuery, verse.text);
    return {
      ...verse,
      confidence,
    };
  });

  // Sort descending by confidence
  scored.sort((a, b) => b.confidence - a.confidence);

  const topResults = scored.slice(0, Math.max(1, limit));
  return topResults;
}

// Single match for backwards compatibility
export function matchVerse(transcript: string): MatchResult {
  const results = matchVerses(transcript, 1);
  return results[0] || { ...BIBLE_VERSES[0], confidence: 0 };
}
