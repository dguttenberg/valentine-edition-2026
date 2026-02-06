import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Energy → visual mood mapping
const ENERGY_STYLES: Record<string, string> = {
  Devoted:
    "warm golden ambient light, soft luminous focus, deep amber and honey tones, intimate radiating warmth",
  Mysterious:
    "dark moody atmospheric lighting, deep violet and midnight blue tones, dramatic layered shadows, veiled ethereal depth",
  Playful:
    "bright scattered prismatic light, soft pastel accents with unexpected color pops, dynamic asymmetric energy",
  Dramatic:
    "high contrast chiaroscuro lighting, bold crimson and deep black tones, theatrical intensity, cinematic shadow play",
  Minimalist:
    "vast clean white space, precise singular lines, restrained monochrome palette with one subtle metallic accent",
  "Old-School Romantic":
    "soft diffused film-like grain, rose and ivory cream tones, classical symmetrical balance, nostalgic warmth",
  Modernist:
    "geometric precision lighting, cool chrome and steel blue tones, sharp angular edges, contemporary clarity",
  "Quietly Obsessed":
    "intimate extreme macro perspective, warm muted earth tones, hypnotic singular focus, meditative stillness",
};

// Design Language → composition logic mapping
const LANGUAGE_STYLES: Record<string, string> = {
  Details:
    "intricate macro-level perspective revealing fine surface textures, layered depth of material detail, every facet visible",
  "Bold Gestures":
    "large dominant scale with expansive negative space, singular powerful focal point, commanding presence",
  Patience:
    "gradual layered depth with soft transitional zones, contemplative breathing room, unhurried visual rhythm",
  Sparkle:
    "prismatic refracted light scattering across surfaces, crystalline faceted highlights, scattered luminous points of brilliance",
  Precision:
    "mathematical grid alignment, exact bilateral symmetry, clean geometric edges, ruler-straight compositional lines",
  Surprise:
    "unexpected oblique viewing angle, bold asymmetric layout creating dynamic tension, unconventional crop",
  Craft:
    "visible material grain and hand-finished texture quality, warm artisanal surface detail, evidence of making",
  Timing:
    "implied subtle motion, temporal flow suggestion, sequential visual rhythm, frozen decisive moment",
};

// Jewelry Piece → material/form mapping
const PIECE_STYLES: Record<string, string> = {
  "Sculptural Gold Cuff":
    "solid polished gold metallic arc forms, bold sculptural curves, architectural bangle silhouette, warm reflective gold surfaces",
  "Diamond Line Necklace":
    "linear cascade of brilliant diamond-like light points, flowing delicate chain line, crystalline sequential sparkle along a path",
  "Geometric Hoop":
    "perfect circular metallic geometry, clean modern hoop forms, smooth reflective gold surface, bold round silhouettes",
  "Delicate Chain Bracelet":
    "fine interlocking gold chain links, gossamer metallic connections, delicate woven light-catching threads, subtle linear grace",
  "Architectural Ring":
    "structured angular metallic setting, bold geometric faceted form, architectural statement piece, angular planes catching light",
};

async function generateImage(
  energy: string,
  designLanguage: string,
  piece: string
): Promise<string> {
  const energyStyle = ENERGY_STYLES[energy] || "";
  const languageStyle = LANGUAGE_STYLES[designLanguage] || "";
  const pieceStyle = PIECE_STYLES[piece] || "";

  const prompt = `Create a single abstract, editorial fine-art still-life image.

Subject: Abstract interpretation of jewelry forms — ${pieceStyle}

Mood and lighting: ${energyStyle}

Composition: ${languageStyle}

ABSOLUTE RULES:
- NO humans, NO faces, NO hands, NO body parts whatsoever
- NO text, NO words, NO letters, NO numbers, NO logos, NO watermarks
- NO literal product photography — this is an ABSTRACT ARTISTIC INTERPRETATION
- NO hearts or Valentine symbols
- Semi-abstract editorial fine-art tone
- Think: high-end gallery print, museum-quality, collectible art piece
- Rich material textures: polished metal, light refraction, shadow play
- Square 1:1 format
- Single cohesive composition
- Intentional, restrained color palette`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
        },
      }),
    }
  );

  const data = await response.json();

  if (data.candidates?.[0]?.content?.parts) {
    for (const part of data.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
      }
    }
  }

  // If first model fails, try alternate model name
  const fallbackResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
        },
      }),
    }
  );

  const fallbackData = await fallbackResponse.json();

  if (fallbackData.candidates?.[0]?.content?.parts) {
    for (const part of fallbackData.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
      }
    }
  }

  return "";
}

async function generateNote(
  energy: string,
  designLanguage: string,
  piece: string
): Promise<string> {
  const prompt = `Write a short Valentine's note for an art edition card.

Context: someone selected "${energy}" energy, "${designLanguage}" design language, and "${piece}" as their piece.

STRICT FORMAT:
- Exactly 4 lines
- Each line is its own short sentence or fragment
- Line 1: Brief, understated acknowledgment of Valentine timing
- Lines 2-3: Reference how selections shaped an interpretation
- Line 4: Forward-looking, neutral close

STRICT TONE RULES:
- NO romance clichés (no "sweetheart", "darling", "love", "roses")
- NO humor or jokes
- NO selling, marketing, or brand language
- NO mention of AI, algorithms, generation, or technology
- NO mention of business, strategy, roles, or meetings
- Composed, intentional, slightly elevated — like a gallery placard
- Think: thoughtful curator voice, not greeting card

Write ONLY the 4 lines, each on its own line. No quotes, no extra text.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 200,
        },
      }),
    }
  );

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (text) {
    return text
      .trim()
      .replace(/^["']/gm, "")
      .replace(/["']$/gm, "");
  }

  return "A small Valentine, for the timing.\nYour selections shaped something deliberate.\nStructure meeting expression, as intended.\nLooking forward to the conversation.";
}

export async function POST(request: NextRequest) {
  try {
    const { energy, designLanguage, piece } = await request.json();

    // Run image and note generation in parallel
    const [image, note] = await Promise.all([
      generateImage(energy, designLanguage, piece),
      generateNote(energy, designLanguage, piece),
    ]);

    return NextResponse.json({ image, note });
  } catch (error) {
    console.error("Generation error:", error);
    return NextResponse.json(
      {
        image: "",
        note: "A small Valentine, for the timing.\nYour selections shaped something deliberate.\nStructure meeting expression, as intended.\nLooking forward to the conversation.",
      },
      { status: 200 }
    );
  }
}
