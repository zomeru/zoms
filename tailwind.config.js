/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        backgroundPrimary: '#0e0e0e',
        backgroundSecondary: '#1a1a1a',
        primary: '#ad5aff',
        secondary: '#ffb2de',
        textPrimary: '#f2f2f2',
        textSecondary: '#919191'
      }
    }
  },
  plugins: []
};
