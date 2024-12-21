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
        scroll: "scroll 8s linear infinite",
      },
      keyframes: {
        "subtle-zoom": {
          "0%": { transform: "scale(1)" },
          "100%": { transform: "scale(1.1)" },
        },
        scroll: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      screens: {
        xs: "375px", // iPhone 14
        sm: "640px", // Small tablets
        md: "768px", // iPads
        lg: "1024px", // Large tablets/small laptops
        xl: "1280px", // Laptops
        "2xl": "1536px", // Large screens
      },
      colors: {
        copper: {
          DEFAULT: "#C17F59",
          hover: "#A66B48",
        },
      },
    },
  },
  plugins: [aspectRatio],
};

export default config;
