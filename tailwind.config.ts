import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        // Brand colors
        brand: {
          900: '#0D1F23',
          800: '#132E35',
          700: '#2D4A53',
          600: '#5A636A',
          500: '#69818D',
          300: '#AFB3B7',
        },
        // Theme colors
        bg: '#0D1F23',
        fg: '#AFB3B7',
        surface: '#132E35',

        // shadcn/ui compatible colors
        background: '#0D1F23',
        foreground: '#AFB3B7',

        card: {
          DEFAULT: '#132E35',
          foreground: '#AFB3B7',
        },
        popover: {
          DEFAULT: '#132E35',
          foreground: '#AFB3B7',
        },
        primary: {
          DEFAULT: '#2D4A53',
          foreground: '#AFB3B7',
        },
        secondary: {
          DEFAULT: '#5A636A',
          foreground: '#AFB3B7',
        },
        muted: {
          DEFAULT: '#5A636A',
          foreground: '#AFB3B7',
        },
        accent: {
          DEFAULT: '#2D4A53',
          foreground: '#AFB3B7',
        },
        destructive: {
          DEFAULT: '#dc2626',
          foreground: '#fef2f2',
        },
        border: '#2D4A53',
        input: '#2D4A53',
        ring: '#69818D',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
