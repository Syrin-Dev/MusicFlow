import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { text, targetLang = 'bg' } = body;

        if (!text) {
            return NextResponse.json({ error: "Missing text" }, { status: 400 });
        }

        // Use Google Translate free API (GTX)
        // This is a common free endpoint used by many extensions.
        // It splits text into sentences and translates them.
        const url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=" + targetLang + "&dt=t&q=" + encodeURIComponent(text);

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Translation API failed: ${response.status}`);
        }

        const data = await response.json();

        // The API returns an array of arrays. We need to join the translated segments.
        // Structure: [[[ "Translated Text", "Original Text", ...], ...], ...]
        let translatedText = "";
        if (data && data[0]) {
            data[0].forEach((segment: any) => {
                if (segment[0]) {
                    translatedText += segment[0];
                }
            });
        }

        return NextResponse.json({ translatedText });

    } catch (error) {
        console.error("Translation error:", error);
        return NextResponse.json({ error: "Translation failed" }, { status: 500 });
    }
}
