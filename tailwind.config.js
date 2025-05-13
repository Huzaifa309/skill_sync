/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: '#2c3e50',
        secondary: '#34495e',
        success: '#27ae60',
        error: '#c0392b',
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(to right, var(--container-gradient-start), var(--container-gradient-end))',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}

