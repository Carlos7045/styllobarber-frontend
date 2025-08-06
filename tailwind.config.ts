import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Sistema de cores StylloBarber
        primary: {
          black: "#000000",
          gold: "#D4AF37",
          "gold-light": "#E6C757",
          "gold-dark": "#B8941F",
        },
        secondary: {
          graphite: "#1F1F1F",
          "graphite-light": "#2A2A2A",
          "graphite-dark": "#0F0F0F",
          "graphite-card": "#252525",
          "graphite-hover": "#2F2F2F",
          petrol: "#1B4D4D",
          "petrol-light": "#2A6B6B",
          "petrol-dark": "#0F3333",
          "dark-red": "#8B0000",
          "dark-red-light": "#A50000",
          "dark-red-dark": "#660000",
        },
        neutral: {
          white: "#FFFFFF",
          "light-gray": "#F5F5F5",
          "medium-gray": "#9CA3AF", 
          "dark-gray": "#374151",
          "darker-gray": "#1F2937",
        },
        // Cores de estado
        success: {
          DEFAULT: "#10B981",
          light: "#34D399",
          dark: "#059669",
        },
        warning: {
          DEFAULT: "#F59E0B",
          light: "#FBBF24",
          dark: "#D97706",
        },
        error: {
          DEFAULT: "#EF4444",
          light: "#F87171",
          dark: "#DC2626",
        },
        info: {
          DEFAULT: "#3B82F6",
          light: "#60A5FA",
          dark: "#2563EB",
        },
        // Cores para componentes específicos
        background: {
          primary: "#FFFFFF",
          secondary: "#F5F5F5",
          dark: "#0F0F0F",
          "dark-secondary": "#1A1A1A",
          "dark-card": "#1A1A1A",
          "dark-elevated": "#252525",
        },
        text: {
          primary: "#000000",
          secondary: "#374151",
          muted: "#9CA3AF",
          inverse: "#FFFFFF",
        },
        // Cores semânticas para componentes
        semantic: {
          error: "#EF4444",
          "error-light": "#F87171",
          "error-dark": "#DC2626",
          success: "#10B981",
          "success-light": "#34D399",
          "success-dark": "#059669",
          warning: "#F59E0B",
          "warning-light": "#FBBF24",
          "warning-dark": "#D97706",
        },
        "muted-foreground": "#9CA3AF",
        border: {
          DEFAULT: "#E5E7EB",
          dark: "#374151",
          gold: "#D4AF37",
        },
      },
      fontFamily: {
        // Sistema tipográfico StylloBarber
        heading: ["var(--font-montserrat)", "Montserrat", "sans-serif"],
        display: ["Bebas Neue", "sans-serif"],
        body: ["var(--font-inter)", "Inter", "sans-serif"],
        interface: ["var(--font-poppins)", "Poppins", "sans-serif"],
      },
      fontSize: {
        // Escala tipográfica
        "xs": ["0.75rem", { lineHeight: "1rem" }],
        "sm": ["0.875rem", { lineHeight: "1.25rem" }],
        "base": ["1rem", { lineHeight: "1.5rem" }],
        "lg": ["1.125rem", { lineHeight: "1.75rem" }],
        "xl": ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
        "5xl": ["3rem", { lineHeight: "1" }],
        "6xl": ["3.75rem", { lineHeight: "1" }],
        "7xl": ["4.5rem", { lineHeight: "1" }],
        "8xl": ["6rem", { lineHeight: "1" }],
        "9xl": ["8rem", { lineHeight: "1" }],
      },
      spacing: {
        // Sistema de espaçamento
        "18": "4.5rem",
        "88": "22rem",
        "128": "32rem",
      },
      borderRadius: {
        // Sistema de border radius
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      boxShadow: {
        // Sombras customizadas
        "gold": "0 4px 14px 0 rgba(212, 175, 55, 0.25)",
        "gold-lg": "0 10px 25px -3px rgba(212, 175, 55, 0.3)",
        "dark": "0 4px 14px 0 rgba(0, 0, 0, 0.15)",
        "dark-lg": "0 10px 25px -3px rgba(0, 0, 0, 0.25)",
        "dark-card": "0 2px 8px 0 rgba(0, 0, 0, 0.3)",
        "dark-elevated": "0 4px 12px 0 rgba(0, 0, 0, 0.4)",
      },
      animation: {
        // Animações customizadas
        "fade-in": "fadeIn 0.5s ease-in-out",
        "fade-out": "fadeOut 0.5s ease-in-out",
        "slide-in-left": "slideInLeft 0.3s ease-out",
        "slide-in-right": "slideInRight 0.3s ease-out",
        "slide-in-up": "slideInUp 0.3s ease-out",
        "slide-in-down": "slideInDown 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
        "scale-out": "scaleOut 0.2s ease-out",
        "bounce-subtle": "bounceSubtle 0.6s ease-in-out",
        "pulse-gold": "pulseGold 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow": "spin 3s linear infinite",
        "spin-fast": "spin 0.5s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeOut: {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        slideInLeft: {
          "0%": { transform: "translateX(-100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        slideInRight: {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        slideInUp: {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideInDown: {
          "0%": { transform: "translateY(-100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        scaleOut: {
          "0%": { transform: "scale(1)", opacity: "1" },
          "100%": { transform: "scale(0.9)", opacity: "0" },
        },
        bounceSubtle: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
        pulseGold: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(212, 175, 55, 0.7)" },
          "70%": { boxShadow: "0 0 0 10px rgba(212, 175, 55, 0)" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};

export default config;