/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // The web source uses Tailwind CSS v4 while NativeWind currently compiles with
        // Tailwind v3. Pin the v4 palette here so identically named utilities render the
        // same color on both sides of the visual comparison.
        slate: { 50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cad5e2', 400: '#90a1b9', 500: '#62748e', 600: '#45556c', 700: '#314158', 800: '#1d293d', 900: '#0f172b', 950: '#020618' },
        green: { 50: '#f0fdf4', 100: '#dbfce7', 200: '#b9f8cf', 300: '#7bf1a8', 400: '#05df72', 500: '#00c950', 600: '#00a63e', 700: '#008236', 800: '#016630', 900: '#0d542b', 950: '#032e15' },
        red: { 50: '#fef2f2', 100: '#ffe2e2', 200: '#ffc9c9', 300: '#ffa2a2', 400: '#ff6467', 500: '#fb2c36', 600: '#e7000b', 700: '#c10007', 800: '#9f0712', 900: '#82181a', 950: '#460809' },
        orange: { 50: '#fff7ed', 100: '#ffedd4', 200: '#ffd6a7', 300: '#ffb86a', 400: '#ff8904', 500: '#ff6900', 600: '#f54900', 700: '#ca3500', 800: '#9f2d00', 900: '#7e2a0c', 950: '#441306' },
        amber: { 50: '#fffbeb', 100: '#fef3c6', 200: '#fee685', 300: '#ffd230', 400: '#ffb900', 500: '#fe9a00', 600: '#e17100', 700: '#bb4d00', 800: '#973c00', 900: '#7b3306', 950: '#461901' },
        yellow: { 50: '#fefce8', 100: '#fef9c2', 200: '#fff085', 300: '#ffdf20', 400: '#fdc700', 500: '#f0b100', 600: '#d08700', 700: '#a65f00', 800: '#894b00', 900: '#733e0a', 950: '#432004' },
        emerald: { 50: '#ecfdf5', 100: '#d0fae5', 200: '#a4f4cf', 300: '#5ee9b5', 400: '#00d492', 500: '#00bc7d', 600: '#009966', 700: '#007a55', 800: '#006045', 900: '#004f3b', 950: '#002c22' },
        blue: { 50: '#eff6ff', 100: '#dbeafe', 200: '#bedbff', 300: '#8ec5ff', 400: '#50a2ff', 500: '#2b7fff', 600: '#155dfc', 700: '#1447e6', 800: '#193cb8', 900: '#1c398e', 950: '#162556' },
        indigo: { 50: '#eef2ff', 100: '#e0e7ff', 200: '#c6d2ff', 300: '#a3b3ff', 400: '#7c86ff', 500: '#615fff', 600: '#4f39f6', 700: '#432dd7', 800: '#372aac', 900: '#312c85', 950: '#1e1a4d' },
        pink: { 50: '#fdf2f8', 100: '#fce7f3', 200: '#fccee8', 300: '#fda5d5', 400: '#fb64b6', 500: '#f6339a', 600: '#e60076', 700: '#c6005c', 800: '#a3004c', 900: '#861043', 950: '#510424' },
        rose: { 50: '#fff1f2', 100: '#ffe4e6', 200: '#ffccd3', 300: '#ffa1ad', 400: '#ff637e', 500: '#ff2056', 600: '#ec003f', 700: '#c70036', 800: '#a50036', 900: '#8b0836', 950: '#4d0218' },
        // Literal brand hex values reused across the loyalty card, promo drawer,
        // and streak CTA in the original web app — named here instead of scattered
        // arbitrary-value hex across every screen.
        froo: {
          900: '#00220f',
          800: '#00391f',
          700: '#005c32',
          600: '#00753f',
          500: '#006320',
          amber: '#F29F05',
        },
      },
    },
  },
  plugins: [],
};
