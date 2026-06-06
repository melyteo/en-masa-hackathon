/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fdf4e7',
          100: '#fbe5c4',
          200: '#f7c98a',
          300: '#f3a84e',
          400: '#f08c1f',
          500: '#e07a0a',
          600: '#c46408',
          700: '#9e4e09',
          800: '#7e3e0e',
          900: '#673410',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
