const { resolve } = require('node:path')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./docs/**/*.{html,md,mdx,tsx,js,jsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
}
