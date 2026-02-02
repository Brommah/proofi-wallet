/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#FFFFFF',
        'bg-off': '#FAFAFA',
        surface: '#F5F5F5',
        border: '#E0E0E0',
        'border-strong': '#000000',
        text: '#0A0A0A',
        'text-dim': '#6B6B6B',
        'text-muted': '#999999',
        accent: '#3B82F6',
        'accent-hover': '#2563EB',
        'accent-light': '#60A5FA',
        success: '#10B981',
        danger: '#EF4444',
        warning: '#F59E0B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        none: '0',
      },
    },
  },
  plugins: [],
};
