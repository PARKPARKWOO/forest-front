/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          primary: 'var(--forest-color-brand-primary)',
          strong: 'var(--forest-color-brand-strong)',
          accent: 'var(--forest-color-accent)',
          text: {
            primary: 'var(--forest-color-text-primary)',
            muted: 'var(--forest-color-text-muted)',
            inverse: 'var(--forest-color-text-inverse)',
          },
          surface: {
            DEFAULT: 'var(--forest-color-brand-surface)',
            page: 'var(--forest-color-surface-page)',
            card: 'var(--forest-color-surface-card)',
            raised: 'var(--forest-color-surface-raised)',
            'inverse-hover': 'var(--forest-color-surface-inverse-hover)',
            scrim: 'var(--forest-color-surface-scrim)',
          },
          border: {
            subtle: 'var(--forest-color-border-subtle)',
            strong: 'var(--forest-color-border-strong)',
          },
          focus: 'var(--forest-color-focus-ring)',
          success: {
            surface: 'var(--forest-color-success-surface)',
            border: 'var(--forest-color-success-border)',
            text: 'var(--forest-color-success-text)',
          },
          warning: {
            surface: 'var(--forest-color-warning-surface)',
            border: 'var(--forest-color-warning-border)',
            text: 'var(--forest-color-warning-text)',
          },
          danger: {
            surface: 'var(--forest-color-danger-surface)',
            border: 'var(--forest-color-danger-border)',
            text: 'var(--forest-color-danger-text)',
          },
          info: {
            surface: 'var(--forest-color-info-surface)',
            border: 'var(--forest-color-info-border)',
            text: 'var(--forest-color-info-text)',
          },
        },
        green: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        }
      },
      fontSize: {
        'forest-body': ['var(--forest-font-body-size)', { lineHeight: 'var(--forest-line-height-body)' }],
        'forest-admin': 'var(--forest-font-admin-size)',
        'forest-label': 'var(--forest-font-label-size)',
        'forest-supporting': 'var(--forest-font-supporting-size)',
        'forest-heading-1': ['var(--forest-font-heading-1-size)', { lineHeight: 'var(--forest-line-height-heading)' }],
        'forest-heading-2': ['var(--forest-font-heading-2-size)', { lineHeight: 'var(--forest-line-height-heading)' }],
        'forest-heading-3': ['var(--forest-font-heading-3-size)', { lineHeight: 'var(--forest-line-height-heading)' }],
      },
      spacing: {
        'forest-1': 'var(--forest-space-1)',
        'forest-2': 'var(--forest-space-2)',
        'forest-3': 'var(--forest-space-3)',
        'forest-4': 'var(--forest-space-4)',
        'forest-6': 'var(--forest-space-6)',
        'forest-8': 'var(--forest-space-8)',
        'forest-panel': 'var(--forest-panel-padding)',
      },
      minHeight: { 'forest-control': 'var(--forest-control-min-height)' },
      minWidth: { 'forest-control': 'var(--forest-icon-control-size)' },
      width: { 'forest-icon-control': 'var(--forest-icon-control-size)' },
      height: { 'forest-icon-control': 'var(--forest-icon-control-size)' },
      borderRadius: {
        'forest-control': 'var(--forest-radius-control)',
        'forest-card': 'var(--forest-radius-card)',
        'forest-dialog': 'var(--forest-radius-dialog)',
      },
      outlineWidth: { forest: 'var(--forest-focus-width)' },
      animation: {
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.5' },
        }
      },
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '8px',
      }
    },
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '2rem',
        lg: '4rem',
        xl: '5rem',
        '2xl': '6rem',
      },
    },
  },
  plugins: []
}
