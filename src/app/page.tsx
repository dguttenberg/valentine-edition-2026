"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { toPng } from "html-to-image";

// ─── Types ───────────────────────────────────────────────
type Energy =
  | "Devoted"
  | "Mysterious"
  | "Playful"
  | "Dramatic"
  | "Minimalist"
  | "Old-School Romantic"
  | "Modernist"
  | "Quietly Obsessed";

type DesignLanguage =
  | "Details"
  | "Bold Gestures"
  | "Patience"
  | "Sparkle"
  | "Precision"
  | "Surprise"
  | "Craft"
  | "Timing";

type JewelryPiece =
  | "Sculptural Gold Cuff"
  | "Diamond Line Necklace"
  | "Geometric Hoop"
  | "Delicate Chain Bracelet"
  | "Architectural Ring";

type AppState = "landing" | "selecting" | "generating" | "result";

// ─── Option Data ─────────────────────────────────────────
const ENERGIES: { value: Energy; desc: string }[] = [
  { value: "Devoted", desc: "Warm, unwavering, close" },
  { value: "Mysterious", desc: "Layered, veiled, magnetic" },
  { value: "Playful", desc: "Bright, dynamic, unexpected" },
  { value: "Dramatic", desc: "Bold, contrasted, theatrical" },
  { value: "Minimalist", desc: "Clean, precise, essential" },
  { value: "Old-School Romantic", desc: "Classic, soft, timeless" },
  { value: "Modernist", desc: "Geometric, sharp, current" },
  { value: "Quietly Obsessed", desc: "Intimate, focused, persistent" },
];

const DESIGN_LANGUAGES: { value: DesignLanguage; desc: string }[] = [
  { value: "Details", desc: "Look closer" },
  { value: "Bold Gestures", desc: "Say it large" },
  { value: "Patience", desc: "Let it build" },
  { value: "Sparkle", desc: "Catch the light" },
  { value: "Precision", desc: "Every line matters" },
  { value: "Surprise", desc: "Where you least expect" },
  { value: "Craft", desc: "Made by hand" },
  { value: "Timing", desc: "The right moment" },
];

const JEWELRY_PIECES: { value: JewelryPiece; desc: string }[] = [
  {
    value: "Sculptural Gold Cuff",
    desc: "Architectural gold, bold and curved",
  },
  {
    value: "Diamond Line Necklace",
    desc: "Linear brilliance, point by point",
  },
  { value: "Geometric Hoop", desc: "Perfect circles, modern metal" },
  {
    value: "Delicate Chain Bracelet",
    desc: "Fine links, quiet connections",
  },
  {
    value: "Architectural Ring",
    desc: "Structured geometry, statement form",
  },
];

// ─── Gradient Fallbacks (if image gen fails) ─────────────
const ENERGY_GRADIENTS: Record<Energy, string> = {
  Devoted: "from-amber-200 via-orange-100 to-yellow-50",
  Mysterious: "from-indigo-900 via-purple-800 to-slate-900",
  Playful: "from-rose-200 via-sky-100 to-amber-100",
  Dramatic: "from-red-900 via-stone-900 to-black",
  Minimalist: "from-stone-100 via-white to-stone-50",
  "Old-School Romantic": "from-rose-100 via-pink-50 to-cream",
  Modernist: "from-slate-300 via-zinc-200 to-stone-100",
  "Quietly Obsessed": "from-stone-400 via-amber-200 to-stone-300",
};

const FALLBACK_NOTE =
  "Warmth finds its form in the interplay of light and material. The composition settles into something unhurried — precise where it needs to be, soft where it can afford to be. A February gesture, held in gold and shadow.";

