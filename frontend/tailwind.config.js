/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9f1',
          100: '#dcf0de',
          200: '#b9e1be',
          300: '#8fca99',
          400: '#64ad72',
          500: '#2e6b3e',
          600: '#235632',
          700: '#1a4226',
          800: '#12301c',
          900: '#0a1f12',
        },
        secondary: {
          50: '#e6f0f5',
          100: '#ccdae8',
          200: '#99b5d1',
          300: '#6690ba',
          400: '#336ba3',
          500: '#0a2351',
          600: '#081c41',
          700: '#061531',
          800: '#040e21',
          900: '#020710',
        },
      },
      fontFamily: {
        sans: ['Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
