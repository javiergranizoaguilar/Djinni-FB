export default {
    content: [
        "./index.html",
        // Esta línea le dice: "Busca en la carpeta src, en cualquier subcarpeta, archivos js, jsx, ts o tsx"
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    plugins: {
        tailwindcss: {},
        autoprefixer: {},
    },
}