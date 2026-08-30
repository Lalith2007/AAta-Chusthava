/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0a0d14',
          darker: '#06080d',
          card: '#121722',
          'card-hover': '#182030',
          border: '#222d42',
          gold: '#f59e0b',
          'gold-light': '#fbbf24',
          emerald: '#10b981',
          'emerald-light': '#34d399',
          crimson: '#ef4444',
          yellow: '#eab308',
          blue: '#3b82f6',
          purple: '#8b5cf6',
          muted: '#64748b',
          subtle: '#94a3b8',
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-cinzel)', 'Georgia', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'flip-in': 'flipIn 0.5s ease forwards',
        'pulse-subtle': 'pulseSubtle 2s infinite',
        'glow': 'glow 3s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        flipIn: {
          '0%': { transform: 'rotateX(-90deg)', opacity: '0' },
          '100%': { transform: 'rotateX(0deg)', opacity: '1' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        glow: {
          '0%': { boxShadow: '0 0 15px rgba(245, 158, 11, 0.2)' },
          '100%': { boxShadow: '0 0 30px rgba(245, 158, 11, 0.5)' },
        }
      }
    },
  },
  plugins: [],
}
