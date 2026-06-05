/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Ivory & Emerald palette (see docs/DESIGN.md)
        cream: '#F4F0E6',
        surface: '#FFFFFF',
        line: '#E5E0D2',
        ink: '#1E2A2C',
        muted: '#889092',
        primary: {
          DEFAULT: '#1A3A2E',
          dark: '#122920',
        },
        accent: '#D14B6A',
        gold: {
          DEFAULT: '#C9A24A',
          light: '#F2E6C8',
        },
        available: '#2E8B6E',
        onloan: '#C57F33',
      },
      fontFamily: {
        sans: ['"Helvetica Neue"', 'Arial', 'system-ui', 'sans-serif'],
        display: ['Georgia', '"Times New Roman"', 'serif'],
      },
      backgroundImage: {
        tile: 'linear-gradient(#F0ECDD, #E3DBC4)',
      },
    },
  },
  plugins: [],
};
