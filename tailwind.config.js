/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#c3d809',
          dim: '#9faf07',
          ghost: '#c3d80920',
          border: '#c3d80960',
        },
        ink: {
          DEFAULT: '#222022',
          soft: '#3a383a',
          muted: '#6b696b',
          ghost: '#9e9c9e',
        },
        surface: {
          DEFAULT: '#ffffff',
          soft: '#f5f5f0',
          muted: '#eceae6',
          deep: '#e0deda',
        },
        success: {
          DEFAULT: '#2d9e5f',
          ghost: '#2d9e5f18',
        },
        warning: {
          DEFAULT: '#d4820a',
          ghost: '#d4820a18',
        },
        error: {
          DEFAULT: '#d93651',
          ghost: '#d9365118',
        },
        info: {
          DEFAULT: '#3a7ef5',
          ghost: '#3a7ef518',
        },
      },
      fontFamily: {
        'inter': ['Inter_400Regular', 'sans-serif'],
        'inter-medium': ['Inter_500Medium', 'sans-serif'],
        'inter-semibold': ['Inter_600SemiBold', 'sans-serif'],
        'inter-bold': ['Inter_700Bold', 'sans-serif'],
        'opensans': ['OpenSans_400Regular', 'sans-serif'],
        'opensans-semibold': ['OpenSans_600SemiBold', 'sans-serif'],
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '16': '64px',
      },
      boxShadow: {
        'glow-primary': '0 4px 12px rgba(195, 216, 9, 0.30)',
        'glow-fab': '0 6px 20px rgba(195, 216, 9, 0.35)',
        'raised-1': '0 1px 4px rgba(34, 32, 34, 0.07)',
        'raised-2': '0 2px 10px rgba(34, 32, 34, 0.09)',
        'raised-3': '0 4px 16px rgba(34, 32, 34, 0.12)',
        'raised-4': '0 8px 28px rgba(34, 32, 34, 0.15)',
        'raised-5': '0 20px 60px rgba(34, 32, 34, 0.18)',
      }
    },
  },
  plugins: [],
}