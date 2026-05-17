/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		fontFamily: {
  			inter: ['var(--font-inter)'],
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			},
        neon: {
          blue: '#14B8D4',
          purple: '#6D56E8',
          green: '#00D99A',
          orange: '#E87D00',
        }
  		},
  		keyframes: {
  			'accordion-down': {
  				from: { height: '0' },
  				to: { height: 'var(--radix-accordion-content-height)' }
  			},
  			'accordion-up': {
  				from: { height: 'var(--radix-accordion-content-height)' },
  				to: { height: '0' }
  			},
        'pulse-neon': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
        'pulse-neon': 'pulse-neon 2s ease-in-out infinite',
        'fade-in-up': 'fade-in-up 0.4s cubic-bezier(0.16,1,0.3,1) both',
        'shimmer': 'shimmer 2s linear infinite',
  		},
      boxShadow: {
        'neon-blue': '0 0 7px rgba(20,184,212,0.32), 0 0 20px rgba(20,184,212,0.11)',
        'neon-purple': '0 0 7px rgba(109,86,232,0.32), 0 0 20px rgba(109,86,232,0.11)',
        'neon-green': '0 0 7px rgba(0,217,154,0.32), 0 0 20px rgba(0,217,154,0.11)',
        'neon-orange': '0 0 7px rgba(232,125,0,0.32), 0 0 20px rgba(232,125,0,0.11)',
        'card': '0 4px 24px rgba(0,0,0,0.4), 0 1px 4px rgba(0,0,0,0.3)',
        'card-hover': '0 8px 32px rgba(0,212,255,0.12), 0 2px 8px rgba(0,0,0,0.5)',
      }
  	}
  },
  plugins: [require("tailwindcss-animate")],
  safelist: [
    'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-blue-500', 'bg-purple-500', 'bg-teal-500',
    'text-green-500', 'text-yellow-500', 'text-red-500', 'text-blue-500',
    'bg-green-500/10', 'bg-yellow-500/10', 'bg-red-500/10', 'bg-blue-500/10',
    'text-green-400', 'text-yellow-400', 'text-red-400', 'text-blue-400',
    'border-green-500/30', 'border-yellow-500/30', 'border-red-500/30', 'border-blue-500/30',
    'shadow-neon-blue', 'shadow-neon-purple', 'shadow-neon-green', 'shadow-neon-orange',
    'glow-blue', 'glow-purple', 'glow-green', 'glow-orange', 'glow-red',
    'neon-progress-blue', 'neon-progress-green', 'neon-progress-red',
    'border-neon', 'border-neon-purple', 'border-neon-green',
    'card-3d', 'btn-neon',
  ],
}
