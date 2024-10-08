import defaultTheme from "tailwindcss/defaultTheme";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/**/*.astro"],
  plugins: [require("@tailwindcss/forms")],
  theme: {
    extend: {
      fontFamily: {
        sans: ["arvo", ...defaultTheme.fontFamily.sans],
      },
      keyframes: {
        spinTease: {
          "0%, 100%": { transform: "rotateY(0deg)" },
          "50%": { transform: "rotateY(20deg) skewY(7deg)" },
        },
        spinOut: {
          "0%": { transform: "rotateY(0deg)" },
          "100%": { transform: "rotateY(90deg) skewY(16deg)" },
        },
        spinIn: {
          "0%": { transform: "rotateY(270deg) skewY(-16deg)" },
          "100%": { transform: "rotateY(360deg)" },
        },
      },
      animation: {
        "spin-tease": "spinTease 1s ease-in-out 2",
      },
    },
  },
  safelist: ["animate-[spinIn]", "animate-[spinOut]"], // keyframes used by astro page transisions, so not classNamed
};
