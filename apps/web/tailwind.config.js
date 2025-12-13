//** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class', // Active le mode sombre via la classe 'dark'
  theme: {
    extend: {
      colors: {
        // Bleu - Confiance, fiabilité, sécurité (couleur principale)
        primary: {
          DEFAULT: '#1E73BE',
          hover: '#155a8a',
          light: '#E3F2FD',
          dark: '#0d4a6f',
        },
        // Vert - Argent, croissance, succès financier
        success: {
          DEFAULT: '#28A745',
          hover: '#218838',
          light: '#D4EDDA',
          dark: '#1e7e34',
        },
        // Gris/Anthracite - Sérieux, sobriété, neutre
        gray: {
          50: '#F8F9FA',
          100: '#F5F7FA',
          200: '#E9ECEF',
          300: '#DEE2E6',
          400: '#CED4DA',
          500: '#ADB5BD',
          600: '#6C757D',
          700: '#495057',
          800: '#343A40',
          900: '#212529',
        },
        // Danger - Utilisé uniquement pour les erreurs critiques
        danger: {
          DEFAULT: '#DC3545',
          hover: '#c82333',
          light: '#F8D7DA',
        },
        // Couleurs utilitaires
        background: '#F5F7FA',
        text: {
          primary: '#343A40',
          secondary: '#6C757D',
          tertiary: '#495057',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}