/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './components/**/*.{vue,js}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './composables/**/*.js',
    './plugins/**/*.js',
    './utils/**/*.js',
    './data/**/*.js',
    './app.vue',
    './error.vue',
  ],
  theme: {
    extend: {
      colors: {
        tomato: {
          50: '#FDF0EF',
          100: '#FADBD8',
          200: '#F3B0AA',
          300: '#EA7D74',
          400: '#E04F44',
          500: '#D62828',
          600: '#B81F21',
          700: '#93191B',
          800: '#6E1416',
          900: '#4A0E10',
        },
        ember: {
          50: '#FFF4E6',
          100: '#FFE3BF',
          200: '#FFC985',
          300: '#FFAE4C',
          400: '#FB9624',
          500: '#F77F00',
          600: '#D46A00',
          700: '#A85400',
        },
        gold: {
          100: '#FEF1D6',
          200: '#FDE2AA',
          300: '#FDD27D',
          400: '#FCBF49',
          500: '#F0A91C',
          600: '#C98A0E',
        },
        cream: {
          50: '#FFFCF7',
          100: '#FFF8ED',
          200: '#F9EDDA',
          300: '#F1DFC2',
          400: '#E6CDA6',
        },
        charcoal: {
          50: '#F5F2F0',
          200: '#CFC5BF',
          300: '#A3958D',
          400: '#76665E',
          500: '#4D3F38',
          600: '#3A2F2A',
          700: '#2D2420',
          800: '#211A17',
          900: '#171210',
        },
        olive: {
          100: '#EEF0DC',
          300: '#BDC28A',
          500: '#7C8445',
          600: '#646B35',
          700: '#4B5128',
        },
        brown: {
          700: '#4A3227',
          800: '#3B271F',
          900: '#2B1C16',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'Cambria', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        warm: '0 10px 30px -10px rgba(74, 14, 16, 0.25), 0 4px 10px -4px rgba(33, 26, 23, 0.12)',
        'warm-lg': '0 30px 60px -20px rgba(74, 14, 16, 0.35), 0 12px 24px -12px rgba(33, 26, 23, 0.2)',
        glow: '0 0 0 1px rgba(252, 191, 73, 0.4), 0 8px 30px -6px rgba(247, 127, 0, 0.55)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      keyframes: {
        bump: {
          '0%, 100%': { transform: 'scale(1)' },
          '40%': { transform: 'scale(1.35)' },
        },
        'slow-spin': {
          to: { transform: 'rotate(360deg)' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.82' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        floaty: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        bump: 'bump 0.45s ease-out',
        'slow-spin': 'slow-spin 80s linear infinite',
        flicker: 'flicker 2.4s ease-in-out infinite',
        shimmer: 'shimmer 1.6s infinite',
        floaty: 'floaty 3.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
