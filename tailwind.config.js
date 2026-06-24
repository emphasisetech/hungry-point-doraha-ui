/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          red: "#e11d2f",
          orange: "#f97316",
          ink: "#191716",
          cream: "#fff7ed"
        }
      },
      boxShadow: {
        soft: "0 18px 50px rgba(25, 23, 22, 0.12)"
      }
    }
  },
  plugins: []
};
