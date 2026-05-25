import forms from '@tailwindcss/forms';
import containerQueries from '@tailwindcss/container-queries';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary":          "#22c55e",
                "primary-dark":     "#16a34a",
                "primary-light":    "#86efac",
                "primary-glow":     "rgba(34,197,94,0.35)",
                "electric":         "#00e676",
                "background-light": "#f6f8f6",
                "background-dark":  "#0a0f0c",
                "surface-base":     "#060d08",
                "surface-deep":     "#0a0f0c",
                "surface":          "#0d1f10",
                "surface-hi":       "#162b1a",
                "border-lo":        "#1a3a1f",
                "border-md":        "#1e3a22",
                "text-hi":          "#ecfdf5",
                "text-med":         "#a7c4ab",
                "text-lo":          "#6b7d6b",
                "djinni-purple":    "#1a0b2e",
                "djinni-gold":      "#d4af37",
                "ember":            "#c9a227",
            },
            fontFamily: {
                "display": ["Cinzel", "serif"],
                "heading": ["Cinzel", "serif"],
                "mystical": ["Cinzel Decorative", "serif"],
                "body":    ["Lexend", "sans-serif"],
                "sans":    ["Lexend", "sans-serif"],
            },
            borderRadius: {
                "lg": "0.5rem",
                "xl": "0.75rem",
            },
            boxShadow: {
                "glow":         "0 0 15px rgba(34,197,94,0.35)",
                "glow-hover":   "0 6px 28px rgba(34,197,94,0.55)",
                "glow-sm":      "0 0 8px rgba(34,197,94,0.25)",
                "lift":         "0 8px 24px rgba(0,0,0,0.45)",
                "arcane":       "0 0 0 1px rgba(34,197,94,0.12), 0 8px 32px rgba(0,0,0,0.55), inset 0 1px 0 rgba(34,197,94,0.06)",
                "arcane-hover": "0 0 0 1px rgba(34,197,94,0.32), 0 12px 40px rgba(0,0,0,0.65), inset 0 1px 0 rgba(34,197,94,0.12), 0 0 24px rgba(34,197,94,0.07)",
            },
            keyframes: {
                shimmer: {
                    "0%":   { backgroundPosition: "-300px 0" },
                    "100%": { backgroundPosition: "300px 0" },
                },
                "fade-in": {
                    "0%":   { opacity: "0", transform: "translateY(4px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
                "slide-up": {
                    "0%":   { opacity: "0", transform: "translateY(20px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
                "toast-in": {
                    "0%":   { opacity: "0", transform: "translateY(12px) scale(0.96)" },
                    "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
                },
                "glow-pulse": {
                    "0%, 100%": { filter: "drop-shadow(0 0 4px rgba(34,197,94,0.4))" },
                    "50%":      { filter: "drop-shadow(0 0 14px rgba(34,197,94,0.85))" },
                },
            },
            animation: {
                shimmer:       "shimmer 1.4s linear infinite",
                "fade-in":     "fade-in 0.18s ease-out both",
                "slide-up":    "slide-up 0.45s cubic-bezier(0.16,1,0.3,1) both",
                "toast-in":    "toast-in 0.22s cubic-bezier(.2,.9,.3,1.2) both",
                "glow-pulse":  "glow-pulse 3s ease-in-out infinite",
            },
        },
    },
    plugins: [
        forms,
        containerQueries,
    ],
}
