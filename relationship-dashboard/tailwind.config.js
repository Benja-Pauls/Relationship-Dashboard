/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        warm: {
          50: '#fdf7f0',
          100: '#fbeee0',
          200: '#f7dcc1',
          300: '#f1c29b',
          400: '#e9a473',
          500: '#e28c54',
          600: '#d57749',
          700: '#b2613e',
          800: '#8f5139',
          900: '#744330',
        },
        love: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
        }
      },
      fontSize: {
        'touch': ['1.125rem', { lineHeight: '1.75rem' }], // Large touch-friendly text
      },
      spacing: {
        'touch': '3rem', // Large touch targets
      }
    },
  },
  plugins: [],
} 