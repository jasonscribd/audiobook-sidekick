import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}", "./src/**/*.html"],
  theme: {
    extend: {
      fontFamily: {
        'inter': ['Inter', 'system-ui', 'sans-serif'],
        'merriweather': ['Merriweather', 'serif'],
      },
      colors: {
        // New design system colors
        'bg': '#201C14',
        'bge': '#3B3934', 
        'text': '#EDEDED',
        'text-muted': '#B9B9B9',
        'accent': '#F2FD53',
        'track': '#4A4946',
        // Legacy colors (keeping for compatibility)
        palette1: "#f1fb52",
        palette2: "#effb51", 
        palette3: "#5c5d24",
        palette4: "#221d13",
        palette5: "#f0fc52",
      },
      boxShadow: {
        'accent-glow': '0 0 60px rgba(242, 253, 83, 0.25)',
        'img-soft': '0 20px 40px rgba(0, 0, 0, 0.35)',
      },
      backgroundImage: {
        'warm-gradient': 'radial-gradient(ellipse at center top, #201C14 0%, #2B241D 45%, #3B3934 100%)',
      },
    },
  },
  plugins: [],
};

export default config; 