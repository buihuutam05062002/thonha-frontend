/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#f5820d",
          dark: "#e0750c",
          soft: "#fff4e6",
          line: "#fbc98a",
        },
        ink: "#172033",
        navy: "#1e293b",
        subtle: "#64748b",
        line: "#e2e8f0",
        surface: "#f8fafc",
      },
      spacing: {
        "12px": "12px",
        "16px": "16px",
        "20px": "20px",
      },
    },
  },
  plugins: [],
};
