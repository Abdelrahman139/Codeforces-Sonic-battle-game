/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'sonic-blue': '#3061E3',
        'sonic-red': '#FF0000',
        'sonic-gold': '#FFD700',
      },
      animation: {
        'sonic-run': 'sonic-run 0.5s steps(4) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'ring-collect': 'ring-collect 0.6s ease-out',
        'float': 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'sonic-run': {
          '0%': { backgroundPosition: '0%' },
          '100%': { backgroundPosition: '100%' },
        },
        'glow': {
          '0%': { 
            boxShadow: '0 0 5px #3061E3, 0 0 10px #3061E3, 0 0 15px #3061E3',
          },
          '100%': { 
            boxShadow: '0 0 10px #3061E3, 0 0 20px #3061E3, 0 0 30px #3061E3, 0 0 40px #3061E3',
          },
        },
        'ring-collect': {
          '0%': { transform: 'scale(0) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'scale(2) rotate(360deg)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}
