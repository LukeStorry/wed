import defaultTheme from "tailwindcss/defaultTheme";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.astro"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Berkshire Swash", ...defaultTheme.fontFamily.sans],
      },
    },
  },
};
