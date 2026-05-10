/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#102a43',
        sky: '#e8f5ff',
        coral: '#ff7f50',
        brass: '#c78c2b',
      },
      boxShadow: {
        panel: '0 20px 45px rgba(16, 42, 67, 0.12)',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
