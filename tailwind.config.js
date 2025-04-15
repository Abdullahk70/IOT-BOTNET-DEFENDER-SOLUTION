/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f1ff',
          100: '#b3d1ff',
          200: '#80b1ff',
          300: '#4d91ff',
          400: '#1a71ff',
          500: '#0051e6',
          600: '#0040b3',
          700: '#003080',
          800: '#00204d',
          900: '#00101a',
        },
        secondary: {
          50: '#f0f5ff',
          100: '#d6e4ff',
          200: '#adc6ff',
          300: '#85a5ff',
          400: '#597ef7',
          500: '#2f54eb',
          600: '#1d39c4',
          700: '#10239e',
          800: '#061178',
          900: '#030852',
        },
        success: {
          50: '#e6fff2',
          100: '#b3ffdb',
          200: '#80ffc3',
          300: '#4dffab',
          400: '#1aff94',
          500: '#00cc71',
          600: '#009954',
          700: '#006638',
          800: '#00331c',
          900: '#001100',
        },
        danger: {
          50: '#ffebef',
          100: '#ffccd5',
          200: '#ffadb9',
          300: '#ff8da0',
          400: '#ff6e87',
          500: '#ff4d6e',
          600: '#cc3e58',
          700: '#992e42',
          800: '#661f2c',
          900: '#330f16',
        },
        warning: {
          50: '#fff8e6',
          100: '#ffeab3',
          200: '#ffdc80',
          300: '#ffce4d',
          400: '#ffc01a',
          500: '#e6a800',
          600: '#b38200',
          700: '#805c00',
          800: '#4d3600',
          900: '#1a1100',
        },
        dark: {
          100: '#d5d7e0',
          200: '#acaebf',
          300: '#8c8fa3',
          400: '#666980',
          500: '#4d4f66',
          600: '#34354a',
          700: '#2b2c3d',
          800: '#1d1e30',
          900: '#0c0d21',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gradient': 'gradient 8s linear infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        gradient: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },
      boxShadow: {
        'glow': '0 0 20px rgba(79, 109, 245, 0.25)',
        'glow-lg': '0 0 30px rgba(79, 109, 245, 0.35)',
      },
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [],
}

