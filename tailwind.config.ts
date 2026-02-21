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
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Space Grotesk', 'sans-serif'],
        sketch: ['Gochi Hand', 'cursive'],
        body: ['Inter', 'sans-serif'], // Ensure Inter is also available for body text
        headline: ['Space Grotesk', 'sans-serif'], // Keeping for consistency with blueprint
      },
      colors: {
        // Omuto Brand Colors (Strict from blueprint)
        'omuto-red': '#EE2726',
        'omuto-navy': '#1D2631',
        'omuto-cream': '#F9F8F3',
        'omuto-yellow': '#FFCF5D',
        'omuto-brown': '#5D261B',
        'omuto-gold': '#D69100',
        'omuto-teal': '#40D2AF',
        'omuto-blue': '#96D9F2',
        
        // Semantic Colors based on Omuto Brand
        background: '#F9F8F3', // omuto-cream
        foreground: '#1D2631', // omuto-navy
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#1D2631',
        },
        popover: {
          DEFAULT: '#FFFFFF',
          foreground: '#1D2631',
        },
        primary: {
          DEFAULT: '#EE2726', // omuto-red
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#1D2631', // omuto-navy
          foreground: '#FFFFFF',
        },
        muted: {
          DEFAULT: '#F0F0F0', // light grey
          foreground: '#1D2631', // omuto-navy for contrast
        },
        accent: {
          DEFAULT: '#FFCF5D', // omuto-yellow
          foreground: '#1D2631', // omuto-navy
        },
        destructive: {
          DEFAULT: '#EE2726', // Using omuto-red for destructive
          foreground: '#FFFFFF',
        },
        border: '#1D2631', // Default border color, subtle variant in global.css
        input: '#1D2631',
        ring: '#EE2726',

        // Chart colors - using Omuto palette
        chart: {
          '1': '#EE2726',
          '2': '#FFCF5D',
          '3': '#40D2AF',
          '4': '#3591FF',
          '5': '#1D2631',
        },

        // Sidebar - high contrast light theme
        sidebar: {
          DEFAULT: '#FFFFFF',
          foreground: '#1D2631',
          primary: '#EE2726',
          'primary-foreground': '#FFFFFF',
          accent: '#F9F8F3',
          'accent-foreground': '#EE2726',
          border: '#1D2631',
          ring: '#EE2726',
        },
      },
      boxShadow: {
        'comic': '4px 4px 0 rgba(29, 38, 49, 1)', /* Default comic shadow */
        'comic-sm': '2px 2px 0 rgba(29, 38, 49, 1)', /* Smaller comic shadow */
        'comic-lg': '6px 6px 0 rgba(29, 38, 49, 1)', /* Larger comic shadow for hover/active */
        'soft': '0 4px 10px rgba(0,0,0,0.05), 0 2px 5px rgba(0,0,0,0.02)', /* Softer shadow */
      },
      borderWidth: {
        DEFAULT: '1px', // Default subtle border
        '2': '2px',
        '3': '3px',
        '4': '4px',
        '6': '6px',
        'px': '1px', // Custom addition for explicit 1px usage
        'md': '2px', // Custom addition for medium border
        'lg': '3px', // Custom addition for large border
        'xl': '4px', // Custom addition for extra large border
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.375rem',
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
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
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
