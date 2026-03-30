/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717'
        },
        red: {
          500: '#dc2626',
          700: '#b91c1c'
        },
        green: {
          500: '#16a34a',
          700: '#15803d'
        }
      }
    }
  },
  plugins: []
};
