import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Energy → visual mood mapping (all within Valentine palette: dusty rose, champagne gold, warm white, matte blush, subtle wine, soft copper)
const ENERGY_STYLES: Record<string, string> = {
  Devoted:
    "warm champagne-gold ambient light, soft luminous focus, blush and rose-gold tones, intimate radiating warmth against cream",
  Mysterious:
    "deep muted wine and dusty mauve atmospheric lighting, soft layered shadows, veiled depth in burgundy and champagne",
  Playful:
    "bright scattered light through blush and soft copper tones, warm pastel pinks with champagne gold accents, dynamic asymmetric energy",
  Dramatic:
    "high contrast lighting between deep wine and warm white, bold rose-gold highlights against rich burgundy shadows, theatrical intensity",
  Minimalist:
    "vast warm white space, precise singular lines, restrained palette of matte blush with one champagne-gold metallic accent",
  "Old-School Romantic":
    "soft diffused film-like grain, dusty rose and ivory cream tones, classical symmetrical balance, nostalgic blush warmth",
  Modernist:
    "geometric precision lighting, cool champagne and matte rose tones, sharp angular edges with warm copper accents, contemporary clarity",
  "Quietly Obsessed":
    "intimate extreme macro perspective, warm dusty rose and soft gold earth tones, hypnotic singular focus, meditative blush stillness",
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
- COLOR PALETTE (mandatory): Work ONLY within this Valentine's palette — dusty rose, champagne gold, warm white, matte blush, subtle wine/burgundy, soft copper, ivory cream. No blues, no greens, no purples, no bright reds. The palette should feel elevated, modern, and warm — like a high-end jewelry editorial, not a greeting card.`;

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

// Curator-voice descriptions for each dimension
const ENERGY_VOICE: Record<string, string> = {
  Devoted: "warmth that stays close, a steady luminous focus",
  Mysterious: "depth that withholds just enough, layered shadow and suggestion",
  Playful: "brightness that moves unpredictably, scattered light and color",
  Dramatic: "contrast that commands attention, tension between dark and brilliant",
  Minimalist: "restraint as a statement, the elegance of almost-nothing",
  "Old-School Romantic": "softness borrowed from memory, a warmth that feels inherited",
  Modernist: "precision that reads as confidence, clean geometry and cool light",
  "Quietly Obsessed": "closeness that borders on devotion, an intimate and singular focus",
};

const LANGUAGE_VOICE: Record<string, string> = {
  Details: "rewards the close look — every surface has a second layer",
  "Bold Gestures": "fills the frame with a single confident statement",
  Patience: "unfolds slowly, giving the eye room to settle",
  Sparkle: "catches and scatters light across every available surface",
  Precision: "aligns with intention — nothing accidental, nothing extra",
  Surprise: "arrives from an angle you didn't expect",
  Craft: "carries the texture of something made by hand",
  Timing: "suggests a moment just before or after — suspended, deliberate",
};

const PIECE_VOICE: Record<string, string> = {
  "Sculptural Gold Cuff": "the sculptural weight of gold, curved and architectural",
  "Diamond Line Necklace": "a line of diamond points, brilliant and sequential",
  "Geometric Hoop": "the perfect circle, modern and unbroken",
  "Delicate Chain Bracelet": "fine chain links, almost weightless in their connection",
  "Architectural Ring": "structured angles and planes — geometry as adornment",
};

async function generateNote(
  energy: string,
  designLanguage: string,
  piece: string
): Promise<string> {
  const energyDesc = ENERGY_VOICE[energy] || energy.toLowerCase();
  const languageDesc = LANGUAGE_VOICE[designLanguage] || designLanguage.toLowerCase();
  const pieceDesc = PIECE_VOICE[piece] || piece.toLowerCase();

  const prompt = `You are writing a short curator's description for a Valentine's art card. This is a wall-text placard — the kind you'd read next to an artwork in a gallery.

The card was shaped by three selections:
- Energy: "${energy}" — ${energyDesc}
- Design Language: "${designLanguage}" — ${languageDesc}
- Piece: "${piece}" — ${pieceDesc}

Write 3-4 sentences that describe what this particular combination produced. Explain what makes it distinctive — how the energy shaped the mood, how the design language influenced the composition, and how the piece grounds it in form. Make it feel like you're describing a real artwork to someone standing in front of it.

The Valentine's connection should be oblique — a season, a gesture, a quality of attention. Never use the word "Valentine" or "love." Think: February light, the act of selecting something for someone, the care in a deliberate choice. One subtle reference is enough, woven in naturally.

RULES:
- Curator's observational voice — slightly detached, appreciative, specific
- Describe the VISUAL qualities: light, color, texture, form, composition
- NO clichés, NO greeting-card language, NO exclamation points
- NO mention of AI, generation, technology, or algorithms
- NO selling, brand language, or calls to action
- NO "this card" or "your card" — describe the work itself
- Present tense. Declarative sentences. Confident but unhurried.

Write ONLY the description. No title, no quotes, no attribution.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 300,
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

  return "Warmth finds its form in the interplay of light and material. The composition settles into something unhurried — precise where it needs to be, soft where it can afford to be. A February gesture, held in gold and shadow.";
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
        note: "Warmth finds its form in the interplay of light and material. The composition settles into something unhurried — precise where it needs to be, soft where it can afford to be. A February gesture, held in gold and shadow.",
      },
      { status: 200 }
    );
  }
}
