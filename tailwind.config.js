/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          yellow:  '#F5B731',
          blue:    '#3B82F6',
          purple:  '#8B5CF6',
          green:   '#22C55E',
          red:     '#EF4444',
        },
        surface: {
          primary:   '#0E1523',
          secondary: '#151B2D',
          card:      '#1A2035',
          elevated:  '#1E2845',
          border:    '#2A3550',
        },
      },
    },
  },
  plugins: [],
}