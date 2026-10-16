/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Ottobon Platform Palette Semantic Tokens ──
        'lp-bg':             'var(--lp-bg)',
        'lp-surface':        'var(--lp-surface)',
        'lp-section-cool':   'var(--lp-section-cool)',
        'lp-section-blue':   'var(--lp-section-blue)',
        'lp-section-warm':   'var(--lp-section-warm)',
        'lp-section-alt':    'var(--lp-section-alt)',
        'lp-deep':           'var(--lp-deep)',
        'lp-heading':        'var(--lp-heading)',
        'lp-body':           'var(--lp-body)',
        'lp-muted':          'var(--lp-muted)',
        'lp-border':         'var(--lp-border)',
        'lp-border-decor':   'var(--lp-border-decor)',
        'lp-border-inter':   'var(--lp-border-inter)',
        'lp-cta-primary':    'var(--lp-cta-primary)',
        'lp-cta-hover':      'var(--lp-cta-hover)',
        'lp-cta-text':       'var(--lp-cta-text)',
        'lp-teal':           'var(--lp-teal)',
        'lp-teal-surface':   'var(--lp-teal-surface)',
        'lp-success':        'var(--lp-success)',
        'lp-success-surface':'var(--lp-success-surface)',

        // Backwards compatibility aliases
        'lp-ink':            'var(--lp-heading)',
        'lp-accent':         'var(--lp-cta-primary)',
        'lp-accent-hover':   'var(--lp-cta-hover)',
        'lp-tech-surface':   'var(--lp-section-blue)',
      },
      fontFamily: {
        serif: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        sans:  ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono:  ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      maxWidth: {
        'content': '1200px',
        'prose-lp': '65ch',
      },
      borderRadius: {
        'card': '8px',
        'btn': '6px',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s infinite',
      },
    },
  },
  plugins: [],
}
