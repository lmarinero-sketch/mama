/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#F4F7F3",
          card: "#FFFFFF",
          secondary: "#CBD8C8",
          brown: "#5E7B60",
          dark: "#243627",
          yellow: "#DCE6C6",
          softYellow: "#EBF2DC",
          green: "#90A88D",
          red: "#E5A9A4",
          cream: "#E8EFE6"
        },
        cream: {
          50: '#F4F7F3',
          100: '#E8EFE6',
          200: '#CBD8C8',
        },
        deli: {
          50: '#F4F7F3',
          100: '#EBF2DC',
          200: '#DCE6C6',
          500: '#5E7B60',
          600: '#4F6951',
          700: '#3D523F',
          800: '#243627',
        }
      },
      fontFamily: {
        sans: ['Calibri', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(94, 123, 96, 0.08)',
        'soft-lg': '0 10px 25px -3px rgba(36, 54, 39, 0.12)',
        'mobile-card': '0 4px 20px -2px rgba(94, 123, 96, 0.08)',
        'mobile-nav': '0 -4px 25px 0 rgba(36, 54, 39, 0.08)',
      }
    },
  },
  plugins: [],
}
