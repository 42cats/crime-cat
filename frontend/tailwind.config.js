/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Tailwind가 스캔할 파일 경로
  ],
  theme: {
    extend: {},
  },
  plugins: [require("@tailwindcss/typography")],
};
