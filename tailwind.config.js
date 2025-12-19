/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // BotDojo Brand Colors
        'botdojo': {
          primary: '#6366f1',
          secondary: '#8b5cf6',
          accent: '#ec4899',
          dark: '#0f172a',
          'dark-secondary': '#1e293b',
          'dark-tertiary': '#334155',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-botdojo': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'gradient-botdojo-hover': 'linear-gradient(135deg, #7e8ef5 0%, #8b5fbd 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { 
            boxShadow: '0 0 5px rgba(99, 102, 241, 0.2), 0 0 10px rgba(99, 102, 241, 0.1)' 
          },
          '100%': { 
            boxShadow: '0 0 10px rgba(99, 102, 241, 0.4), 0 0 20px rgba(99, 102, 241, 0.2)' 
          },
        },
      },
    },
  },
  plugins: [],
}

