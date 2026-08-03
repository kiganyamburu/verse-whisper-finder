import { NextRequest, NextResponse } from "next/server";
import { matchVerse } from "@/lib/matcher";

const BIBLE_BOOKS: Record<number, string> = {
  1: "Genesis", 2: "Exodus", 3: "Leviticus", 4: "Numbers", 5: "Deuteronomy",
  6: "Joshua", 7: "Judges", 8: "Ruth", 9: "1 Samuel", 10: "2 Samuel",
  11: "1 Kings", 12: "2 Kings", 13: "1 Chronicles", 14: "2 Chronicles", 15: "Ezra",
  16: "Nehemiah", 17: "Esther", 18: "Job", 19: "Psalm", 20: "Proverbs",
  21: "Ecclesiastes", 22: "Song of Solomon", 23: "Isaiah", 24: "Jeremiah", 25: "Lamentations",
  26: "Ezekiel", 27: "Daniel", 28: "Hosea", 29: "Joel", 30: "Amos",
  31: "Obadiah", 32: "Jonah", 33: "Micah", 34: "Nahum", 35: "Habakkuk",
  36: "Zephaniah", 37: "Haggai", 38: "Zechariah", 39: "Malachi",
  40: "Matthew", 41: "Mark", 42: "Luke", 43: "John", 44: "Acts",
  45: "Romans", 46: "1 Corinthians", 47: "2 Corinthians", 48: "Galatians", 49: "Ephesians",
  50: "Philippians", 51: "Colossians", 52: "1 Thessalonians", 53: "2 Thessalonians", 54: "1 Timothy",
  55: "2 Timothy", 56: "Titus", 57: "Philemon", 58: "Hebrews", 59: "James",
  60: "1 Peter", 61: "2 Peter", 62: "1 John", 63: "2 John", 64: "3 John",
  65: "Jude", 66: "Revelation"
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;
    const browserTranscript = formData.get("transcript") as string || "";

    let transcript = browserTranscript;

    // Check if OpenAI API Key is configured in environment variables
    const openAiKey = process.env.OPENAI_API_KEY;
    if (openAiKey && audioFile && audioFile.size > 0) {
      const openAiFormData = new FormData();
      openAiFormData.append("file", audioFile);
      openAiFormData.append("model", "whisper-1");

      try {
        const openAiResponse = await fetch("https://api.openai.com/v1/audio/transcriptions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openAiKey}`,
          },
          body: openAiFormData,
        });

        if (openAiResponse.ok) {
          const data = await openAiResponse.json();
          transcript = data.text || transcript;
        } else {
          console.error("OpenAI Whisper API failed with status:", openAiResponse.status);
        }
      } catch (err) {
        console.error("Failed to connect to OpenAI Whisper API:", err);
      }
    }

    let matched = null;

    // Try to search the complete Bible via free public Bolls.life API
    if (transcript.trim().length > 0) {
      try {
        const url = `https://bolls.life/find/KJV/?search=${encodeURIComponent(transcript)}`;
        const apiResponse = await fetch(url);
        if (apiResponse.ok) {
          const data = await apiResponse.json();
          if (Array.isArray(data) && data.length > 0) {
            const topMatch = data[0];
            const bookName = BIBLE_BOOKS[topMatch.book] || "Unknown";
            const cleanText = topMatch.text
              .replace(/<S>\d+<\/S>/g, "")
              .replace(/<[^>]+>/g, "")
              .trim();

            matched = {
              reference: `${bookName} ${topMatch.chapter}:${topMatch.verse}`,
              text: cleanText,
              chapter: `${bookName} ${topMatch.chapter}`,
              context: `Identified using full-text semantic indexing for "${transcript.slice(0, 50)}..."`,
              theme: "Scripture Database Match",
              confidence: 100, // High confidence for exact match
            };
          }
        }
      } catch (apiErr) {
        console.error("Failed to fetch match from bolls.life, using local database fallback:", apiErr);
      }
    }

    // Fall back to local search database if online query yielded no results
    if (!matched) {
      matched = matchVerse(transcript);
    }

    return NextResponse.json({
      success: true,
      transcript,
      match: matched,
    });
  } catch (error: any) {
    console.error("Error matching verse in API route:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