// ─── Component ───────────────────────────────────────────
export default function Home() {
  const [appState, setAppState] = useState<AppState>("landing");
  const [step, setStep] = useState(1);
  const [energy, setEnergy] = useState<Energy | null>(null);
  const [designLanguage, setDesignLanguage] =
    useState<DesignLanguage | null>(null);
  const [piece, setPiece] = useState<JewelryPiece | null>(null);
  const [generatedImage, setGeneratedImage] = useState("");
  const [generatedNote, setGeneratedNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const generateRef = useRef<HTMLDivElement>(null);

  // ─── Handlers ────────────────────────────────────────
  const handleStart = () => {
    setAppState("selecting");
    setStep(1);
  };

  const handleEnergySelect = (e: Energy) => {
    setEnergy(e);
    setTimeout(() => setStep(2), 300);
  };

  const handleDesignSelect = (d: DesignLanguage) => {
    setDesignLanguage(d);
    setTimeout(() => setStep(3), 300);
  };

  const handlePieceSelect = (p: JewelryPiece) => {
    setPiece(p);
    setTimeout(() => {
      generateRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  const handleGenerate = async () => {
    if (!energy || !designLanguage || !piece) return;
    setAppState("generating");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ energy, designLanguage, piece }),
      });
      const data = await res.json();
      setGeneratedImage(data.image || "");
      setGeneratedNote(data.note || FALLBACK_NOTE);
      setAppState("result");
    } catch {
      setGeneratedImage("");
      setGeneratedNote(FALLBACK_NOTE);
      setAppState("result");
    }
  };

  const handleSave = useCallback(async () => {
    if (!cardRef.current) return;
    setIsSaving(true);
    try {
      const opts = {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: "#FFFFFF",
        cacheBust: true,
      };

      // Double-render: first call primes/caches images, second captures properly.
      // This fixes blank output on mobile where base64 images aren't ready on first pass.
      await toPng(cardRef.current, opts);
      const dataUrl = await toPng(cardRef.current, opts);

      const filename = `valentine-card-2026-${energy?.toLowerCase().replace(/\s+/g, "-")}.png`;

      // Manual blob conversion (more reliable than fetch(dataUrl) on mobile Safari)
      const byteString = atob(dataUrl.split(",")[1]);
      const mimeType = dataUrl.split(",")[0].split(":")[1].split(";")[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeType });
      const file = new File([blob], filename, { type: "image/png" });

      // Try Web Share API (mobile — opens native share sheet)
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        setIsSaving(false); // Clear state before share sheet appears
        await navigator.share({
          files: [file],
          title: "Valentine Card 2026",
        });
      } else {
        // Fallback: standard download (desktop)
        const link = document.createElement("a");
        link.download = filename;
        link.href = dataUrl;
        link.click();
        setIsSaving(false);
      }
    } catch (err) {
      // User cancelled share sheet — not an error
      if (err instanceof Error && err.name !== "AbortError") {
        console.error("Save failed:", err);
      }
      setIsSaving(false);
    }
  }, [energy]);

  const handleReset = () => {
    setAppState("landing");
    setStep(1);
    setEnergy(null);
    setDesignLanguage(null);
    setPiece(null);
    setGeneratedImage("");
    setGeneratedNote("");
  };

  // ─── Render: Landing ─────────────────────────────────
  if (appState === "landing") {
    return (
      <div className="min-h-dvh flex items-center justify-center px-6">
        <div className="text-center animate-fade-in max-w-md">
          {/* Logo Lockup */}
          <div className="flex items-center justify-center gap-4 sm:gap-5 mb-10 sm:mb-12">
            <img
              src="/doner-logo.png"
              alt="Doner"
              className="h-4 sm:h-5"
            />
            <span
              className="text-xs sm:text-sm font-light"
              style={{
                fontFamily: "var(--font-serif)",
                color: "var(--warm-gray)",
              }}
            >
              &times;
            </span>
            <img
              src="/kay-logo.svg"
              alt="Kay Jewelers"
              className="h-8 sm:h-10"
            />
          </div>

          <p
            className="text-xs tracking-[0.3em] uppercase mb-8"
            style={{
              fontFamily: "var(--font-sans)",
              color: "var(--warm-gray)",
            }}
          >
            Valentine Card
          </p>
          <h1
            className="text-5xl md:text-6xl font-light mb-6 leading-tight"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            2026
          </h1>
          <div
            className="w-12 h-px mx-auto mb-8"
            style={{ background: "var(--border-warm)" }}
          />
          <p
            className="text-sm leading-relaxed mb-12 max-w-xs mx-auto"
            style={{
              fontFamily: "var(--font-sans)",
              color: "var(--warm-gray)",
            }}
          >
            Three selections. One composed artifact.
            <br />A small Valentine, sent a little differently.
          </p>
          <button
            onClick={handleStart}
            className="text-xs tracking-[0.2em] uppercase px-8 py-3 border transition-all duration-300 hover:bg-foreground hover:text-background"
            style={{
              fontFamily: "var(--font-sans)",
              borderColor: "var(--foreground)",
            }}
          >
            Begin
          </button>
        </div>
      </div>
    );
  }

  // ─── Render: Selection ───────────────────────────────
  if (appState === "selecting") {
    return (
      <div className="min-h-dvh flex flex-col items-center px-6 py-10 sm:py-16">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-10 sm:mb-16">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`step-dot ${s === step ? "active" : s < step ? "completed" : ""}`}
            />
          ))}
        </div>

        {/* Step 1: Energy */}
        {step === 1 && (
          <div className="animate-fade-in w-full max-w-2xl">
            <div className="text-center mb-12">
              <p
                className="text-xs tracking-[0.3em] uppercase mb-4"
                style={{
                  fontFamily: "var(--font-sans)",
                  color: "var(--warm-gray)",
                }}
              >
                Step 1 of 3
              </p>
              <h2
                className="text-3xl md:text-4xl font-light"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                Pick your Valentine Energy
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {ENERGIES.map((e) => (
                <button
                  key={e.value}
                  onClick={() => handleEnergySelect(e.value)}
                  className={`selection-tile p-5 border text-left ${
                    energy === e.value ? "selected" : ""
                  }`}
                  style={{ borderColor: "var(--border-warm)" }}
                >
                  <span
                    className="block text-sm font-medium mb-1"
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    {e.value}
                  </span>
                  <span
                    className="block text-xs"
                    style={{
                      fontFamily: "var(--font-sans)",
                      color: "var(--warm-gray)",
                    }}
                  >
                    {e.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Design Language */}
        {step === 2 && (
          <div className="animate-fade-in w-full max-w-2xl">
            <div className="text-center mb-12">
              <p
                className="text-xs tracking-[0.3em] uppercase mb-4"
                style={{
                  fontFamily: "var(--font-sans)",
                  color: "var(--warm-gray)",
                }}
              >
                Step 2 of 3
              </p>
              <h2
                className="text-3xl md:text-4xl font-light"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                Pick your Design Language
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {DESIGN_LANGUAGES.map((d) => (
                <button
                  key={d.value}
                  onClick={() => handleDesignSelect(d.value)}
                  className={`selection-tile p-5 border text-left ${
                    designLanguage === d.value ? "selected" : ""
                  }`}
                  style={{ borderColor: "var(--border-warm)" }}
                >
                  <span
                    className="block text-sm font-medium mb-1"
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    {d.value}
                  </span>
                  <span
                    className="block text-xs"
                    style={{
                      fontFamily: "var(--font-sans)",
                      color: "var(--warm-gray)",
                    }}
                  >
                    {d.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Jewelry Piece */}
        {step === 3 && (
          <div className="animate-fade-in w-full max-w-2xl">
            <div className="text-center mb-12">
              <p
                className="text-xs tracking-[0.3em] uppercase mb-4"
                style={{
                  fontFamily: "var(--font-sans)",
                  color: "var(--warm-gray)",
                }}
              >
                Step 3 of 3
              </p>
              <h2
                className="text-3xl md:text-4xl font-light"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                Pick a Jewelry Piece
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-12">
              {JEWELRY_PIECES.map((p) => (
                <button
                  key={p.value}
                  onClick={() => handlePieceSelect(p.value)}
                  className={`selection-tile p-6 border text-left ${
                    piece === p.value ? "selected" : ""
                  }`}
                  style={{ borderColor: "var(--border-warm)" }}
                >
                  <span
                    className="block text-sm font-medium mb-1"
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    {p.value}
                  </span>
                  <span
                    className="block text-xs"
                    style={{
                      fontFamily: "var(--font-sans)",
                      color: "var(--warm-gray)",
                    }}
                  >
                    {p.desc}
                  </span>
                </button>
              ))}
            </div>

            {/* Summary + Generate */}
            {piece && (
              <div ref={generateRef} className="animate-fade-in text-center">
                <div
                  className="w-12 h-px mx-auto mb-6"
                  style={{ background: "var(--border-warm)" }}
                />
                <p
                  className="text-xs tracking-[0.15em] uppercase mb-2"
                  style={{
                    fontFamily: "var(--font-sans)",
                    color: "var(--warm-gray)",
                  }}
                >
                  Your selections
                </p>
                <p
                  className="text-lg mb-8"
                  style={{ fontFamily: "var(--font-serif)" }}
                >
                  {energy} &middot; {designLanguage} &middot; {piece}
                </p>
                <button
                  onClick={handleGenerate}
                  className="text-xs tracking-[0.2em] uppercase px-10 py-3 transition-all duration-300"
                  style={{
                    fontFamily: "var(--font-sans)",
                    background: "var(--foreground)",
                    color: "var(--background)",
                  }}
                >
                  Create Card
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ─── Render: Generating ──────────────────────────────
  if (appState === "generating") {
    return (
      <div className="min-h-dvh flex items-center justify-center px-6">
        <div className="text-center">
          <p
            className="text-xs tracking-[0.3em] uppercase mb-6 animate-subtle-pulse"
            style={{
              fontFamily: "var(--font-sans)",
              color: "var(--warm-gray)",
            }}
          >
            Composing your card
          </p>
          <div
            className="w-48 h-px mx-auto overflow-hidden"
            style={{ background: "var(--border-warm)" }}
          >
            <div
              className="h-full animate-progress"
              style={{ background: "var(--gold)" }}
            />
          </div>
          <p
            className="text-xs mt-6"
            style={{
              fontFamily: "var(--font-sans)",
              color: "var(--warm-gray)",
            }}
          >
            {energy} &middot; {designLanguage} &middot; {piece}
          </p>
        </div>
      </div>
    );
  }

  // ─── Render: Result ──────────────────────────────────
  if (appState === "result") {
    // New curator copy is paragraph prose, but handle both formats
    const noteLines = generatedNote.split("\n").filter((l) => l.trim());
    const fallbackGradient = energy
      ? ENERGY_GRADIENTS[energy]
      : "from-stone-200 to-stone-100";

    return (
      <div className="px-4 sm:px-6 py-8 sm:py-12" style={{ height: "100dvh", overflowY: "auto", overscrollBehaviorY: "contain", WebkitOverflowScrolling: "touch" }}>
        {/* The Card (capturable) */}
        <div>
          <div
            ref={cardRef}
            className="valentine-card mx-auto"
            style={{
              boxShadow:
                "0 1px 3px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.04)",
            }}
          >
            {/* Top Banner */}
            <div className="px-6 sm:px-10 pt-8 sm:pt-10 pb-4 sm:pb-6 text-center">
              <p
                className="text-[10px] tracking-[0.4em] uppercase"
                style={{
                  fontFamily: "var(--font-sans)",
                  color: "var(--warm-gray)",
                }}
              >
                Valentine Card 2026
              </p>
            </div>

            {/* Hero Image */}
            <div className="px-4 sm:px-8">
              <div
                className="w-full aspect-square overflow-hidden"
                style={{ background: "#f5f3ef" }}
              >
                {generatedImage ? (
                  <img
                    src={generatedImage}
                    alt="Generated Valentine Card artwork"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className={`w-full h-full bg-gradient-to-br ${fallbackGradient} flex items-center justify-center`}
                  >
                    <div className="text-center opacity-30">
                      <div
                        className="w-16 h-16 border mx-auto mb-3"
                        style={{
                          borderColor: "var(--warm-gray)",
                          transform: "rotate(45deg)",
                        }}
                      />
                      <p
                        className="text-xs tracking-[0.2em] uppercase"
                        style={{ fontFamily: "var(--font-sans)" }}
                      >
                        Card Artwork
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Metadata Block */}
            <div className="px-6 sm:px-10 pt-6 sm:pt-8 pb-4">
              <div className="card-meta flex flex-wrap gap-4 sm:gap-8">
                <div>
                  <p
                    className="text-[9px] tracking-[0.3em] uppercase mb-1"
                    style={{
                      fontFamily: "var(--font-sans)",
                      color: "var(--warm-gray)",
                    }}
                  >
                    Energy
                  </p>
                  <p
                    className="text-sm"
                    style={{ fontFamily: "var(--font-serif)" }}
                  >
                    {energy}
                  </p>
                </div>
                <div>
                  <p
                    className="text-[9px] tracking-[0.3em] uppercase mb-1"
                    style={{
                      fontFamily: "var(--font-sans)",
                      color: "var(--warm-gray)",
                    }}
                  >
                    Language
                  </p>
                  <p
                    className="text-sm"
                    style={{ fontFamily: "var(--font-serif)" }}
                  >
                    {designLanguage}
                  </p>
                </div>
                <div>
                  <p
                    className="text-[9px] tracking-[0.3em] uppercase mb-1"
                    style={{
                      fontFamily: "var(--font-sans)",
                      color: "var(--warm-gray)",
                    }}
                  >
                    Piece
                  </p>
                  <p
                    className="text-sm"
                    style={{ fontFamily: "var(--font-serif)" }}
                  >
                    {piece}
                  </p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="px-6 sm:px-10">
              <div
                className="w-full h-px"
                style={{ background: "var(--border-warm)" }}
              />
            </div>

            {/* Note */}
            <div className="card-note px-6 sm:px-10 pt-5 sm:pt-6 pb-8 sm:pb-10">
              {noteLines.map((line, i) => (
                <p
                  key={i}
                  className="text-base sm:text-lg leading-relaxed mb-1 last:mb-0"
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontStyle: "italic",
                    color: "var(--warm-gray)",
                  }}
                >
                  {line}
                </p>
              ))}
            </div>

            {/* Footer */}
            <div className="px-6 sm:px-10 pb-8 sm:pb-10">
              <div
                className="w-full h-px mb-4 sm:mb-6"
                style={{ background: "var(--border-warm)" }}
              />
              <p
                className="text-[9px] tracking-[0.2em] uppercase text-center"
                style={{
                  fontFamily: "var(--font-sans)",
                  color: "var(--warm-gray)",
                }}
              >
                A small Valentine, sent a little differently.
              </p>
            </div>
          </div>
        </div>

        {/* Actions (below card, not captured) */}
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="text-xs tracking-[0.2em] uppercase px-8 py-3 transition-all duration-300 disabled:opacity-50 w-full sm:w-auto"
            style={{
              fontFamily: "var(--font-sans)",
              background: "var(--foreground)",
              color: "var(--background)",
            }}
          >
            <span className="sm:hidden">Share</span>
            <span className="hidden sm:inline">Download PNG</span>
          </button>
          <button
            onClick={handleReset}
            className="text-xs tracking-[0.2em] uppercase px-6 py-3 border transition-all duration-300 hover:bg-foreground hover:text-background w-full sm:w-auto"
            style={{
              fontFamily: "var(--font-sans)",
              borderColor: "var(--border-warm)",
              color: "var(--warm-gray)",
            }}
          >
            Start Over
          </button>
        </div>
      </div>
    );
  }

  return null;
}
