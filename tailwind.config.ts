import type { Config } from "tailwindcss";
import aspectRatio from "@tailwindcss/aspect-ratio";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      aspectRatio: {
        square: "1 / 1",
      },
      animation: {
        "subtle-zoom": "subtle-zoom 20s infinite alternate",
      },
      keyframes: {
        "subtle-zoom": {
          "0%": { transform: "scale(1)" },
          "100%": { transform: "scale(1.1)" },
        },
      },
    },
  },
  plugins: [aspectRatio],
};

export default config;
