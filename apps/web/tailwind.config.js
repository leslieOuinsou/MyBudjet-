//** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class', // Active le mode sombre via la classe 'dark'
  theme: {
    extend: {
      colors: {
        primary: '#488E38',      // New primary green
        accent: '#488E38',       // Match accent to primary green
        neutral: '#CDCDCD',      // Silver
        muted: '#7C7C7C',        // Boulder
        background: '#F9F9F9',   // Fond clair
        text: '#080808',         // Texte principal (noir/gris foncé)
        'text-secondary': '#7C7C7C', // Boulder pour texte secondaire
        'card-bg': '#FFFFFF',    // Blanc pour les cartes
        'border-color': '#CDCDCD', // Silver pour les bordures
        'red-500': '#FA4739',    // Sunset Orange pour les dépenses
        'green-500': '#00D4AA',  // Vert pour les revenus
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}