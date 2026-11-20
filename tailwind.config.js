/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/renderer/index.html',
    './src/renderer/src/**/*.{js,ts,jsx,tsx}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#0d1117',
        surface: '#161b22',
        surfaceHover: '#21262d',
        border: '#30363d',
        accent: '#58a6ff',
        dockerGreen: '#2ea043',
        dockerYellow: '#d29922',
        dockerRed: '#f85149'
      }
    }
  },
  plugins: []
};
