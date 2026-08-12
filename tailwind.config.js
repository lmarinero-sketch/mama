/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FFFDF9',
          100: '#FDF9F0',
          200: '#F7EFE0',
        },
        deli: {
          50: '#FFF1F2',
          100: '#FFE4E6',
          200: '#FECDD3',
          500: '#F43F5E',
          600: '#E11D48',
          700: '#BE123C',
          800: '#9F1239',
        },
        sage: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          500: '#10B981',
          600: '#059669',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'mobile-card': '0 4px 20px -2px rgba(160, 50, 70, 0.06), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        'mobile-nav': '0 -4px 25px 0 rgba(0, 0, 0, 0.08)',
      }
    },
  },
  plugins: [],
}
