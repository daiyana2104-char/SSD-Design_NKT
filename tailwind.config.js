/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        maroon: {
          50: '#fdf3f4', 100: '#fbe6e8', 200: '#f7ccd1', 300: '#efa3ad',
          400: '#e37080', 500: '#d4475c', 600: '#b62f45', 700: '#942237',
          800: '#7a1f30', 900: '#5f1826', 950: '#3a0e18',
        },
        saffron: {
          50: '#fff8ed', 100: '#ffefd4', 200: '#fed9a8', 300: '#fdba70',
          400: '#fc9437', 500: '#fa7710', 600: '#eb5c06', 700: '#c24307',
          800: '#9a360d', 900: '#7c2f0e', 950: '#431704',
        },
        gold: {
          50: '#fdfaec', 100: '#faf3c7', 200: '#f4e78d', 300: '#eed954',
          400: '#e9c827', 500: '#d4ab0f', 600: '#b8860a', 700: '#94630c',
          800: '#7a4e10', 900: '#664012', 950: '#3c2306',
        },
        brown: {
          50: '#f8f5f3', 100: '#efe6e0', 200: '#ddc9bd', 300: '#c7a694',
          400: '#b07f66', 500: '#9a6348', 600: '#7e4d38', 700: '#653e2e',
          800: '#523226', 900: '#432a22', 950: '#251512',
        },
        cream: {
          50: '#fdfcfa', 100: '#faf6f0', 200: '#f5ece0', 300: '#eedcc6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(94, 47, 18, 0.06), 0 1px 2px rgba(94, 47, 18, 0.04)',
        'card-hover': '0 8px 24px rgba(94, 47, 18, 0.10), 0 2px 6px rgba(94, 47, 18, 0.06)',
      },
    },
  },
  plugins: [],
};
