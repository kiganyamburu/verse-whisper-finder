import { NextRequest, NextResponse } from "next/server";
import { BOOK_NAME_TO_ID, isCanonicalBook } from "@/lib/bible-books";

export const dynamic = 'force-dynamic';

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
    if (!bookId || !isCanonicalBook(bookId)) {
      return NextResponse.json({ success: false, error: `Book '${match[1]}' is not one of the 66 canonical Bible books` }, { status: 404 });
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
