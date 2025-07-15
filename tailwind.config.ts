import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}", "./src/**/*.html"],
  theme: {
    extend: {
      colors: {
        palette1: "#f1fb52", // light yellow
        palette2: "#effb51", // similar yellow
        palette3: "#5c5d24", // olive green
        palette4: "#221d13", // dark brown
        palette5: "#f0fc52", // neon yellow
      },
    },
  },
  plugins: [],
};

export default config; 