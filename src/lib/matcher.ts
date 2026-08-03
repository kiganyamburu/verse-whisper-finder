import { BIBLE_VERSES, Verse } from "./bible-data";

export interface MatchResult extends Verse {
  confidence: number;
}

export function matchVerse(transcript: string): MatchResult {
  const cleanWords = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s']/g, "") // Keep apostrophes for contractions
      .split(/\s+/)
      .filter(Boolean);
  };

  const queryWords = cleanWords(transcript);
  if (queryWords.length === 0) {
    return { ...BIBLE_VERSES[0], confidence: 0 };
  }

  const STOP_WORDS = new Set([
    "a", "an", "the", "and", "or", "but", "if", "because", "as", "until", 
    "while", "of", "at", "by", "for", "with", "about", "against", "between", 
    "into", "through", "during", "before", "after", "above", "below", "to", 
    "from", "up", "down", "in", "out", "on", "off", "over", "under", "again", 
    "further", "then", "once", "here", "there", "when", "where", "why", "how", 
    "all", "any", "both", "each", "few", "more", "most", "other", "some", 
    "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too", 
    "very", "s", "t", "can", "will", "just", "don", "should", "now"
  ]);

  let filteredQuery = queryWords.filter(word => !STOP_WORDS.has(word));
  if (filteredQuery.length === 0) {
    filteredQuery = queryWords;
  }

  let bestMatch: Verse = BIBLE_VERSES[0];
  let maxScore = 0;

  BIBLE_VERSES.forEach(verse => {
    const verseWords = cleanWords(verse.text);
    const verseWordSet = new Set(verseWords);

    let matchCount = 0;
    filteredQuery.forEach(word => {
      if (verseWordSet.has(word)) {
        matchCount++;
      }
    });

    const score = Math.round((matchCount / filteredQuery.length) * 100);
    if (score > maxScore) {
      maxScore = score;
      bestMatch = verse;
    }
  });

  return {
    ...bestMatch,
    confidence: maxScore
  };
}
