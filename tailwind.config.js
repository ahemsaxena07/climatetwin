/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        forest: '#062E25',
        pine: '#103D31',
        leaf: '#176B45',
        lime: '#B8F36B',
        limepale: '#E8F8C9',
        ivory: '#F7F7F0',
        ink: '#10221D',
        muted: '#64716B',
        line: '#E4E8E0',
        heat: '#FF725E',
        warm: '#FFB547',
        cool: '#1685FF',
        vent: '#20B85A',
        ac: '#873DF2',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: { card: '0 1px 2px rgba(16,34,29,0.04), 0 1px 3px rgba(16,34,29,0.04)' },
    },
  },
  plugins: [],
}
