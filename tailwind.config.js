
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#4C22BD",
          dark: "#351682",
          light: "#EFF6FF",
        },
        canvas: "#F5F7FB",
        surface: "#FFFFFF",
        ink: "#0F172A",
        muted: "#64748B",
        outline: "#E2E8F0",
      },
      borderRadius: {
        card: "20px",
      },
    },
  },
  plugins: [],
};
