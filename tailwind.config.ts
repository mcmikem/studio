
import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)'],
        heading: ['var(--font-space-grotesk)'],
        body: ['var(--font-inter)'],
      },
      colors: {
        // Omuto Brand Colors (Strict from blueprint)
        'omuto-red': '#EC1C24',
        'omuto-navy': '#231F20',
        'omuto-cream': '#F9F8F3',
        'omuto-yellow': '#FFCF5D',
        'omuto-brown': '#5D261B',
        'omuto-gold': '#D69100',
        'omuto-teal': '#40D2AF',
        'omuto-blue': '#96D9F2',
        
        // Semantic Colors based on Omuto Brand
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',

        // Chart colors - using Omuto palette
        chart: {
          '1': '#EC1C24',
          '2': '#FFCF5D',
          '3': '#40D2AF',
          '4': '#3591FF',
          '5': '#231F20',
        },

        // Sidebar - high contrast light theme
        sidebar: {
          DEFAULT: '#FFFFFF',
          foreground: '#231F20',
          primary: '#EC1C24',
          'primary-foreground': '#FFFFFF',
          accent: '#F9F8F3',
          'accent-foreground': '#EC1C24',
          border: '#231F20',
          ring: '#EC1C24',
        },
      },
      boxShadow: {
        'comic': '2px 2px 0 rgba(29, 38, 49, 1)',
        'comic-lg': '4px 4px 0 rgba(29, 38, 49, 1)',
        'comic-sm': '1px 1px 0 rgba(29, 38, 49, 1)',
        'soft': '0 4px 10px rgba(0,0,0,0.05), 0 2px 5px rgba(0,0,0,0.02)',
      },
      borderWidth: {
        DEFAULT: '1px',
        '2': '2px',
        '3': '3px',
        '4': '4px',
        '6': '6px',
        'px': '1px',
        'md': '2px',
        'lg': '3px',
        'xl': '4px',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        'xl': 'calc(var(--radius) + 4px)',
        '2xl': 'calc(var(--radius) + 12px)',
        '3xl': 'calc(var(--radius) + 20px)',
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
        'marquee': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' }, // Adjusted for smoother looping
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'marquee': 'marquee 20s linear infinite',
      },
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom, 0px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
