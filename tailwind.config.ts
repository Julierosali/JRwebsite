import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        anton: ['var(--font-anton)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
        title: ['var(--font-title)', 'sans-serif'],
      },
      colors: {
        orange: {
          DEFAULT: '#e07c4a',
          light: '#f4a574',
        },
        blue: {
          DEFAULT: '#2d5a7b',
          light: '#4a8bb8',
        },
        violet: {
          DEFAULT: '#6b4e9e',
          light: '#8b6bb8',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.6s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
