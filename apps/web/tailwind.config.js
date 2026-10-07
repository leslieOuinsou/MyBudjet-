//** @type {import('tailwindcss').Config} */
// Charte graphique MyBudget+ :
//   bleu #2563EB (principal) · bleu foncé #1E3A8A (titres, sidebar) · blanc #FFFFFF (cartes)
//   gris très clair #F8FAFC (fond) · bleu-noir #0F172A (texte) · vert #16A34A (revenus, positif)
//   rouge #DC2626 (dépenses, dépassement) · orange #F59E0B (alerte) · bleu clair #DBEAFE (badges)
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class', // Active le mode sombre via la classe 'dark'
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#2563EB', hover: '#1D4ED8', light: '#DBEAFE', dark: '#1E3A8A' },
        success: { DEFAULT: '#16A34A', hover: '#15803D', light: '#DCFCE7', dark: '#166534' },
        danger: { DEFAULT: '#DC2626', hover: '#B91C1C', light: '#FEE2E2' },
        warning: { DEFAULT: '#F59E0B', hover: '#D97706', light: '#FEF3C7' },
        // Gris à dominante bleu-ardoise, assortis au texte #0F172A
        gray: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
        background: '#F8FAFC',
        text: { primary: '#0F172A', secondary: '#64748B', tertiary: '#334155' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
