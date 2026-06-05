/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Clasp brand palette (see docs/DESIGN.md)
        cream: '#F5ECD7', // Ivory — app background
        surface: '#FFFFFF',
        line: '#E5E0D2',
        ink: '#2A2A2A', // Near Black — body text
        muted: '#889092',
        primary: {
          DEFAULT: '#1A3A2E', // Deep Emerald
          dark: '#122920',
        },
        accent: '#8B1A2B', // Ruby Red — alerts, notifications, destructive
        gold: {
          DEFAULT: '#B8960C', // Antique Gold — CTAs / badges
          warm: '#D4AF6B', // Warm Gold — decorative / icons
          light: '#F2E6C8',
        },
        available: '#2E8B6E',
        onloan: '#C57F33',
      },
      fontFamily: {
        sans: ['"Helvetica Neue"', 'Arial', 'system-ui', 'sans-serif'],
        display: ['Georgia', '"Times New Roman"', 'serif'],
        playfair: ['"Playfair Display"', 'Georgia', 'serif'],
        montserrat: ['Montserrat', '"Helvetica Neue"', 'Arial', 'sans-serif'],
      },
      backgroundImage: {
        tile: 'linear-gradient(#F0ECDD, #E3DBC4)',
      },
    },
  },
  plugins: [],
};
