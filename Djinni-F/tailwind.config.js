/** @type {import('tailwindcss').Config} */
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
                // Colores extraídos exactamente de tu HTML
                "primary": "#13ec5b",
                "background-light": "#f6f8f6",
                "background-dark": "#102216",
                "primary-dark": "#0fa841",
                "djinni-purple": "#1a0b2e",
                "djinni-gold": "#d4af37",
            },
            fontFamily: {
                "display": ["Lexend", "sans-serif"],
                "mystical": ["Cinzel Decorative", "serif"],
                // Aseguramos que la fuente por defecto sea Lexend
                "sans": ["Lexend", "sans-serif"],
            },
            borderRadius: {
                "lg": "0.5rem",
                "xl": "0.75rem",
            },
            boxShadow: {
                "glow": "0 0 15px rgba(19, 236, 91, 0.4)",
                "glow-hover": "0 0 25px rgba(19, 236, 91, 0.6)",
            }
        },
    },
    plugins: [
        require('@tailwindcss/forms'),
        require('@tailwindcss/container-queries'),
    ],
}