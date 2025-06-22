import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    fontFamily: {
      sans: ["var(--font-dm-sans)", "sans-serif"],
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // ZyxAI Custom Colors
        voice: {
          primary: "hsl(var(--voice-primary))",
          secondary: "hsl(var(--voice-secondary))",
        },
        ai: {
          primary: "hsl(var(--ai-primary))",
          secondary: "hsl(var(--ai-secondary))",
        },
        automation: {
          DEFAULT: "hsl(var(--automation))",
          light: "hsl(var(--automation-light))",
        },
        warning: "hsl(var(--warning))",
        info: "hsl(var(--info))",
        success: "hsl(var(--success))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' }
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' }
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 8px 2px hsl(199 89% 48% / 0.3)' },
          '50%': { boxShadow: '0 0 20px 5px hsl(199 89% 48% / 0.5)' }
        },
        voiceWave: {
          '0%, 100%': { transform: 'scaleY(1)' },
          '25%': { transform: 'scaleY(1.5)' },
          '50%': { transform: 'scaleY(0.8)' },
          '75%': { transform: 'scaleY(1.2)' }
        },
        aiPulse: {
          '0%, 100%': { boxShadow: '0 0 0 0 hsl(199 89% 48% / 0.4)' },
          '50%': { boxShadow: '0 0 0 20px hsl(199 89% 48% / 0)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        },
        rotate: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        },
        shine: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' }
        },
        spinSlow: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        },
        wave: {
          '0%, 100%': { transform: 'translateY(0)' },
          '25%': { transform: 'translateY(-8px)' },
          '50%': { transform: 'translateY(0)' },
          '75%': { transform: 'translateY(8px)' }
        },
        ripple: {
          '0%': { transform: 'scale(0.95)', opacity: '0.8' },
          '50%': { transform: 'scale(1.05)', opacity: '0.5' },
          '100%': { transform: 'scale(0.95)', opacity: '0.8' }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        'float': 'float 6s ease-in-out infinite',
        'pulse': 'pulse 3s ease-in-out infinite',
        'fadeIn': 'fadeIn 0.6s ease-out forwards',
        'slideInLeft': 'slideInLeft 0.6s ease-out forwards',
        'slideInRight': 'slideInRight 0.6s ease-out forwards',
        'glow': 'glow 3s ease-in-out infinite',
        'voiceWave': 'voiceWave 1.5s ease-in-out infinite',
        'aiPulse': 'aiPulse 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'rotate': 'rotate 20s linear infinite',
        'shine': 'shine 8s ease-in-out infinite',
        'spinSlow': 'spinSlow 20s linear infinite',
        'wave': 'wave 4s ease-in-out infinite',
        'ripple': 'ripple 4s ease-in-out infinite'
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-ai': 'linear-gradient(135deg, hsl(199 89% 48%) 0%, hsl(189 85% 55%) 100%)',
        'gradient-voice': 'linear-gradient(135deg, hsl(263 70% 50%) 0%, hsl(280 60% 60%) 100%)',
        'gradient-automation': 'linear-gradient(135deg, hsl(142 76% 36%) 0%, hsl(142 76% 46%) 100%)',
        'gradient-mesh': 'radial-gradient(circle at 25% 25%, hsl(199 89% 48% / 0.1) 0%, transparent 50%), radial-gradient(circle at 75% 75%, hsl(263 70% 50% / 0.1) 0%, transparent 50%)',
        'neural-network': 'radial-gradient(circle at 20% 20%, hsl(199 89% 48% / 0.1) 1px, transparent 1px), radial-gradient(circle at 80% 80%, hsl(263 70% 50% / 0.1) 1px, transparent 1px)',
      },
      transitionDuration: {
        '1500': '1500ms',
        '2000': '2000ms',
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
