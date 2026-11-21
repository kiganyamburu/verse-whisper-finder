import { NextRequest, NextResponse } from "next/server";
import { matchVerses, scoreVerse, cleanWords, MatchResult } from "@/lib/matcher";
import { BIBLE_BOOK_NAMES, isCanonicalBook } from "@/lib/bible-books";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;
    const browserTranscript = (formData.get("transcript") as string) || "";

    let transcript = browserTranscript.trim();

    // Check if OpenAI API Key is configured in environment variables
    const openAiKey = process.env.OPENAI_API_KEY;
    if (openAiKey && audioFile && audioFile.size > 0) {
      const openAiFormData = new FormData();
      const fileName = audioFile.name && audioFile.name.includes(".") 
        ? audioFile.name 
        : "audio.webm";

      openAiFormData.append("file", audioFile, fileName);
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
          if (data.text && data.text.trim().length > 0) {
            transcript = data.text.trim();
          }
        } else {
          const errText = await openAiResponse.text();
          console.error("OpenAI Whisper API responded with error:", openAiResponse.status, errText);
        }
      } catch (err) {
        console.error("Failed to connect to OpenAI Whisper API:", err);
      }
    }

    if (!transcript) {
      return NextResponse.json(
        {
          success: false,
          noTranscript: true,
          error: openAiKey
            ? "No spoken words could be recognized in the audio clip. Please try speaking closer to the microphone or type the verse directly."
            : "No speech transcript received. To automatically transcribe audio files or browsers without Web Speech support, configure OPENAI_API_KEY on the server, or type your verse below.",
        },
        { status: 422 }
      );
    }

    // Clean query words for search
    const sanitizedQuery = transcript
      .replace(/[^\w\s']/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const queryWords = cleanWords(sanitizedQuery);
    const candidateMatches: MatchResult[] = [];
    const seenRefs = new Set<string>();

    // 1. Search online scripture database via Bolls.life API
    if (sanitizedQuery.length > 0) {
      try {
        let apiUrl = `https://bolls.life/find/KJV/?search=${encodeURIComponent(sanitizedQuery)}`;
        let apiResponse = await fetch(apiUrl);
        let apiData = apiResponse.ok ? await apiResponse.json() : null;

        // Fallback: If exact query returns no results, try searching with the longest key words
        if ((!apiData || !Array.isArray(apiData) || apiData.length === 0) && queryWords.length >= 2) {
          const keyWords = [...queryWords]
            .filter(w => w.length >= 4)
            .sort((a, b) => b.length - a.length)
            .slice(0, 3)
            .join(" ");

          if (keyWords.length > 0) {
            const fallbackUrl = `https://bolls.life/find/KJV/?search=${encodeURIComponent(keyWords)}`;
            const fallbackRes = await fetch(fallbackUrl);
            if (fallbackRes.ok) {
              apiData = await fallbackRes.json();
            }
          }
        }

        if (Array.isArray(apiData) && apiData.length > 0) {
          // Score and rank candidates from API
          for (const item of apiData.slice(0, 20)) {
            // Strictly enforce the 66 canonical books (1 to 66)
            if (!isCanonicalBook(item.book)) continue;

            const bookName = BIBLE_BOOK_NAMES[item.book];
            if (!bookName) continue;

            const ref = `${bookName} ${item.chapter}:${item.verse}`;
            if (seenRefs.has(ref)) continue;
            seenRefs.add(ref);

            const cleanText = (item.text || "")
              .replace(/<S>\d+<\/S>/g, "")
              .replace(/<sup>.*?<\/sup>/gi, "")
              .replace(/<[^>]+>/g, "")
              .replace(/\s+/g, " ")
              .trim();

            const score = scoreVerse(queryWords, cleanText);
            const confidence = Math.min(100, Math.max(score, 60));

            candidateMatches.push({
              reference: ref,
              text: cleanText,
              chapter: `${bookName} ${item.chapter}`,
              context: `Identified using full-text scripture indexing for "${transcript.slice(0, 40)}${transcript.length > 40 ? '...' : ''}"`,
              theme: "Scripture Database Match",
              confidence,
            });
          }
        }
      } catch (apiErr) {
        console.error("Online scripture search failed, relying on local index:", apiErr);
      }
    }

    // 2. Also run local fuzzy search
    const localMatches = matchVerses(sanitizedQuery, 5);
    for (const local of localMatches) {
      if (!seenRefs.has(local.reference)) {
        seenRefs.add(local.reference);
        candidateMatches.push(local);
      }
    }

    // 3. Sort all ranked candidate matches descending by confidence
    candidateMatches.sort((a, b) => b.confidence - a.confidence);

    // Limit to top 5 candidates
    const topCandidates = candidateMatches.slice(0, 5);
    const topMatch = topCandidates[0] || localMatches[0];

    return NextResponse.json({
      success: true,
      transcript,
      matches: topCandidates,
      match: topMatch,
    });
  } catch (error: any) {
    console.error("Error matching verse in API route:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
