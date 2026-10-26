/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Midnight Terminal Palette
        bg: {
          base: '#0d1117',
          surface: '#161b22',
          elevated: '#21262d',
          hover: '#30363d',
        },
        text: {
          primary: '#e6edf3',
          secondary: '#8b949e',
          tertiary: '#6e7681',
          link: '#58a6ff',
        },
        border: {
          default: '#30363d',
          muted: '#21262d',
        },
        accent: {
          blue: '#58a6ff',
          green: '#3fb950',
          orange: '#d29922',
          red: '#f85149',
          purple: '#a371f7',
        },
        // Keep some utility colors
        gray: {
          950: '#0d1117',
          900: '#161b22',
          800: '#21262d',
          700: '#30363d',
          600: '#484f58',
          500: '#6e7681',
          400: '#8b949e',
          300: '#b1bac4',
          200: '#c9d1d9',
          100: '#e6edf3',
        },
      },
      fontFamily: {
        mono: [
          'JetBrains Mono',
          'SF Mono',
          'Fira Code',
          'Consolas',
          'Monaco',
          'monospace',
        ],
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Noto Sans',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
      fontSize: {
        'xxs': ['0.6875rem', { lineHeight: '1rem' }],     // 11px
        'xs': ['0.75rem', { lineHeight: '1.125rem' }],    // 12px
        'sm': ['0.8125rem', { lineHeight: '1.25rem' }],   // 13px
        'base': ['0.875rem', { lineHeight: '1.375rem' }], // 14px
        'md': ['1rem', { lineHeight: '1.5rem' }],         // 16px
      },
      spacing: {
        '0.5': '0.125rem',
        '1.5': '0.375rem',
        '2.5': '0.625rem',
      },
      borderRadius: {
        'sm': '0.25rem',
        'DEFAULT': '0.375rem',
        'md': '0.5rem',
      },
      boxShadow: {
        'subtle': '0 1px 2px rgba(0, 0, 0, 0.3)',
        'card': '0 1px 3px rgba(0, 0, 0, 0.4)',
      },
    },
  },
  plugins: [],
}
