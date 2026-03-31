import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: "#2040e8",
        "brand-light": "#dcdcff",
        "savings-green": "#00c896",
        "savings-light": "#d4fff5",
      },
    },
  },
  plugins: [],
};

export default config;
