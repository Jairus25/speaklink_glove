/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        glove: {
          bg: '#0a0d14',
          card: '#111726',
          cardHover: '#161f33',
          border: '#1e293b',
          borderLight: '#334155',
          accent: '#06b6d4',      // Cyan accent
          accentHover: '#0891b2',
          primary: '#3b82f6',     // Blue
          emerald: '#10b981',
          danger: '#ef4444',
          dangerDark: '#7f1d1d',
          textMuted: '#94a3b8',
          textBright: '#f8fafc',
        }
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'bounce-subtle': 'bounce 2s infinite',
      }
    },
  },
  plugins: [],
}
