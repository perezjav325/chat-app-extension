/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"Monaco"', "monospace"],
        "sans-serif": ["Nunito", "sans-serif"],
      },
    },
  },
  plugins: [],
};
