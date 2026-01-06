/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: '#0a0e27',
          darker: '#060918',
          accent: '#00d9ff',
          purple: '#9d4edd',
          red: '#ff006e',
          green: '#06ffa5',
        }
      }
    },
  },
  plugins: [],
}