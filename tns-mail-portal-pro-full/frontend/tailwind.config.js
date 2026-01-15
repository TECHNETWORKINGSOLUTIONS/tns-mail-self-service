
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html','./src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        tnsbg: '#1e1e2f',
        tnspanel: '#2a2a40',
        tnsink: '#eaf0ff',
        tnsmuted: '#a7b2d1',
        tnsaccent: '#6c63ff',
        tnsaccent2: '#5548d9'
      }
    }
  },
  plugins: []
}
