import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        studio: {
          bg: "#090A0F",
          panel: "#11131C",
          card: "#181B28",
          border: "#252A3D",
          accent: "#6366F1",
          cyan: "#06B6D4",
        },
      },
    },
  },
  plugins: [],
};
export default config;

