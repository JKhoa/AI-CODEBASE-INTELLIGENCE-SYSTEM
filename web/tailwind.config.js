/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        ink: {
          50:  '#F4F6FA', 100: '#E4E8F0', 200: '#C9CFDB', 300: '#8C95A8',
          400: '#6E7689', 500: '#5A6273', 600: '#3A4150', 700: '#262C37',
          800: '#161A22', 900: '#0E1116', 950: '#0B0D10',
        },
        teal:    { 300: '#5EEAD4', 400: '#2DD4BF', 500: '#14B8A6' },
        red:     { 300: '#FCA5A5', 400: '#F87171', 500: '#EF4444' },
        amber:   { 200: '#FDE68A', 300: '#FCD34D', 400: '#FBBF24', 500: '#F59E0B' },
        yellow:  { 200: '#FEF08A', 400: '#FACC15' },
        emerald: { 300: '#6EE7B7', 500: '#10B981' },
        blue:    { 300: '#93C5FD', 500: '#3B82F6' },
        violet:  { 300: '#C4B5FD', 500: '#8B5CF6' },
      },
      borderRadius: { xl2: '14px' },
      boxShadow: {
        soft: '0 1px 2px rgba(0,0,0,.25), 0 4px 12px -4px rgba(0,0,0,.35)',
        glow: '0 0 0 1px rgba(20,184,166,.25), 0 8px 28px -10px rgba(20,184,166,.55)',
      },
    },
  },
  plugins: [],
};
