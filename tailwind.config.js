import tailwindcssAnimate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './index.tsx',
    './App.tsx',
    './components/**/*.tsx',
    './contexts/**/*.tsx',
    './views/**/*.tsx',
  ],
  theme: {
    extend: {},
  },
  plugins: [tailwindcssAnimate],
};
