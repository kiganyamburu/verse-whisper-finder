import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

const BOOK_NAME_TO_ID: Record<string, number> = {
  "genesis": 1, "exodus": 2, "leviticus": 3, "numbers": 4, "deuteronomy": 5,
  "joshua": 6, "judges": 7, "ruth": 8, "1 samuel": 9, "2 samuel": 10,
  "1 kings": 11, "2 kings": 12, "1 chronicles": 13, "2 chronicles": 14, "ezra": 15,
  "nehemiah": 16, "esther": 17, "job": 18, "psalm": 19, "psalms": 19, "proverbs": 20,
  "ecclesiastes": 21, "song of solomon": 22, "song of songs": 22, "isaiah": 23, "jeremiah": 24, "lamentations": 25,
  "ezekiel": 26, "daniel": 27, "hosea": 28, "joel": 29, "amos": 30,
  "obadiah": 31, "jonah": 32, "micah": 33, "nahum": 34, "habakkuk": 35,
  "zephaniah": 36, "haggai": 37, "zechariah": 38, "malachi": 39,
  "matthew": 40, "mark": 41, "luke": 42, "john": 43, "acts": 44,
  "romans": 45, "1 corinthians": 46, "2 corinthians": 47, "galatians": 48, "ephesians": 49,
  "philippians": 50, "colossians": 51, "1 thessalonians": 52, "2 thessalonians": 53, "1 timothy": 54,
  "2 timothy": 55, "titus": 56, "philemon": 57, "hebrews": 58, "james": 59,
  "1 peter": 60, "2 peter": 61, "1 john": 62, "2 john": 63, "3 john": 64,
  "jude": 65, "revelation": 66
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get("reference");
    const translation = (searchParams.get("translation") || "KJV").toUpperCase();

    if (!reference) {
      return NextResponse.json({ success: false, error: "Missing reference parameter" }, { status: 400 });
    }

    const match = reference.trim().match(/^(.+?)\s+(\d+)[:\.](\d+)$/);
    if (!match) {
      return NextResponse.json({ success: false, error: "Invalid reference format. Expected 'Book Chapter:Verse'" }, { status: 400 });
    }

    const rawBook = match[1].toLowerCase().trim();
    const chapter = parseInt(match[2], 10);
    const verse = parseInt(match[3], 10);

    const bookId = BOOK_NAME_TO_ID[rawBook];
    if (!bookId) {
      return NextResponse.json({ success: false, error: `Book '${match[1]}' not recognized` }, { status: 404 });
    }

    // Try fetching from Bolls.life
    let cleanText = "";
    try {
      const url = `https://bolls.life/get-verse/${encodeURIComponent(translation)}/${bookId}/${chapter}/${verse}/`;
      const res = await fetch(url);

      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.text === "string" && !data.text.includes("Biblica, Inc. has prohibited")) {
          cleanText = data.text
            .replace(/<S>\d+<\/S>/g, "")
            .replace(/<sup>.*?<\/sup>/gi, "")
            .replace(/<[^>]+>/g, "")
            .replace(/\s+/g, " ")
            .trim();
        }
      }
    } catch (e) {
      console.warn("Bolls API fetch failed:", e);
    }

    // Fallback: If Bolls didn't return text (e.g. for NIV), query public bible-api.com
    if (!cleanText) {
      try {
        const fallbackRes = await fetch(`https://bible-api.com/${encodeURIComponent(reference)}`);
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          if (fallbackData && typeof fallbackData.text === "string") {
            cleanText = fallbackData.text.replace(/\s+/g, " ").trim();
          }
        }
      } catch (fallbackErr) {
        console.warn("Fallback bible-api.com failed:", fallbackErr);
      }
    }

    if (!cleanText) {
      return NextResponse.json({ success: false, error: "Could not retrieve verse text for this translation" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      reference,
      translation,
      text: cleanText,
    });
  } catch (error: any) {
    console.error("Error fetching translation verse:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
